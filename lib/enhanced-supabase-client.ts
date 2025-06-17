import { createClient } from '@supabase/supabase-js'
import { authStorage, TokenData } from './auth-storage'

// Enhanced Supabase client with persistent token storage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Custom storage implementation that uses our AuthTokenStorage
const customStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // Handle different Supabase storage keys
      if (key.includes('auth.token') || key.includes('session')) {
        const tokens = authStorage.getTokens()
        if (tokens) {
          return JSON.stringify({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: tokens.expires_at,
            user: { id: tokens.user_id }
          })
        }
      }
      
      // Fallback to localStorage for other keys
      return localStorage.getItem(key)
    } catch (error) {
      console.error('Error getting item from custom storage:', error)
      return null
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      // Handle Supabase session storage
      if (key.includes('auth.token') || key.includes('session')) {
        const sessionData = JSON.parse(value)
        
        if (sessionData.access_token && sessionData.refresh_token) {
          const tokenData: TokenData = {
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token,
            expires_at: sessionData.expires_at || (Date.now() + 60 * 60 * 1000),
            user_id: sessionData.user?.id || 'unknown',
            session_id: `session_${Date.now()}`
          }
          
          authStorage.setTokens(tokenData)
        }
      }
      
      // Also store in localStorage for compatibility
      localStorage.setItem(key, value)
    } catch (error) {
      console.error('Error setting item in custom storage:', error)
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      // Clear our custom storage if it's an auth-related key
      if (key.includes('auth.token') || key.includes('session')) {
        authStorage.clearTokens()
      }
      
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing item from custom storage:', error)
    }
  }
}

// Create enhanced Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: customStorage,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'kairoria-web'
    }
  }
})

// Enhanced authentication methods with token persistence
export const enhancedAuth = {
  /**
   * Sign in with email and password
   */
  async signInWithPassword(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Ensure tokens are properly stored
      if (data.session) {
        const tokenData: TokenData = {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 60 * 60 * 1000,
          user_id: data.session.user.id,
          session_id: `session_${Date.now()}`
        }
        
        authStorage.setTokens(tokenData)
      }

      return { data, error: null }
    } catch (error) {
      console.error('Enhanced sign in error:', error)
      return { data: null, error }
    }
  },

  /**
   * Sign in with OAuth (Google, etc.)
   */
  async signInWithOAuth(provider: 'google' | 'github' | 'twitter') {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })

      return { data, error }
    } catch (error) {
      console.error('Enhanced OAuth sign in error:', error)
      return { data: null, error }
    }
  },

  /**
   * Sign out and clear all tokens
   */
  async signOut() {
    try {
      // Clear tokens first
      authStorage.clearTokens()
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      
      if (error) {
        console.warn('Supabase sign out error:', error)
      }

      return { error: null }
    } catch (error) {
      console.error('Enhanced sign out error:', error)
      return { error }
    }
  },

  /**
   * Get current session with token validation
   */
  async getSession() {
    try {
      // First check our custom storage
      const tokens = authStorage.getTokens()
      
      if (tokens && authStorage.hasValidTokens()) {
        // Return session from our storage
        return {
          data: {
            session: {
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              expires_at: Math.floor(tokens.expires_at / 1000),
              user: { id: tokens.user_id }
            }
          },
          error: null
        }
      }

      // Fallback to Supabase session
      const { data, error } = await supabase.auth.getSession()
      
      // If Supabase has a session but our storage doesn't, sync it
      if (data.session && !tokens) {
        const tokenData: TokenData = {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 60 * 60 * 1000,
          user_id: data.session.user.id,
          session_id: `session_${Date.now()}`
        }
        
        authStorage.setTokens(tokenData)
      }

      return { data, error }
    } catch (error) {
      console.error('Enhanced get session error:', error)
      return { data: { session: null }, error }
    }
  },

  /**
   * Refresh session tokens
   */
  async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (data.session) {
        const tokenData: TokenData = {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 60 * 60 * 1000,
          user_id: data.session.user.id,
          session_id: `session_${Date.now()}`
        }
        
        authStorage.setTokens(tokenData)
      }

      return { data, error }
    } catch (error) {
      console.error('Enhanced refresh session error:', error)
      return { data: { session: null }, error }
    }
  },

  /**
   * Setup cross-tab synchronization
   */
  setupCrossTabSync(onAuthStateChange: (session: any) => void) {
    return authStorage.setupCrossTabSync((tokens) => {
      if (tokens) {
        onAuthStateChange({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Math.floor(tokens.expires_at / 1000),
          user: { id: tokens.user_id }
        })
      } else {
        onAuthStateChange(null)
      }
    })
  }
}

// Export both the original client and enhanced auth
export { supabase as originalSupabase }
export default supabase