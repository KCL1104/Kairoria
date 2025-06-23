"use client";

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader } from 'lucide-react'
import useUnifiedAuth from '@/hooks/use-unified-auth'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import Link from 'next/link'

interface UnifiedLoginFormProps {
  onSuccess?: (user: any) => void
  onError?: (error: string) => void
  redirectTo?: string
  className?: string
  mode?: 'login' | 'register'
  showRegisterLink?: boolean
  showLoginLink?: boolean
  showGoogleAuth?: boolean
}

/**
 * Unified login form component
 * Supports email/password and Google OAuth authentication
 */
export function UnifiedLoginForm({ 
  onSuccess, 
  onError, 
  redirectTo = '/',
  className = '',
  mode = 'login',
  showRegisterLink = false,
  showLoginLink = false,
  showGoogleAuth = false
}: UnifiedLoginFormProps) {
  const {
    isLoading: unifiedLoading,
    error: unifiedError,
    loginWithPassword,
    loginWithGoogle,
    clearError
  } = useUnifiedAuth()

  // Get signUp from Supabase auth context
  const { signUp } = useAuth()

  // Local state for registration
  const [localLoading, setLocalLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  // Combined loading and error states
  const isLoading = unifiedLoading || localLoading
  const error = unifiedError || localError

  // Clear error function that handles both states
  const clearAllErrors = () => {
    clearError()
    setLocalError(null)
  }

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  })

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) clearAllErrors()
  }

  // Handle email/password login or registration
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearAllErrors()
    
    if (!formData.email || !formData.password) {
      const errorMsg = 'Please enter both email and password'
      setLocalError(errorMsg)
      onError?.(errorMsg)
      return
    }

    if (mode === 'register') {
      // Registration mode
      if (!formData.fullName) {
        const errorMsg = 'Please enter your full name'
        setLocalError(errorMsg)
        onError?.(errorMsg)
        return
      }

      if (formData.password !== formData.confirmPassword) {
        const errorMsg = 'Passwords do not match'
        setLocalError(errorMsg)
        onError?.(errorMsg)
        return
      }

      if (formData.password.length < 6) {
        const errorMsg = 'Password must be at least 6 characters long'
        setLocalError(errorMsg)
        onError?.(errorMsg)
        return
      }

      setLocalLoading(true)
      try {
        // Use unified registration API
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName
          })
        })

        const result = await response.json()
        
        if (!result.success) {
          setLocalError(result.message)
          onError?.(result.message)
        } else {
          onSuccess?.({
            user: result.user,
            needsEmailVerification: result.user.needsEmailVerification
          })
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Registration failed'
        setLocalError(errorMessage)
        onError?.(errorMessage)
      } finally {
        setLocalLoading(false)
      }
    } else {
      // Login mode
      const result = await loginWithPassword(formData.email, formData.password)
      
      if (result.success && result.user) {
        onSuccess?.(result.user)
      } else {
        onError?.(result.message)
      }
    }
  }

  // Handle Google OAuth login
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle() // Updated to use new signature without parameters
      // OAuth flow will redirect, so success handling will happen after redirect
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google login failed'
      onError?.(errorMessage)
    }
  }

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {error && (
        <Alert className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Email/Password Login/Register Form */}
      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        {mode === 'register' && (
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder={mode === 'register' ? "Create a password (min 6 characters)" : "Enter your password"}
            required
            minLength={mode === 'register' ? 6 : undefined}
          />
        </div>
        
        {mode === 'register' && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </div>
        )}
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              {mode === 'register' ? 'Creating account...' : 'Signing in...'}
            </>
          ) : (
            mode === 'register' ? 'Create Account' : 'Sign in'
          )}
        </Button>
      </form>

      {/* Google OAuth Login - Only show if enabled */}
      {showGoogleAuth && (
        <>
          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button 
            onClick={handleGoogleLogin} 
            className="w-full" 
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </Button>
        </>
      )}

      {/* Register Link */}
      {showRegisterLink && (
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/auth/register" className="underline underline-offset-4 hover:text-primary">
            Sign up
          </Link>
        </p>
      )}

      {/* Login Link */}
      {showLoginLink && (
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="underline underline-offset-4 hover:text-primary">
            Sign in
          </Link>
        </p>
      )}
    </div>
  )
}

export default UnifiedLoginForm