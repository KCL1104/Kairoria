'use client'

import { useState } from 'react'
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
        
        // For OAuth login, may need to redirect
        if (credentials.loginType === 'oauth' && result.session) {
          // OAuth success, but may need to handle redirection
          window.location.href = credentials.redirectTo || '/'
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
  const loginWithPassword = async (email: string, password: string) => {
    return await login({
      loginType: 'password',
      email,
      password
    })
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
   * Google OAuth login (convenience method)
   */
  const loginWithGoogle = async (redirectTo?: string) => {
    return await loginWithOAuth('google', redirectTo)
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
      console.error('Failed to fetch supported login types:', err)
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