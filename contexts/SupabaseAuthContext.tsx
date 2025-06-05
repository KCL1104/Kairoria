"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User, Session } from '@supabase/supabase-js'
import { useWallet } from '@solana/wallet-adapter-react'

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
  
  // Check if environment variables are available
  const hasSupabaseConfig = 
    typeof window !== 'undefined' && 
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Only create Supabase client if we have the required config
  const supabase = hasSupabaseConfig ? createClientComponentClient() : null
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
      async (event, session) => {
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
      await supabase.auth.signOut()
      setProfile(null)
    } catch (error) {
      console.error('Error signing out:', error)
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