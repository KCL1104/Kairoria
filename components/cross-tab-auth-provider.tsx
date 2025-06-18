"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { crossTabAuth } from '@/lib/cross-tab-auth'
import { supabase } from '@/lib/supabase-client'
import { logAuthEvent } from '@/lib/auth-utils'

interface CrossTabAuthContextType {
  isInitialized: boolean
  refreshSession: () => Promise<void>
}

const CrossTabAuthContext = createContext<CrossTabAuthContextType>({
  isInitialized: false,
  refreshSession: async () => {}
})

export function CrossTabAuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!supabase) return

    // Set up cross-tab auth listener
    const unsubscribe = crossTabAuth.subscribe(async (event) => {
      console.log('📡 Cross-tab auth event received:', event.type)
      logAuthEvent('cross_tab_event_received', { type: event.type })
      
      if (event.type === 'TOKEN_UPDATE' && event.payload?.action === 'refresh_needed') {
        // Refresh token when needed
        try {
          logAuthEvent('token_refresh_attempt')
          const { data, error } = await supabase.auth.refreshSession()
          if (error) {
            console.error('Error refreshing session:', error)
            logAuthEvent('token_refresh_error', { error: error.message })
          } else {
            console.log('Session refreshed successfully')
            logAuthEvent('token_refresh_success')
            
            // Update cross-tab auth with new tokens
            if (data.session) {
              crossTabAuth.storeTokens({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at,
                user_id: data.session.user.id
              })
            }
          }
        } catch (error) {
          console.error('Error during session refresh:', error)
          logAuthEvent('token_refresh_exception', { error: String(error) })
        }
      }
    })

    // Initialize
    setIsInitialized(true)

    return () => {
      unsubscribe()
    }
  }, [])

  const refreshSession = async () => {
    if (!supabase) return
    
    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Error refreshing session:', error)
        logAuthEvent('manual_refresh_error', { error: error.message })
        return
      }
      
      logAuthEvent('manual_refresh_success')
      
      // Update cross-tab auth with new tokens
      if (data.session) {
        crossTabAuth.storeTokens({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          user_id: data.session.user.id
        })
      }
    } catch (error) {
      console.error('Error during manual session refresh:', error)
      logAuthEvent('manual_refresh_exception', { error: String(error) })
    }
  }

  return (
    <CrossTabAuthContext.Provider value={{ isInitialized, refreshSession }}>
      {children}
    </CrossTabAuthContext.Provider>
  )
}

export function useCrossTabAuth() {
  return useContext(CrossTabAuthContext)
}