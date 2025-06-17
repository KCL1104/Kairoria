/**
 * Secure Authentication Token Storage Manager
 * Handles token persistence across browser tabs and sessions
 */

interface TokenData {
  access_token: string
  refresh_token: string
  expires_at: number
  user_id: string
  session_id: string
}

interface StorageConfig {
  cookieDomain?: string
  cookiePath?: string
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  maxAge?: number
}

class AuthTokenStorage {
  private config: StorageConfig
  private storageKey = 'supabase.auth.token'
  private refreshKey = 'supabase.auth.refresh_token'
  private sessionKey = 'supabase.auth.session'

  constructor(config: StorageConfig = {}) {
    this.config = {
      cookieDomain: config.cookieDomain || window.location.hostname,
      cookiePath: config.cookiePath || '/',
      secure: config.secure ?? (window.location.protocol === 'https:'),
      sameSite: config.sameSite || 'lax',
      maxAge: config.maxAge || 30 * 24 * 60 * 60, // 30 days
      ...config
    }
  }

  /**
   * Store authentication tokens securely
   */
  setTokens(tokenData: TokenData): void {
    try {
      const serializedData = JSON.stringify(tokenData)
      
      // 1. Store in localStorage for immediate access
      this.setLocalStorage(this.storageKey, serializedData)
      
      // 2. Store in sessionStorage for tab-specific data
      this.setSessionStorage(this.sessionKey, serializedData)
      
      // 3. Store in cookies for server-side access and cross-tab sync
      this.setCookie('sb-access-token', tokenData.access_token, {
        maxAge: 60 * 60, // 1 hour for access token
      })
      
      this.setCookie('sb-refresh-token', tokenData.refresh_token, {
        maxAge: this.config.maxAge, // 30 days for refresh token
      })
      
      this.setCookie('sb-user-id', tokenData.user_id, {
        maxAge: this.config.maxAge,
      })
      
      // 4. Broadcast to other tabs
      this.broadcastTokenUpdate(tokenData)
      
      console.log('✅ Tokens stored successfully across all storage mechanisms')
    } catch (error) {
      console.error('❌ Error storing tokens:', error)
      throw new Error('Failed to store authentication tokens')
    }
  }

  /**
   * Retrieve authentication tokens from storage
   */
  getTokens(): TokenData | null {
    try {
      // Try localStorage first (fastest)
      let tokenData = this.getFromLocalStorage()
      
      // Fallback to sessionStorage
      if (!tokenData) {
        tokenData = this.getFromSessionStorage()
      }
      
      // Fallback to cookies
      if (!tokenData) {
        tokenData = this.getFromCookies()
      }
      
      // Validate token expiration
      if (tokenData && this.isTokenExpired(tokenData)) {
        console.log('🔄 Token expired, attempting refresh...')
        return null
      }
      
      return tokenData
    } catch (error) {
      console.error('❌ Error retrieving tokens:', error)
      return null
    }
  }

  /**
   * Clear all stored tokens
   */
  clearTokens(): void {
    try {
      // Clear localStorage
      this.removeLocalStorage(this.storageKey)
      
      // Clear sessionStorage
      this.removeSessionStorage(this.sessionKey)
      
      // Clear cookies
      this.removeCookie('sb-access-token')
      this.removeCookie('sb-refresh-token')
      this.removeCookie('sb-user-id')
      
      // Clear any Supabase-related items
      this.clearSupabaseStorage()
      
      // Broadcast logout to other tabs
      this.broadcastLogout()
      
      console.log('✅ All tokens cleared successfully')
    } catch (error) {
      console.error('❌ Error clearing tokens:', error)
    }
  }

  /**
   * Check if tokens exist and are valid
   */
  hasValidTokens(): boolean {
    const tokens = this.getTokens()
    return tokens !== null && !this.isTokenExpired(tokens)
  }

