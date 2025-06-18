"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { User, Session } from '@supabase/supabase-js'
import { AuthDebugger } from '@/lib/auth-debug'
import { crossTabAuth } from '@/lib/cross-tab-auth'
import { logAuthEvent, isProfileComplete } from '@/lib/auth-utils'
import { useRouter } from 'next/navigation'
import { instantSignOut } from '@/lib/instant-signout'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isProfileLoading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
  sendEmailConfirmation: (email: string) => Promise<{ error: any }>
  isAuthenticated: boolean
  profile: any
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const router = useRouter()
  
  // Check if Supabase is configured
  const isSupabaseConfigured = !!supabase

  // Initialize auth state
  useEffect(() => {
    if (!supabase) {
      console.warn('❌ Supabase client not available')
      logAuthEvent('auth_context_error', { error: 'Supabase client not available' })
      setIsLoading(false)
      return
    }
    
    // Set up cross-tab auth listener
    const unsubscribeCrossTab = crossTabAuth.subscribe((event) => {
      console.log('📡 Cross-tab auth event:', event.type)
      logAuthEvent('cross_tab_event', { type: event.type })
      
      if (event.type === 'SIGN_OUT') {
        // Clear local state immediately
        setUser(null)
        setSession(null)
        setProfile(null)
      } else if (event.type === 'TOKEN_UPDATE' && event.payload?.action === 'refresh_needed') {
        // Refresh token if needed
        supabase.auth.refreshSession()
      } else if (event.type === 'AUTH_STATE_CHANGE' && event.payload) {
        // Update local state with new auth state
        if (event.payload.user) {
          setUser(event.payload.user)
          setSession(event.payload.session)
          fetchProfile(event.payload.user.id)
        }
      }
    })

    const getInitialSession = async () => {
      try {
        console.log('🔄 Getting initial session...')
        logAuthEvent('session_init_start')
        AuthDebugger.logAuthState('Initial Session Check')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          logAuthEvent('session_init_error', { error: error.message })
        } else {
          // Store session in cross-tab auth
          if (session) {
            crossTabAuth.storeTokens({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: session.expires_at,
              user_id: session.user.id
            })
          }
          
          setSession(session)
          setUser(session?.user ?? null)
          
          console.log('📊 Initial session result:', {
            hasSession: !!session,
            hasUser: !!session?.user
          })
          
          logAuthEvent('session_init_complete', { 
            hasSession: !!session,
            userId: session?.user?.id || undefined
          })
          
          if (session?.user) {
            await fetchProfile(session.user.id)
          }
        }
      } catch (error) {
        console.error('Session initialization error:', error)
        logAuthEvent('session_init_exception', { error: String(error) })
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.id)
        logAuthEvent('auth_state_change', { event, userId: session?.user?.id })
        
        // Update cross-tab auth state
        if (session) {
          crossTabAuth.storeTokens({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
            user_id: session.user.id
          })
        } else if (event === 'SIGNED_OUT') {
          crossTabAuth.clearTokens()
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
          
          // After successful authentication, check if we need to redirect away from auth routes
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log('✅ User signed in, checking for redirect...')
            AuthDebugger.logAuthState('After Sign In')
            logAuthEvent('sign_in_redirect_check')
            
            // Small delay to ensure profile is fetched
            setTimeout(() => {
              const currentPath = window.location.pathname
              const isAuthRoute = ['/auth/login', '/auth/register', '/auth/callback'].some(route => 
                currentPath.startsWith(route)
              )
              
              if (isAuthRoute) {
                // Check for callbackUrl in the current URL
                const urlParams = new URLSearchParams(window.location.search)
                const callbackUrl = urlParams.get('callbackUrl')
                
                // If there's a callbackUrl, redirect to it; otherwise go to home
                // Let middleware handle the redirect logic including profile completion check
                const redirectUrl = callbackUrl || '/'
                logAuthEvent('sign_in_redirect', { from: currentPath, to: redirectUrl })
                window.location.href = redirectUrl
              }
            }, 500) // Increased delay to ensure profile fetch completes
          }
        } else {
          setProfile(null)
        }
        
        // Only set loading to false after profile processing is complete
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
      unsubscribeCrossTab()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
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
          await createProfileIfNotExists(userId)
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
  }

  // Helper to identify missing profile fields
  const getMissingFields = (profile: any): string[] => {
    const missingFields = []
    
    if (!profile?.full_name) missingFields.push('full_name')
    if (!profile?.phone) missingFields.push('phone')
    if (!profile?.location) missingFields.push('location')
    if (profile?.is_email_verified !== true) missingFields.push('email_verification')
    if (profile?.is_phone_verified !== true) missingFields.push('phone_verification')
    
    return missingFields
  }

  /**
   * Create a profile if it doesn't exist yet
   */
  const createProfileIfNotExists = async (userId: string) => {
    if (!supabase) {
      setProfile(null)
      return
    }

    try {
      // Get current user data
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('Error getting user for profile creation:', userError)
        logAuthEvent('profile_creation_error', { 
          userId,
          error: userError?.message || 'No user found'
        })
        setProfile(null)
        return
      }

      console.log('Creating profile for user:', {
        id: userId,
        email: user.email,
        full_name: user.user_metadata?.full_name
      })
      logAuthEvent('profile_creation_start', { userId })

      // Check if Firebase is configured
      const isFirebaseConfigured = !!(
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      )

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: user.email,
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          is_email_verified: !isFirebaseConfigured && !!user.email_confirmed_at, // Auto-verify if Firebase not configured and email is verified
          is_phone_verified: false, // Phone verification will be handled separately
          bio: null,
          location: null,
          phone: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        logAuthEvent('profile_creation_error', { 
          userId,
          errorCode: error.code,
          errorMessage: error.message
        })
        // Set profile to null if creation fails to prevent infinite loading
        setProfile(null)
      } else {
        console.log('Profile created successfully:', data)
        setProfile(data)
        logAuthEvent('profile_creation_success', { userId })
      }
    } catch (error) {
      console.error('Create profile error:', error)
      logAuthEvent('profile_creation_exception', { userId, error: String(error) })
      // Set profile to null on catch to prevent infinite loading
      setProfile(null)
    }
  }

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
          userId: data?.user?.id
        })
      }
      
      return { data, error }
    } catch (error) {
      logAuthEvent('signup_exception', { email, error: String(error) })
      return { error }
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
          userId: data?.user?.id
        })
        
        // Store tokens in cross-tab auth
        if (data?.session) {
          crossTabAuth.storeTokens({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
            user_id: data.session.user.id
          })
        }
      }
      
      return { error }
    } catch (error) {
      logAuthEvent('signin_exception', { email, error: String(error) })
      return { error }
    }
  }

  const signOut = async () => {
    // Use the instant sign-out utility for immediate feedback
    await instantSignOut.performInstantSignOut({
      redirectTo: '/?signout=success',
      onStart: () => {
        logAuthEvent('signout_start', { userId: user?.id })
        // Immediately clear local state and cross-tab auth for instant UI feedback
        crossTabAuth.clearTokens()
        setUser(null)
        setSession(null)
        setProfile(null)
      },
      onSuccess: () => {
        console.log('Sign-out completed successfully')
        logAuthEvent('signout_success')
      },
      onError: (error) => {
        console.error('Sign-out error:', error)
        logAuthEvent('signout_error', { error: error.message })
        // Even on error, keep the state cleared to prevent inconsistency
      }
    })
  }

  const signInWithGoogle = async () => {
    if (!supabase) {
      return { error: new Error('Supabase client not available') }
    }
    
    logAuthEvent('google_signin_attempt')

    console.log('🔄 Starting Google OAuth...')
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            // Request offline access to get refresh token
            access_type: 'offline',
            // Force consent screen to ensure refresh token is always provided
            prompt: 'consent'
          }
        },
      })
      
      console.log('🔄 Google OAuth initiated:', {
        hasData: !!data,
        hasError: !!error,
        errorMessage: error?.message
      })
      
      if (error) {
        logAuthEvent('google_signin_error', { error: error.message })
      } else {
        logAuthEvent('google_signin_initiated')
      }
      
      return { error }
    } catch (error) {
      logAuthEvent('google_signin_exception', { error: String(error) })
      return { error }
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
        logAuthEvent('password_reset_error', { email, error: error.message })
      } else {
        logAuthEvent('password_reset_email_sent', { email })
      }
      
      return { error }
    } catch (error) {
      logAuthEvent('password_reset_exception', { email, error: String(error) })
      return { error }
    }
  }

  const sendEmailConfirmation = async (email: string) => {
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
    sendEmailConfirmation,
    isAuthenticated: !!user,
    profile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider')
  }
  return context
}