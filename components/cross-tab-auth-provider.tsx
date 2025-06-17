"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { crossTabAuth } from '@/lib/cross-tab-auth'
import { supabase } from '@/lib/supabase-client'

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
      
      if (event.type === 'TOKEN_UPDATE' && event.payload?.action === 'refresh_needed') {
        // Refresh token when needed
        try {
          const { data, error } = await supabase.auth.refreshSession()
          if (error) {
            console.error('Error refreshing session:', error)
          } else {
            console.log('Session refreshed successfully')
          }
        } catch (error) {
          console.error('Error during session refresh:', error)
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
      }
    } catch (error) {
      console.error('Error during manual session refresh:', error)
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