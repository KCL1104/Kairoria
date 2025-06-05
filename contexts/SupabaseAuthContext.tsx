"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { User, Session } from '@supabase/supabase-js'
import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<{ error: any }>
  signInWithTwitter: () => Promise<{ error: any }>
  signInWithSolana: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
  isAuthenticated: boolean
  profile: any
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  
  // Check if environment variables are available - handle both naming conventions
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  const hasSupabaseConfig = 
    typeof window !== 'undefined' && 
    supabaseUrl && 
    supabaseAnonKey

  // Only create Supabase client if we have the required config
  const supabase = hasSupabaseConfig ? createClient(supabaseUrl!, supabaseAnonKey!) : null
  const { publicKey, signMessage } = useWallet()

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    // Get initial session
    const getSession = async () => {
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
        console.error('Session error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: Session | null) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const fetchProfile = async (userId: string) => {
    if (!supabase) return
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Profile fetch error:', error)
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!supabase) {
      return { error: new Error('Supabase client not available') }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      return { error }
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
    if (!supabase) return

    try {
      // First clear local Supabase session
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Supabase sign out error:', error)
        throw error
      }
      
      // Reset local state
      setUser(null)
      setSession(null)
      setProfile(null)
      
      // Clear any auth-related items from local storage
      if (typeof window !== 'undefined') {
        // Clear specific Supabase items
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (
              key.startsWith('supabase') || 
              key.startsWith('sb-') || 
              key.includes('auth') ||
              key.includes('token')
          )) {
            keysToRemove.push(key)
          }
        }
        
        // Remove collected keys (doing it separately to avoid issues with changing array during iteration)
        keysToRemove.forEach(key => localStorage.removeItem(key))
        
        // Also clear session storage
        sessionStorage.clear()
      }
      
      // Call backend logout endpoint (non-blocking)
      try {
        fetch('/api/auth/logout', { 
          method: 'POST',
          credentials: 'include',
          cache: 'no-store'
        }).catch(e => console.error('Logout API error:', e))
      } catch (apiError) {
        console.error('Error calling logout API:', apiError)
        // Continue with client-side logout even if API call fails
      }
      
      // Redirect to home page
      router.push('/')
      
      // Force reload to ensure all state is cleared in case any components haven't updated
      if (typeof window !== 'undefined') {
        // Timeout gives router.push a chance to start navigating before reload
        setTimeout(() => window.location.reload(), 100)
      }
      
    } catch (error) {
      console.error('Error signing out:', error)
      // Even if there's an error, we should still clear local state and redirect
      setUser(null)
      setSession(null)
      setProfile(null)
      router.push('/')
    }
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

  const signInWithSolana = async () => {
    if (!supabase) {
      return { error: new Error('Supabase client not available') }
    }

    try {
      if (!publicKey || !signMessage) {
        return { error: new Error('Wallet not connected') }
      }

      // Create a message to sign for authentication
      const message = `Sign this message to authenticate with Kairoria: ${Date.now()}`
      const encodedMessage = new TextEncoder().encode(message)
      
      // Sign the message with the wallet
      const signature = await signMessage(encodedMessage)
      
      // Use the wallet's public key as a unique identifier
      const walletAddress = publicKey.toString()
      
      // Create a custom auth session with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${walletAddress}@solana.wallet`,
        password: signature.toString(),
      })

      // If user doesn't exist, create them
      if (error && error.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: `${walletAddress}@solana.wallet`,
          password: signature.toString(),
          options: {
            data: {
              full_name: `Solana Wallet ${walletAddress.slice(0, 8)}...`,
              wallet_address: walletAddress,
              auth_provider: 'solana',
            },
          },
        })
        return { error: signUpError }
      }

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

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    signInWithTwitter,
    signInWithSolana,
    resetPassword,
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