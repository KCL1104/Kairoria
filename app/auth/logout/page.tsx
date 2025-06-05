"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/SupabaseAuthContext'

export default function LogoutPage() {
  const router = useRouter()
  const { signOut, isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    const performLogout = async () => {
      if (!isLoading) {
        if (isAuthenticated) {
          try {
            // Perform signOut
            await signOut()
            // The signOut function already handles redirection
          } catch (error) {
            console.error('Failed to sign out:', error)
            // Redirect even if signOut fails
            router.push('/auth/login?error=logout_failed')
          }
        } else {
          // Already signed out, redirect to home
          router.push('/')
        }
      }
    }

    performLogout()
  }, [signOut, router, isAuthenticated, isLoading])

  // Show loading state
  return (
    <div className="container max-w-lg py-10">
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Signing out...</p>
        </div>
      </div>
    </div>
  )
}