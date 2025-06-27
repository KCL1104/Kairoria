'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { logAuthEvent } from '@/lib/auth-utils'

/**
 * Unified authentication type definitions
 */
export interface LoginCredentials {
  loginType: 'password' | 'oauth'
  email?: string
  password?: string
  provider?: 'google' | 'facebook' | 'github' | 'apple'
  redirectTo?: string
}

export interface LoginResponse {
  success: boolean
  message: string
  loginMethod?: string
  redirectUrl?: string
  user?: {
    id: string
    email: string
    name: string
    profile: any
  }
  session?: {
    access_token: string
    refresh_token: string
    expires_at: number
  }
}

export interface SupportedLoginType {
  type: string
  name: string
  description: string
  requiredFields: string[]
  optionalFields?: string[]
  supportedProviders?: string[]
}

/**
 * Unified authentication hook
 * Provides unified interface for email/password and Google OAuth authentication
 */
export function useUnifiedAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supportedTypes, setSupportedTypes] = useState<SupportedLoginType[]>([])
  
  // Get refreshSession function from Auth Context
  const { refreshSession } = useAuth()

  /**
   * Unified login method
   */
  const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    setIsLoading(true)
    setError(null)
    
    try {
      logAuthEvent('unified_auth_attempt', { loginType: credentials.loginType })
      
      const response = await fetch('/api/auth/unified-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      const result: LoginResponse = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Login failed')
      }

      if (result.success) {
        logAuthEvent('unified_auth_success', { 
          loginMethod: result.loginMethod,
          userId: result.user?.id 
        })
        
        // Handle OAuth redirect
        if (credentials.loginType === 'oauth' && result.redirectUrl) {
          window.location.href = result.redirectUrl
          return result
        }
        
        // For password login, refresh session immediately
        if (credentials.loginType === 'password') {
          await refreshSession()
        }
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      logAuthEvent('unified_auth_error', { 
        error: errorMessage,
        loginType: credentials.loginType 
      })
      
      return {
        success: false,
        message: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Password login
   */
  const loginWithPassword = async (email: string, password: string): Promise<LoginResponse> => {
    setIsLoading(true)
    setError(null)
    
    try {
      logAuthEvent('unified_auth_attempt', { loginType: 'password' })
      
      const response = await fetch('/api/auth/unified-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginType: 'password', email, password }),
      })

      const result: LoginResponse = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Login failed')
      }

      if (result.success) {
        logAuthEvent('unified_auth_success', { loginMethod: 'password', userId: result.user?.id })
        
        // Refresh the session to update frontend auth state
        await refreshSession()
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      logAuthEvent('unified_auth_error', { error: errorMessage, loginType: 'password' })
      return { success: false, message: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * OAuth login
   */
  const loginWithOAuth = async (
    provider: 'google' | 'facebook' | 'github' | 'apple',
    redirectTo?: string
  ) => {
    return await login({
      loginType: 'oauth',
      provider,
      redirectTo
    })
  }

  /**
   * Google OAuth login (using unified API)
   */
  const loginWithGoogle = async () => {
    return await loginWithOAuth('google', `${window.location.origin}/auth/callback`)
  }

  /**
   * Get supported login types
   */
  const getSupportedLoginTypes = async () => {
    try {
      const response = await fetch('/api/auth/unified-login', {
        method: 'GET',
      })

      const result = await response.json()
      
      if (result.success && result.supportedLoginTypes) {
        setSupportedTypes(result.supportedLoginTypes)
        return result.supportedLoginTypes
      }
      
      return []
    } catch (err) {
      return []
    }
  }

  /**
   * Validate login credentials
   */
  const validateCredentials = (credentials: LoginCredentials): string[] => {
    const errors: string[] = []
    
    switch (credentials.loginType) {
      case 'password':
        if (!credentials.email) errors.push('Email is required')
        if (!credentials.password) errors.push('Password is required')
        if (credentials.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
          errors.push('Invalid email format')
        }
        if (credentials.password && credentials.password.length < 6) {
          errors.push('Password must be at least 6 characters')
        }
        break
        
      case 'oauth':
        if (!credentials.provider) errors.push('OAuth provider is required')
        break
        
      default:
        errors.push('Invalid login type')
    }
    
    return errors
  }

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null)
  }

  return {
    // State
    isLoading,
    error,
    supportedTypes,
    
    // Methods
    login,
    loginWithPassword,
    loginWithOAuth,
    loginWithGoogle,
    getSupportedLoginTypes,
    validateCredentials,
    clearError,
  }
}

/**
 * Default export convenience method
 */
export default useUnifiedAuth