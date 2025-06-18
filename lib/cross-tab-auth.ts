"use client"
import { logAuthEvent } from '@/lib/auth-utils'

/**
 * Cross-tab authentication synchronization utility
 * Handles token persistence and synchronization across browser tabs
 */

interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_at?: number
  user_id?: string
}

interface AuthEvent {
  type: 'AUTH_STATE_CHANGE' | 'TOKEN_UPDATE' | 'SIGN_OUT'
  payload?: any
  timestamp: number
}

export class CrossTabAuth {
  private static instance: CrossTabAuth
  private channel: BroadcastChannel | null = null
  private storageKey = 'kairoria_auth_state'
  private tokenRefreshTimer: NodeJS.Timeout | null = null
  private listeners: Set<(event: AuthEvent) => void> = new Set()

  static getInstance(): CrossTabAuth {
    if (!CrossTabAuth.instance) {
      CrossTabAuth.instance = new CrossTabAuth()
    }
    return CrossTabAuth.instance
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeBroadcastChannel()
      this.setupStorageListener()
      this.setupTokenRefreshTimer()
    }
  }

  private initializeBroadcastChannel() {
    try {
      this.channel = new BroadcastChannel('kairoria_auth')
      this.channel.addEventListener('message', this.handleBroadcastMessage.bind(this))
      logAuthEvent('cross_tab_channel_initialized')
      console.log('🔄 Cross-tab auth channel initialized')
    } catch (error) {
      console.warn('BroadcastChannel not supported, falling back to storage events')
      logAuthEvent('cross_tab_channel_error', { error: String(error) })
    }
  }

  private setupStorageListener() {
    window.addEventListener('storage', (event) => {
      if (event.key === this.storageKey && event.newValue !== event.oldValue) {
        console.log('🔄 Auth state changed in another tab')
        this.handleStorageChange(event.newValue)
      }
    })
  }

  private setupTokenRefreshTimer() {
    // Check token expiration every 30 seconds
    this.tokenRefreshTimer = setInterval(() => {
      this.checkTokenExpiration()
    }, 30000)
  }

  private handleBroadcastMessage(event: MessageEvent<AuthEvent>) {
    console.log('📡 Received cross-tab message:', event.data)
    this.notifyListeners(event.data)
    logAuthEvent('cross_tab_message_received', { type: event.data.type })
  }

  private handleStorageChange(newValue: string | null) {
    if (newValue) {
      try {
        const authState = JSON.parse(newValue)
        this.notifyListeners({
          type: 'AUTH_STATE_CHANGE',
          payload: authState,
          timestamp: Date.now()
        })
        logAuthEvent('cross_tab_storage_change', { type: 'AUTH_STATE_CHANGE' })
      } catch (error) {
        console.error('Error parsing auth state from storage:', error)
        logAuthEvent('cross_tab_storage_parse_error', { error: String(error) })
      }
    } else {
      // Auth state was cleared
      this.notifyListeners({
        type: 'SIGN_OUT',
        timestamp: Date.now()
      })
      logAuthEvent('cross_tab_storage_cleared')
    }
  }

  private notifyListeners(event: AuthEvent) {
    this.listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('Error in auth event listener:', error)
      }
    })
  }

  private checkTokenExpiration() {
    const tokens = this.getStoredTokens()
    if (tokens && tokens.expires_at) {
      const now = Date.now() / 1000
      const timeUntilExpiry = tokens.expires_at - now
      
      // Refresh token if it expires in the next 5 minutes
      if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
        console.log('🔄 Token expiring soon, triggering refresh')
        logAuthEvent('token_refresh_needed', { 
          expiresAt: tokens.expires_at,
          timeUntilExpiry: Math.floor(timeUntilExpiry)
        })
        this.broadcastEvent({
          type: 'TOKEN_UPDATE',
          payload: { action: 'refresh_needed' },
          timestamp: Date.now()
        })
      }
    }
  }

  /**
   * Store authentication tokens securely across tabs
   */
  storeTokens(tokens: Partial<AuthTokens>) {
    try {
      const currentTokens = this.getStoredTokens() || {}
      const updatedTokens = { ...currentTokens, ...tokens }
      
      // Store in multiple locations for redundancy
      this.setSecureStorage('sb-access-token', updatedTokens.access_token || '')
      this.setSecureStorage('sb-refresh-token', updatedTokens.refresh_token || '')
      
      // Store user ID if available
      if (updatedTokens.user_id) {
        this.setSecureStorage('sb-user-id', updatedTokens.user_id)
      }
      
      // Store complete auth state
      const tokenInfo = {
        hasAccessToken: !!updatedTokens.access_token,
        hasRefreshToken: !!updatedTokens.refresh_token,
        expiresAt: updatedTokens.expires_at
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(updatedTokens))
      
      console.log('💾 Tokens stored successfully:', {
        ...tokenInfo
      })
      
      logAuthEvent('tokens_stored', tokenInfo)

      // Notify other tabs
      this.broadcastEvent({
        type: 'TOKEN_UPDATE',
        payload: updatedTokens,
        timestamp: Date.now()
      })

    } catch (error) {
      console.error('Error storing tokens:', error)
      logAuthEvent('token_storage_error', { error: String(error) })
    }
  }

  /**
   * Retrieve stored authentication tokens
   */
  getStoredTokens(): AuthTokens | null {
    try {
      // Try localStorage first
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        return JSON.parse(stored)
      }

      // Fallback to individual token storage
      const accessToken = this.getSecureStorage('sb-access-token')
      const refreshToken = this.getSecureStorage('sb-refresh-token')
      const userId = this.getSecureStorage('sb-user-id')
      
      if (accessToken && refreshToken) {
        return {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: 0, // Unknown expiry
          user_id: userId || ''
        }
      }

      return null
    } catch (error) {
      console.error('Error retrieving tokens:', error)
      return null
    }
  }

  /**
   * Clear all authentication data
   */
  clearTokens() {
    try {
      // Clear localStorage
      localStorage.removeItem(this.storageKey)
      this.removeSecureStorage('sb-access-token')
      this.removeSecureStorage('sb-refresh-token')
      
      logAuthEvent('tokens_cleared')
      
      // Clear additional auth keys
      const authKeys = [
        'supabase.auth.token',
        'supabase-auth-token',
        'supabase-auth-state',
        'sb-provider-token',
        'sb-auth-token',
        'sb-user-token'
      ]
      
      authKeys.forEach(key => {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      })
      
      console.log('🧹 Auth tokens cleared')
      
      // Notify other tabs
      this.broadcastEvent({
        type: 'SIGN_OUT',
        timestamp: Date.now()
      })
      
    } catch (error) {
      console.error('Error clearing tokens:', error)
      logAuthEvent('token_clear_error', { error: String(error) })
    }
  }

  /**
   * Subscribe to auth events across tabs
   */
  subscribe(callback: (event: AuthEvent) => void): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Broadcast an auth event to all tabs
   */
  broadcastEvent(event: AuthEvent) {
    // Notify local listeners
    this.notifyListeners(event)
    
    // Broadcast to other tabs
    if (this.channel) {
      try {
        this.channel.postMessage(event)
      } catch (error) {
        console.error('Error broadcasting event:', error)
        logAuthEvent('broadcast_error', { error: String(error) })
      }
    }
    
    // Fallback: update localStorage to trigger storage events
    if (event.type === 'TOKEN_UPDATE' && event.payload) {
      localStorage.setItem(this.storageKey, JSON.stringify(event.payload))
    } else if (event.type === 'SIGN_OUT') {
      localStorage.removeItem(this.storageKey)
    }
  }

  /**
   * Set a value in secure storage (localStorage + cookies)
   */
  private setSecureStorage(key: string, value: string) {
    // Store in localStorage
    localStorage.setItem(key, value)
    
    // Also store as cookie for redundancy and server access
    if (typeof document !== 'undefined') {
      const maxAge = key.includes('refresh') ? 30 * 24 * 60 * 60 : 60 * 60 // 30 days for refresh, 1 hour for access
      const secure = window.location.protocol === 'https:'

      // Set cookie with enhanced security options
      document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${secure ? '; Secure' : ''}; HttpOnly`
    }
  }

  /**
   * Get a value from secure storage
   */
  private getSecureStorage(key: string): string | null {
    try {
      // Try localStorage first
      const value = localStorage.getItem(key)
      if (value) return value

      // Fallback to cookies
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';')
        const cookie = cookies.find(c => c.trim().startsWith(`${key}=`))
        if (cookie) {
          return decodeURIComponent(cookie.split('=')[1])
        }
      }
      return null
    } catch (error) {
      console.error('Error getting item from secure storage:', error)
      return null
    }
  }

  /**
   * Remove a value from secure storage
   */
  private removeSecureStorage(key: string) {
    // Remove from localStorage
    localStorage.removeItem(key)
    
    // Remove from cookies
    if (typeof document !== 'undefined') {
      // Multiple cookie clearing strategies for maximum effectiveness
      const clearOptions = [
        `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
        `${key}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
        `${key}=; path=/; domain=.${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      ]
      
      clearOptions.forEach(option => {
        document.cookie = option
      })
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.channel) {
      this.channel.close()
    }
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer)
    }
    this.listeners.clear()
  }
}

// Export singleton instance
export const crossTabAuth = CrossTabAuth.getInstance()