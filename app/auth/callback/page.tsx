"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth/login?error=callback_error')
          return
        }

        if (data.session) {
          // Successfully authenticated, redirect to home
          router.push('/')
        } else {
          // No session found, redirect to login
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Callback handling error:', error)
        router.push('/auth/login?error=callback_error')
      }
    }

    handleAuthCallback()
  }, [router, supabase.auth])

  return (
    <div className="container max-w-md py-20">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold">Completing sign in...</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Please wait while we complete your authentication.
        </p>
      </div>
    </div>
  )
} 