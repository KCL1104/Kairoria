"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/SupabaseAuthContext'

/**
 * A hook to protect routes that require authentication
 * @param redirectTo - Where to redirect if not authenticated (defaults to login page)
 * @returns An object with the auth state
 */
export function useProtectedRoute(redirectTo: string = '/auth/login') {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only check after auth state is loaded
    if (!isLoading && !isAuthenticated) {
      // Redirect to login page with callback URL
      const callbackUrl = encodeURIComponent(window.location.pathname)
      router.push(`${redirectTo}?callbackUrl=${callbackUrl}`)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])
  return { isAuthenticated, isLoading, user }
}

/**
 * A hook to redirect authenticated users away from auth pages
 * @param redirectTo - Where to redirect if authenticated (defaults to profile)
 * @returns An object with the auth state
 */
export function useAuthRedirect(redirectTo: string = '/profile') {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect after auth state is loaded
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  return { isAuthenticated, isLoading }
}