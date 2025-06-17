"use client"

import { useEffect, useState, useCallback } from 'react'
import { authStorage, TokenData } from '@/lib/auth-storage'

interface TokenPersistenceState {
  isTokenValid: boolean
  tokenData: TokenData | null
  lastChecked: number
  isLoading: boolean
}

/**
 * Hook for managing token persistence across browser tabs and sessions
 */
export function useTokenPersistence() {
  const [state, setState] = useState<TokenPersistenceState>({
    isTokenValid: false,
    tokenData: null,
    lastChecked: 0,
    isLoading: true
  })

  // Check token validity
  const checkTokenValidity = useCallback(() => {
    const tokens = authStorage.getTokens()
    const isValid = authStorage.hasValidTokens()
    
    setState(prev => ({
      ...prev,
      isTokenValid: isValid,
      tokenData: tokens,
      lastChecked: Date.now(),
      isLoading: false
    }))

    return { isValid, tokens }
  }, [])

  // Force token refresh
  const refreshTokens = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      // This would typically call your auth service to refresh tokens
      // For now, we'll just re-check existing tokens
      const { isValid, tokens } = checkTokenValidity()
      
      return { success: isValid, tokens }
    } catch (error) {
      console.error('Token refresh failed:', error)
      return { success: false, tokens: null }
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [checkTokenValidity])

  // Clear all tokens
  const clearTokens = useCallback(() => {
    authStorage.clearTokens()
    setState({
      isTokenValid: false,
      tokenData: null,
      lastChecked: Date.now(),
      isLoading: false
    })
  }, [])

  // Store new tokens
  const storeTokens = useCallback((tokens: TokenData) => {
    authStorage.setTokens(tokens)
    setState({
      isTokenValid: true,
      tokenData: tokens,
      lastChecked: Date.now(),
      isLoading: false
    })
  }, [])

  // Initialize and setup cross-tab sync
  useEffect(() => {
    // Initial token check
    checkTokenValidity()

    // Setup cross-tab synchronization
    const cleanup = authStorage.setupCrossTabSync((tokens) => {
      setState(prev => ({
        ...prev,
        isTokenValid: !!tokens,
        tokenData: tokens,
        lastChecked: Date.now()
      }))
    })

    // Periodic token validation (every 5 minutes)
    const interval = setInterval(() => {
      const { isValid } = checkTokenValidity()
      
      // If token is expired or will expire soon, attempt refresh
      if (!isValid && state.tokenData) {
        refreshTokens()
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => {
      cleanup()
      clearInterval(interval)
    }
  }, [checkTokenValidity, refreshTokens, state.tokenData])

  // Monitor token expiration
  useEffect(() => {
    if (!state.tokenData) return

    const timeUntilExpiry = state.tokenData.expires_at - Date.now()
    
    // Set up a timer to refresh tokens 5 minutes before expiry
    if (timeUntilExpiry > 5 * 60 * 1000) {
      const refreshTimer = setTimeout(() => {
        console.log('🔄 Auto-refreshing tokens before expiry...')
        refreshTokens()
      }, timeUntilExpiry - 5 * 60 * 1000)

      return () => clearTimeout(refreshTimer)
    }
  }, [state.tokenData, refreshTokens])

  return {
    // State
    isTokenValid: state.isTokenValid,
    tokenData: state.tokenData,
    isLoading: state.isLoading,
    lastChecked: state.lastChecked,
    
    // Actions
    checkTokenValidity,
    refreshTokens,
    clearTokens,
    storeTokens,
    
    // Utilities
    isExpiringSoon: state.tokenData ? 
      (state.tokenData.expires_at - Date.now()) < 10 * 60 * 1000 : false, // 10 minutes
    timeUntilExpiry: state.tokenData ? 
      Math.max(0, state.tokenData.expires_at - Date.now()) : 0
  }
}

/**
 * Hook for debugging token storage across different mechanisms
 */
export function useTokenStorageDebug() {
  const [debugInfo, setDebugInfo] = useState({
    localStorage: null as any,
    sessionStorage: null as any,
    cookies: null as any,
    customStorage: null as any
  })

  const updateDebugInfo = useCallback(() => {
    // Check localStorage
    const localStorageTokens = localStorage.getItem('supabase.auth.token')
    
    // Check sessionStorage
    const sessionStorageTokens = sessionStorage.getItem('supabase.auth.session')
    
    // Check cookies
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      if (key.startsWith('sb-')) {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, string>)
    
    // Check custom storage
    const customTokens = authStorage.getTokens()

    setDebugInfo({
      localStorage: localStorageTokens ? JSON.parse(localStorageTokens) : null,
      sessionStorage: sessionStorageTokens ? JSON.parse(sessionStorageTokens) : null,
      cookies,
      customStorage: customTokens
    })
  }, [])

  useEffect(() => {
    updateDebugInfo()
    
    // Update debug info every 10 seconds
    const interval = setInterval(updateDebugInfo, 10000)
    
    return () => clearInterval(interval)
  }, [updateDebugInfo])

  return {
    debugInfo,
    updateDebugInfo,
    logDebugInfo: () => {
      console.group('🔍 Token Storage Debug Info')
      console.log('localStorage:', debugInfo.localStorage)
      console.log('sessionStorage:', debugInfo.sessionStorage)
      console.log('cookies:', debugInfo.cookies)
      console.log('customStorage:', debugInfo.customStorage)
      console.groupEnd()
    }
  }
}