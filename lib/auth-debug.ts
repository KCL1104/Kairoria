"use client"

/**
 * Authentication debugging utilities
 */
export class AuthDebugger {
  static logAuthState(context: string) {
    if (typeof window === 'undefined') return

    console.group(`🔍 Auth Debug - ${context}`)
    
    // Check localStorage
    const localStorageKeys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.includes('supabase') || key.includes('auth') || key.includes('token'))) {
        localStorageKeys.push({
          key,
          value: localStorage.getItem(key)?.substring(0, 50) + '...'
        })
      }
    }
    
    // Check cookies
    const cookies = document.cookie.split(';').map(cookie => {
      const [name, value] = cookie.trim().split('=')
      return { name, value: value?.substring(0, 50) + '...' }
    }).filter(cookie => 
      cookie.name.includes('supabase') || 
      cookie.name.includes('auth') || 
      cookie.name.includes('token') ||
      cookie.name.includes('sb-')
    )
    
    console.log('📦 LocalStorage Auth Keys:', localStorageKeys)
    console.log('🍪 Auth Cookies:', cookies)
    console.log('🌐 Current URL:', window.location.href)
    console.log('📍 Pathname:', window.location.pathname)
    
    console.groupEnd()
  }

  static async testSupabaseConnection() {
    try {
      const { supabase } = await import('@/lib/supabase-client')
      if (!supabase) {
        console.error('❌ Supabase client not available')
        return false
      }

      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('🔐 Supabase Session Check:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasAccessToken: !!session?.access_token,
        hasRefreshToken: !!session?.refresh_token,
        error: error?.message
      })

      return !!session
    } catch (error) {
      console.error('❌ Supabase connection test failed:', error)
      return false
    }
  }

  static monitorAuthChanges() {
    if (typeof window === 'undefined') return

    // Monitor localStorage changes
    const originalSetItem = localStorage.setItem
    localStorage.setItem = function(key, value) {
      if (key.includes('supabase') || key.includes('auth') || key.includes('token')) {
        console.log(`📝 LocalStorage SET: ${key} = ${value.substring(0, 50)}...`)
      }
      return originalSetItem.apply(this, [key, value])
    }

    // Monitor cookie changes
    let lastCookies = document.cookie
    setInterval(() => {
      if (document.cookie !== lastCookies) {
        console.log('🍪 Cookies changed:', document.cookie)
        lastCookies = document.cookie
      }
    }, 1000)
  }
}

// Auto-start monitoring in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  AuthDebugger.monitorAuthChanges()
}