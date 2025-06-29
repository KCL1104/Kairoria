"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Session, SupabaseClient } from '@supabase/supabase-js'
import { logAuthEvent, isProfileComplete } from '@/lib/auth-utils'
import { useRouter } from 'next/navigation'


interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isProfileLoading: boolean
  // Legacy auth methods - consider using UnifiedLoginForm component or /api/auth/unified-login endpoint
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
  sendEmailConfirmation: (email: string) => Promise<{ error: any }>
  refreshSession: () => Promise<void>
  isAuthenticated: boolean
  profile: any
}

const SupabaseAuthContext = createContext<AuthContextType | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const supabase: SupabaseClient = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const router = useRouter()
  
  // Helper to identify missing profile fields
  const getMissingFields = (profile: any): string[] => {
    const missingFields = []
    
    if (!profile.full_name) missingFields.push('full_name')
    if (!profile.username) missingFields.push('username')
    if (!profile.bio) missingFields.push('bio')
    if (!profile.location) missingFields.push('location')
    
    return missingFields
  }

  const createProfileIfNotExistsInternal = useCallback(async (userId: string) => {
    if (!supabase) {
      setProfile(null)
      return
    }

    try {
      console.log('🔍 Checking if profile exists for user:', userId)
      
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()
      
      if (existingProfile) {
        console.log('✅ Profile already exists')
        return
      }

      console.log('👤 Creating new profile...')
      
      // Get user data from auth
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('❌ No authenticated user found')
        return
      }

      // Create profile with basic info
      const profileData = {
        id: userId,
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
        username: user.user_metadata?.username || '',
        bio: '',
        location: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single()
      
      if (error) {
        console.error('❌ Error creating profile:', error)
        setProfile(null)
      } else {
        console.log('✅ Profile created successfully:', newProfile)
        setProfile(newProfile)
      }
    } catch (error) {
        console.error('❌ Exception creating profile:', error)
        setProfile(null)
      }
    }, [supabase])

  // Define fetchProfile at component level to be accessible by all functions
  const fetchProfileInternal = useCallback(async (userId: string) => {
    if (!supabase) {
      console.log('Supabase client not available for profile fetch')
      return
    }

    setIsProfileLoading(true)
    try {
      console.log('Fetching profile for userId:', userId)
      logAuthEvent('profile_fetch_start', { userId })
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      console.log('Profile fetch response:', { data, error })
      
      if (error) {
        console.error('Error fetching profile:', {
          code: error.code,
          message: error.message
        })
        
        logAuthEvent('profile_fetch_error', { 
          userId, 
          errorCode: error.code,
          errorMessage: error.message
        })
        
        // If profile doesn't exist (PGRST116), try to create it
        if (error.code === 'PGRST116') {
          console.log('Profile not found, attempting to create one...')
          logAuthEvent('profile_not_found_creating', { userId })
          await createProfileIfNotExistsInternal(userId)
        } else {
          // For other errors, set profile to null to prevent infinite loading
          setProfile(null)
        }
      } else {
        console.log('Profile fetched successfully:', data)
        setProfile(data)
        
        // Check if profile is complete and log the status
        const complete = isProfileComplete(data)
        logAuthEvent('profile_status', { 
          userId,
          isComplete: complete,
          missingFields: !complete ? getMissingFields(data) : []
        })
        
        logAuthEvent('profile_fetch_success', { userId })
      }
    } catch (error) {
      console.error('Profile fetch error:', error)
      logAuthEvent('profile_fetch_exception', { userId, error: String(error) })
      // Set profile to null on catch to prevent infinite loading
      setProfile(null)
    } finally {
      setIsProfileLoading(false)
    }
  }, [supabase, createProfileIfNotExistsInternal])


  // Define handleAuthStateChange as a callback
  const handleAuthStateChange = useCallback(async (event: any, session: any) => {
    console.log('🔄 Auth state changed:', event, session?.user?.id)
    logAuthEvent('auth_state_change', { event, userId: session?.user?.id })
    
    setSession(session)
    setUser(session?.user ?? null)
    
    if (session?.user) {
      await fetchProfileInternal(session.user.id)
    } else {
      setProfile(null)
    }
    
    // For OAuth success, ensure state is properly updated
    if (event === 'OAUTH_SUCCESS' || event === 'INITIAL_SESSION') {
      // Force a re-render to update UI components
      setIsLoading(false)
      // Small delay to ensure all state updates are processed
      setTimeout(() => {
        setIsLoading(false)
      }, 100)
    } else {
      setIsLoading(false)
    }
  }, [fetchProfileInternal])

  // Initialize auth state
  useEffect(() => {
    if (!supabase) {
      console.warn('❌ Supabase client not available')
      setIsLoading(false)
      return
    }

    const getInitialSession = async () => {
      console.log('🔄 Getting initial session...')
      logAuthEvent('session_init_start')
      
      try {
        // Add enhanced delay and retry mechanism for OAuth callback
        if (window.location.pathname === '/auth/callback') {
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Retry mechanism for OAuth callback
          let retryCount = 0
          const maxRetries = 2
          let session = null
          
          while (retryCount < maxRetries) {
            const { data: { session: currentSession } } = await supabase!.auth.getSession()
            if (currentSession) {
              session = currentSession
              break
            }
            await new Promise(resolve => setTimeout(resolve, 200))
            retryCount++
          }
          
          if (session) {
            await handleAuthStateChange('INITIAL_SESSION', session)
            return
          }
        }
        
        const { data: { session }, error } = await supabase!.auth.getSession()
        
        if (error) {
          console.error('Error getting initial session:', error)
          logAuthEvent('session_init_error', { error: error.message })
          
          // Try to refresh session if there's an error
          const { data: { session: refreshedSession } } = await supabase!.auth.refreshSession()
          if (refreshedSession) {
            await handleAuthStateChange('INITIAL_SESSION', refreshedSession)
            return
          }
        } else {
          console.log('📊 Initial session result:', {
            hasSession: !!session,
            hasUser: !!session?.user
          })
          
          await handleAuthStateChange('INITIAL_SESSION', session)
        }
      } catch (error) {
        console.error('Session initialization error:', error)
        setIsLoading(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      handleAuthStateChange
    )

    getInitialSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, handleAuthStateChange])

  // Additional OAuth success detection
  useEffect(() => {
    const handleOAuthSuccess = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('auth') === 'success') {
        console.log('🔄 OAuth success detected, forcing session refresh...')
        logAuthEvent('oauth_success_detected')
        
        // Multiple attempts to get session
        let attempts = 0
        const maxAttempts = 3
        
        while (attempts < maxAttempts) {
          try {
            const { data: { session } } = await supabase!.auth.getSession()
            if (session) {
              console.log('✅ OAuth session retrieved successfully')
              logAuthEvent('oauth_session_retrieved', { userId: session.user.id })
              await handleAuthStateChange('OAUTH_SUCCESS', session)
              return
            }
          } catch (error) {
            console.error('Error getting OAuth session:', error)
          }
          
          attempts++
          await new Promise(resolve => setTimeout(resolve, 300))
        }
        
        console.warn('⚠️ Failed to retrieve OAuth session after multiple attempts')
        logAuthEvent('oauth_session_retrieval_failed')
      }
    }

    // Only run on client side
    if (typeof window !== 'undefined') {
      handleOAuthSuccess()
    }
  }, [handleAuthStateChange])

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!supabase) {
      return { error: new Error('Supabase client not available') }
    }
    
    logAuthEvent('signup_attempt', { email })

    try {
      // Create user without sending confirmation email immediately
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        },
      })
      
      if (error) {
        logAuthEvent('signup_error', { 
          email,
          error: error.message
        })
      } else {
        logAuthEvent('signup_success', { 
          email,
          userId: data.user?.id
        })
      }
      
      return { data, error }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logAuthEvent('signup_exception', { 
        email,
        error: errorMessage
      })
      return { error: new Error(errorMessage) }
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase client not available') }
    }
    
    logAuthEvent('signin_attempt', { email })

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        logAuthEvent('signin_error', { 
          email,
          error: error.message
        })
      } else {
        logAuthEvent('signin_success', { 
          email,
          userId: data.user?.id
        })
      }
      
      return { data, error }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logAuthEvent('signin_exception', { 
        email,
        error: errorMessage
      })
      return { error: new Error(errorMessage) }
    }
  }

  const signOut = async () => {
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }
    
    logAuthEvent('signout_attempt')

    try {
      // Clear state first to prevent UI inconsistencies
      setSession(null)
      setUser(null)
      setProfile(null)
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        logAuthEvent('signout_error', { error: error.message })
        console.error('Sign out error:', error)
      } else {
        logAuthEvent('signout_success')
      }
      
      // Clear browser storage as backup
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logAuthEvent('signout_exception', { error: errorMessage })
      console.error('Sign out exception:', errorMessage)
      
      // Still clear state even if signOut fails
      setSession(null)
      setUser(null)
      setProfile(null)
    }
  }

  const signInWithGoogle = async (redirectTo?: string) => {
    if (!supabase) {
      return { error: new Error('Supabase client not available') }
    }
    
    logAuthEvent('google_signin_attempt')

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        logAuthEvent('google_signin_error', { error: error.message })
      } else {
        logAuthEvent('google_signin_success')
      }
      
      return { data, error }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logAuthEvent('google_signin_exception', { error: errorMessage })
      return { error: new Error(errorMessage) }
    }
  }

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { error: new Error('Supabase client not available') }
    }
    
    logAuthEvent('password_reset_attempt', { email })

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      
      if (error) {
        logAuthEvent('password_reset_error', { 
          email,
          error: error.message
        })
      } else {
        logAuthEvent('password_reset_success', { email })
      }
      
      return { data, error }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logAuthEvent('password_reset_exception', { 
        email,
        error: errorMessage
      })
      return { error: new Error(errorMessage) }
    }
  }

  const refreshSession = async () => {
    if (!supabase) {
      console.warn('❌ Supabase client not available for session refresh')
      return
    }
    
    try {
      console.log('🔄 Manually refreshing session...')
      logAuthEvent('manual_session_refresh_start')
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error refreshing session:', error)
        logAuthEvent('manual_session_refresh_error', { error: error.message })
      } else {
        setSession(session)
        setUser(session?.user ?? null)
        
        console.log('📊 Session refresh result:', {
          hasSession: !!session,
          hasUser: !!session?.user
        })
        
        logAuthEvent('manual_session_refresh_complete', { 
          hasSession: !!session,
          userId: session?.user?.id || undefined
        })
        
        if (session?.user) {
          await fetchProfileInternal(session.user.id)
        } else {
          setProfile(null)
        }
      }
    } catch (error) {
      console.error('Session refresh exception:', error)
      logAuthEvent('manual_session_refresh_exception', { error: String(error) })
    }
  }

  const value = {
    user,
    session,
    isLoading,
    isProfileLoading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    resetPassword,
    sendEmailConfirmation: async (email: string) => {
      try {
        logAuthEvent('email_confirmation_attempt', { email })
        
        const response = await fetch('/api/auth/send-confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        })

        const data = await response.json()

        if (!response.ok) {
          logAuthEvent('email_confirmation_error', { 
            email, 
            error: data.message || 'Failed to send confirmation email'
          })
          return { error: new Error(data.message || 'Failed to send confirmation email') }
        }

        logAuthEvent('email_confirmation_sent', { email })
        return { error: null }
      } catch (error) {
        logAuthEvent('email_confirmation_exception', { 
          email, 
          error: error instanceof Error ? error.message : String(error)
        })
        return { error: error instanceof Error ? error : new Error('Failed to send confirmation email') }
      }
    },
    refreshSession,
    isAuthenticated: !!user,
    profile,
  }

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  )
}

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext)
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider')
  }
  return context
}

export function useAuth() {
  const context = useContext(SupabaseAuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider')
  }
  return context
}