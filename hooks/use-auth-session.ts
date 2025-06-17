"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { logAuthEvent } from '@/lib/auth-utils'

interface UseAuthSessionOptions {
  redirectTo?: string
  redirectIfFound?: boolean
  refreshInterval?: number
}

/**
 * Hook to manage authentication session with automatic token refresh
 */
export function useAuthSession(options: UseAuthSessionOptions = {}) {
  const { 
    redirectTo = '/auth/login',
    redirectIfFound = false,
    refreshInterval = 5 * 60 * 1000 // 5 minutes
  } = options
  
  const { isAuthenticated, isLoading, user, session } = useAuth()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<number>(0)
  const router = useRouter()
  
  // Handle redirects based on authentication state
  useEffect(() => {
    if (!isLoading) {
      if (
        // Redirect if not authenticated and redirectTo is set
        (!isAuthenticated && redirectTo && !redirectIfFound) ||
        // Redirect if authenticated and redirectIfFound is true
        (isAuthenticated && redirectTo && redirectIfFound)
      ) {
        const callbackUrl = encodeURIComponent(window.location.pathname)
        const redirectUrl = redirectIfFound 
          ? redirectTo
          : `${redirectTo}?callbackUrl=${callbackUrl}`
          
        logAuthEvent('auth_redirect', {
          isAuthenticated,
          from: window.location.pathname,
          to: redirectUrl
        })
        
        router.replace(redirectUrl)
      }
    }
  }, [isAuthenticated, isLoading, redirectIfFound, redirectTo, router])
  
  // Calculate time until token expiration
  const calculateTimeUntilExpiry = useCallback(() => {
    if (!session?.expires_at) return null
    
    const expiresAt = session.expires_at
    const now = Math.floor(Date.now() / 1000)
    return expiresAt - now
  }, [session?.expires_at])
  
  // Refresh token function
  const refreshToken = useCallback(async () => {
    if (!isAuthenticated || isRefreshing) return
    
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        logAuthEvent('token_refresh_success', {
          userId: user?.id,
          newExpiresAt: data.expires_at
        })
        setLastRefresh(Date.now())
      } else {
        logAuthEvent('token_refresh_failed', {
          userId: user?.id,
          status: response.status
        })
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      logAuthEvent('token_refresh_error', {
        userId: user?.id,
        error: String(error)
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [isAuthenticated, isRefreshing, user?.id])
  
  // Set up token refresh
  useEffect(() => {
    if (!isAuthenticated || !session) return
    
    // Calculate when to refresh
    const calculateRefreshTime = () => {
      const timeUntilExpiry = calculateTimeUntilExpiry()
      
      if (timeUntilExpiry === null) return refreshInterval
      
      // If token expires in less than 5 minutes, refresh now
      if (timeUntilExpiry < 300) {
        return 0
      }
      
      // Otherwise, refresh at half the remaining time or the refresh interval, whichever is shorter
      return Math.min(timeUntilExpiry * 500, refreshInterval)
    }
    
    const refreshTime = calculateRefreshTime()
    
    // Set up refresh timer
    const refreshTimer = setTimeout(() => {
      refreshToken()
    }, refreshTime)
    
    return () => {
      clearTimeout(refreshTimer)
    }
  }, [isAuthenticated, session, refreshInterval, calculateTimeUntilExpiry, refreshToken, lastRefresh])
  
  // Force refresh function for manual refresh
  const forceRefresh = useCallback(async () => {
    await refreshToken()
  }, [refreshToken])
  
  // Get session status
  const getSessionStatus = useCallback(() => {
    if (!isAuthenticated || !session) {
      return { isValid: false, timeUntilExpiry: null }
    }
    
    const timeUntilExpiry = calculateTimeUntilExpiry()
    const isValid = timeUntilExpiry !== null && timeUntilExpiry > 0
    
    return {
      isValid,
      timeUntilExpiry,
      expiresAt: session.expires_at,
      isRefreshing
    }
  }, [isAuthenticated, session, calculateTimeUntilExpiry, isRefreshing])
  
  return {
    isAuthenticated,
    isLoading,
    user,
    session,
    isRefreshing,
    refreshToken: forceRefresh,
    sessionStatus: getSessionStatus()
  }
}

/**
 * Hook to protect routes that require authentication
 */
export function useProtectedSession(redirectTo: string = '/auth/login') {
  return useAuthSession({ redirectTo, redirectIfFound: false })
}

/**
 * Hook to redirect authenticated users away from certain routes (like login pages)
 */
export function useRedirectAuthenticated(redirectTo: string = '/') {
  return useAuthSession({ redirectTo, redirectIfFound: true })
}