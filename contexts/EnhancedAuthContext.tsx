"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { enhancedAuth, supabase } from '@/lib/enhanced-supabase-client'
import { authStorage } from '@/lib/auth-storage'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface EnhancedAuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const EnhancedAuthContext = createContext<EnhancedAuthContextType | undefined>(undefined)

export function EnhancedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Initialize authentication state
  useEffect(() => {
    let mounted = true
    let crossTabCleanup: (() => void) | null = null

    const initializeAuth = async () => {
      try {
        // Check for existing session
        const { data, error } = await enhancedAuth.getSession()
        
        if (mounted) {
          if (data.session && !error) {
            setSession(data.session)
            setUser(data.session.user)
          } else {
            setSession(null)
            setUser(null)
          }
          setIsLoading(false)
        }

        // Setup cross-tab synchronization
        crossTabCleanup = enhancedAuth.setupCrossTabSync((sessionData) => {
          if (mounted) {
            if (sessionData) {
              setSession(sessionData)
              setUser(sessionData.user)
            } else {
              setSession(null)
              setUser(null)
            }
          }
        })

        // Listen for Supabase auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event)
            
            if (mounted) {
              setSession(session)
              setUser(session?.user ?? null)
              
              // Handle successful authentication
              if (event === 'SIGNED_IN' && session) {
                const currentPath = window.location.pathname
                const isAuthRoute = currentPath.startsWith('/auth/')
                
                if (isAuthRoute) {
                  // Check for callback URL
                  const urlParams = new URLSearchParams(window.location.search)
                  const callbackUrl = urlParams.get('callbackUrl') || '/'
                  
                  // Small delay to ensure token storage is complete
                  setTimeout(() => {
                    router.push(callbackUrl)
                  }, 500)
                }
              }
              
              // Handle sign out
              if (event === 'SIGNED_OUT') {
                authStorage.clearTokens()
              }
            }
          }
        )

        return () => {
          subscription.unsubscribe()
          if (crossTabCleanup) {
            crossTabCleanup()
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
      if (crossTabCleanup) {
        crossTabCleanup()
      }
    }
  }, [router])

  // Auto-refresh tokens before expiration
  useEffect(() => {
    if (!session) return

    const refreshInterval = setInterval(async () => {
      const tokens = authStorage.getTokens()
      if (tokens) {
        const timeUntilExpiry = tokens.expires_at - Date.now()
        
        // Refresh if token expires in less than 5 minutes
        if (timeUntilExpiry < 5 * 60 * 1000) {
          console.log('🔄 Auto-refreshing tokens...')
          await refreshSession()
        }
      }
    }, 60 * 1000) // Check every minute

    return () => clearInterval(refreshInterval)
  }, [session])

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const { data, error } = await enhancedAuth.signInWithPassword(email, password)
      
      if (data?.session) {
        setSession(data.session)
        setUser(data.session.user)
      }
      
      return { error }
    } catch (error) {
      console.error('Sign in error:', error)
      return { error }
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { error } = await enhancedAuth.signInWithOAuth('google')
      return { error }
    } catch (error) {
      console.error('Google sign in error:', error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      await enhancedAuth.signOut()
      
      setSession(null)
      setUser(null)
      
      // Redirect to home page
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshSession = async () => {
    try {
      const { data, error } = await enhancedAuth.refreshSession()
      
      if (data?.session && !error) {
        setSession(data.session)
        setUser(data.session.user)
      }
    } catch (error) {
      console.error('Refresh session error:', error)
    }
  }

  const value = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signInWithGoogle,
    signOut,
    refreshSession,
  }

  return (
    <EnhancedAuthContext.Provider value={value}>
      {children}
    </EnhancedAuthContext.Provider>
  )
}

export function useEnhancedAuth() {
  const context = useContext(EnhancedAuthContext)
  if (context === undefined) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider')
  }
  return context
}