  /**
   * Set up cross-tab synchronization
   */
  setupCrossTabSync(onTokenUpdate: (tokens: TokenData | null) => void): () => void {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === this.storageKey) {
        const newTokens = event.newValue ? JSON.parse(event.newValue) : null
        onTokenUpdate(newTokens)
      }
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'AUTH_TOKEN_UPDATE') {
        onTokenUpdate(event.data.tokens)
      } else if (event.data.type === 'AUTH_LOGOUT') {
        onTokenUpdate(null)
      }
    }

    // Listen for localStorage changes (cross-tab)
    window.addEventListener('storage', handleStorageChange)
    
    // Listen for broadcast messages
    window.addEventListener('message', handleMessage)

    // Return cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('message', handleMessage)
    }
  }

  // Private helper methods
  private setLocalStorage(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.warn('localStorage not available:', error)
    }
  }

  private setSessionStorage(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value)
    } catch (error) {
      console.warn('sessionStorage not available:', error)
    }
  }

  private setCookie(name: string, value: string, options: Partial<StorageConfig> = {}): void {
    try {
      const config = { ...this.config, ...options }
      const cookieString = [
        `${name}=${encodeURIComponent(value)}`,
        `path=${config.cookiePath}`,
        `max-age=${config.maxAge}`,
        `samesite=${config.sameSite}`,
        config.secure ? 'secure' : '',
        config.cookieDomain ? `domain=${config.cookieDomain}` : ''
      ].filter(Boolean).join('; ')

      document.cookie = cookieString
    } catch (error) {
      console.warn('Cookie setting failed:', error)
    }
  }

  private getFromLocalStorage(): TokenData | null {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.warn('Error reading from localStorage:', error)
      return null
    }
  }

  private getFromSessionStorage(): TokenData | null {
    try {
      const data = sessionStorage.getItem(this.sessionKey)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.warn('Error reading from sessionStorage:', error)
      return null
    }
  }

  private getFromCookies(): TokenData | null {
    try {
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = decodeURIComponent(value)
        return acc
      }, {} as Record<string, string>)

      const accessToken = cookies['sb-access-token']
      const refreshToken = cookies['sb-refresh-token']
      const userId = cookies['sb-user-id']

      if (accessToken && refreshToken && userId) {
        return {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: Date.now() + (60 * 60 * 1000), // 1 hour from now
          user_id: userId,
          session_id: `session_${Date.now()}`
        }
      }

      return null
    } catch (error) {
      console.warn('Error reading from cookies:', error)
      return null
    }
  }

  private removeLocalStorage(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Error removing from localStorage:', error)
    }
  }

  private removeSessionStorage(key: string): void {
    try {
      sessionStorage.removeItem(key)
    } catch (error) {
      console.warn('Error removing from sessionStorage:', error)
    }
  }

  private removeCookie(name: string): void {
    try {
      document.cookie = `${name}=; path=${this.config.cookiePath}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    } catch (error) {
      console.warn('Error removing cookie:', error)
    }
  }

  private clearSupabaseStorage(): void {
    try {
      // Clear all Supabase-related localStorage items
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('supabase') || key.startsWith('sb-'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))

      // Clear sessionStorage
      sessionStorage.clear()
    } catch (error) {
      console.warn('Error clearing Supabase storage:', error)
    }
  }

  private isTokenExpired(tokenData: TokenData): boolean {
    return Date.now() >= tokenData.expires_at
  }

  private broadcastTokenUpdate(tokens: TokenData): void {
    try {
      // Broadcast to other tabs/windows
      window.postMessage({
        type: 'AUTH_TOKEN_UPDATE',
        tokens
      }, window.location.origin)
    } catch (error) {
      console.warn('Error broadcasting token update:', error)
    }
  }

  private broadcastLogout(): void {
    try {
      window.postMessage({
        type: 'AUTH_LOGOUT'
      }, window.location.origin)
    } catch (error) {
      console.warn('Error broadcasting logout:', error)
    }
  }
}

// Export singleton instance
export const authStorage = new AuthTokenStorage({
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60, // 30 days
})

export type { TokenData, StorageConfig }