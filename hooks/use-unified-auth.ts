'use client'

import { useState } from 'react'
import { logAuthEvent } from '@/lib/auth-utils'

/**
 * 統一認證類型定義
 */
export interface LoginCredentials {
  loginType: 'password' | 'oauth' | 'magic_link' | 'phone'
  email?: string
  password?: string
  provider?: 'google' | 'facebook' | 'github' | 'apple'
  phone?: string
  token?: string
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
 * 統一認證 Hook
 * 提供所有登入類型的統一介面
 */
export function useUnifiedAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supportedTypes, setSupportedTypes] = useState<SupportedLoginType[]>([])

  /**
   * 統一登入方法
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
        
        // 對於 OAuth 登入，可能需要重定向
        if (credentials.loginType === 'oauth' && result.session) {
          // OAuth 成功，但可能需要處理重定向
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
   * 密碼登入
   */
  const loginWithPassword = async (email: string, password: string) => {
    return await login({
      loginType: 'password',
      email,
      password
    })
  }

  /**
   * OAuth 登入
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
   * Google OAuth 登入（便捷方法）
   */
  const loginWithGoogle = async (redirectTo?: string) => {
    return await loginWithOAuth('google', redirectTo)
  }

  /**
   * 魔法連結登入
   */
  const loginWithMagicLink = async (email: string, redirectTo?: string) => {
    return await login({
      loginType: 'magic_link',
      email,
      redirectTo
    })
  }

  /**
   * 手機號碼登入
   */
  const loginWithPhone = async (phone: string, token: string) => {
    return await login({
      loginType: 'phone',
      phone,
      token
    })
  }

  /**
   * 獲取支援的登入類型
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
   * 驗證登入憑證
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
        
      case 'magic_link':
        if (!credentials.email) errors.push('Email is required')
        if (credentials.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
          errors.push('Invalid email format')
        }
        break
        
      case 'phone':
        if (!credentials.phone) errors.push('Phone number is required')
        if (!credentials.token) errors.push('Verification token is required')
        break
        
      default:
        errors.push('Invalid login type')
    }
    
    return errors
  }

  /**
   * 清除錯誤狀態
   */
  const clearError = () => {
    setError(null)
  }

  return {
    // 狀態
    isLoading,
    error,
    supportedTypes,
    
    // 方法
    login,
    loginWithPassword,
    loginWithOAuth,
    loginWithGoogle,
    loginWithMagicLink,
    loginWithPhone,
    getSupportedLoginTypes,
    validateCredentials,
    clearError,
  }
}

/**
 * 預設導出便捷方法
 */
export default useUnifiedAuth