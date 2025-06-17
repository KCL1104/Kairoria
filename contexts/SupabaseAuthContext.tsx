"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { User, Session } from '@supabase/supabase-js'
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
  signInWithTwitter: () => Promise<{ error: any }>
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
      console.warn('Supabase client not available')
      setIsLoading(false)
      return
    }

    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
          
          if (session?.user) {
            await fetchProfile(session.user.id)
          }
        }
      } catch (error) {
        console.error('Session initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
          
          // After successful authentication, check if we need to redirect away from auth routes
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
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

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    if (!supabase) {
      console.log('Supabase client not available for profile fetch')
      return
    }
    
    setIsProfileLoading(true)
    try {
      console.log('Fetching profile for userId:', userId)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      console.log('Profile fetch response:', { data, error })
      
      if (error) {
        console.error('Error fetching profile:', error)
        console.error('Profile error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        
        // If profile doesn't exist (PGRST116), try to create it
        if (error.code === 'PGRST116') {
          console.log('Profile not found, attempting to create one...')
          await createProfileIfNotExists(userId)
        } else {
          // For other errors, set profile to null to prevent infinite loading
          setProfile(null)
        }
      } else {
        console.log('Profile fetched successfully:', data)
        setProfile(data)
      }
    } catch (error) {
      console.error('Profile fetch error:', error)
      // Set profile to null on catch to prevent infinite loading
      setProfile(null)
    } finally {
      setIsProfileLoading(false)
    }
  }

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
        setProfile(null)
        return
      }

      console.log('Creating profile for user:', {
        id: userId,
        email: user.email,
        full_name: user.user_metadata?.full_name
      })

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
        // Set profile to null if creation fails to prevent infinite loading
        setProfile(null)
      } else {
        console.log('Profile created successfully:', data)
        setProfile(data)
      }
    } catch (error) {
      console.error('Create profile error:', error)
      // Set profile to null on catch to prevent infinite loading
      setProfile(null)
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!supabase) {
      return { error: new Error('Supabase client not available') }
    }

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
      return { data, error }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase client not available') }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    // Use the instant sign-out utility for immediate feedback
    await instantSignOut.performInstantSignOut({
      onStart: () => {
        // Immediately clear local state for instant UI feedback
        setUser(null)
        setSession(null)
        setProfile(null)
      },
      onSuccess: () => {
        console.log('Sign-out completed successfully')
      },
      onError: (error) => {
        console.error('Sign-out error:', error)
        // Even on error, keep the state cleared to prevent inconsistency
      },
      redirectTo: '/'
    })
  }

  const signInWithGoogle = async () => {
    if (!supabase) {
      return { error: new Error('Supabase client not available') }
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signInWithTwitter = async () => {
    if (!supabase) {
      return { error: new Error('Supabase client not available') }
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { error: new Error('Supabase client not available') }
    }

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const sendEmailConfirmation = async (email: string) => {
    try {
      const response = await fetch('/api/auth/send-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: new Error(data.message || 'Failed to send confirmation email') }
      }

      return { error: null }
    } catch (error) {
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
    signInWithTwitter,
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