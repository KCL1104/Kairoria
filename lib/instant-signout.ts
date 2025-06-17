"use client"

import { supabase } from '@/lib/supabase-client'
import { crossTabAuth } from '@/lib/cross-tab-auth'

/**
 * Comprehensive sign-out utility with instant feedback and cleanup
 */
export class InstantSignOut {
  private static instance: InstantSignOut
  private pendingOperations: Set<string> = new Set()
  private isSigningOut = false

  static getInstance(): InstantSignOut {
    if (!InstantSignOut.instance) {
      InstantSignOut.instance = new InstantSignOut()
    }
    return InstantSignOut.instance
  }

  /**
   * Register a pending operation that should complete before sign-out
   */
  registerPendingOperation(operationId: string): void {
    this.pendingOperations.add(operationId)
  }

  /**
   * Mark an operation as completed
   */
  completePendingOperation(operationId: string): void {
    this.pendingOperations.delete(operationId)
  }

  /**
   * Check if there are any pending operations
   */
  hasPendingOperations(): boolean {
    return this.pendingOperations.size > 0
  }

  /**
   * Get list of pending operations
   */
  getPendingOperations(): string[] {
    return Array.from(this.pendingOperations)
  }

  /**
   * Clear all authentication data immediately
   */
  private clearAuthDataInstantly(): void {
    if (typeof window === 'undefined') return

    // Clear cross-tab auth tokens
    crossTabAuth.clearTokens()

    // 1. Clear localStorage
    const authKeys = [
      'supabase.auth.token',
      'supabase-auth-token',
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-state',
      'sb-provider-token',
      'supabase.auth.refreshToken',
      'supabase.auth.accessToken',
      'auth-token',
      'sb-auth-token',
      'sb-user-token',
      'sb-provider-token',
    ]

    authKeys.forEach(key => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    })

    // Scan for any other auth-related keys
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (
        key.startsWith('supabase') || 
        key.startsWith('sb-') || 
        key.includes('auth') ||
        key.includes('token')
      )) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))

    // 2. Clear sessionStorage completely
    sessionStorage.clear()

    // 3. Clear authentication cookies
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      '__supabase_session',
      '__supabase_auth',
      'supabase-user-id',
      'supabase-user-email',
      'sb-user-token',
      'sb-provider-token',
      'sb-auth-token'
    ]

    cookiesToClear.forEach(name => {
      // Clear with different path and domain combinations
      const clearOptions = [
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`,
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`,
        `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`,
      ]
      clearOptions.forEach(option => {
        document.cookie = option
      })
    })
  }

  /**
   * Perform instant sign-out with immediate UI feedback
   */
  async performInstantSignOut(options: {
    skipPendingCheck?: boolean
    onStart?: () => void
    onSuccess?: () => void
    onError?: (error: Error) => void
    redirectTo?: string
  } = {}): Promise<{ success: boolean; error?: Error }> {
    const { 
      skipPendingCheck = false, 
      onStart, 
      onSuccess, 
      onError,
      redirectTo = '/'
    } = options

    // Prevent multiple simultaneous sign-outs
    if (this.isSigningOut) {
      return { success: false, error: new Error('Sign-out already in progress') }
    }

    this.isSigningOut = true

    try {
      // Call onStart immediately for instant UI feedback
      onStart?.()

      // Check for pending operations unless skipped
      if (!skipPendingCheck && this.hasPendingOperations()) {
        const pendingOps = this.getPendingOperations()
        throw new Error(`Cannot sign out with pending operations: ${pendingOps.join(', ')}`)
      }

      // 1. INSTANT: Clear all client-side auth data immediately
      this.clearAuthDataInstantly()

      // 2. ASYNC: Call server-side logout (don't wait for it)
      const serverLogoutPromise = this.performServerLogout()

      // 3. ASYNC: Call Supabase signOut (don't wait for it)
      const supabaseLogoutPromise = this.performSupabaseLogout()

      // 4. INSTANT: Redirect immediately (don't wait for server calls)
      if (typeof window !== 'undefined') {
        // Use replace to prevent back button issues
        window.location.replace(redirectTo)
      }

      // 5. Handle async operations in background
      Promise.allSettled([serverLogoutPromise, supabaseLogoutPromise])
        .then(results => {
          results.forEach((result, index) => {
            if (result.status === 'rejected') {
              console.warn(`Background logout operation ${index} failed:`, result.reason)
            }
          })
        })

      onSuccess?.()
      return { success: true }

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown sign-out error')
      console.error('Sign-out error:', err)
      onError?.(err)
      return { success: false, error: err }
    } finally {
      this.isSigningOut = false
    }
  }

  /**
   * Perform server-side logout
   */
  private async performServerLogout(): Promise<void> {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000)
      })

      if (!response.ok) {
        console.warn('Server logout returned error:', response.status, response.statusText)
      }
    } catch (error) {
      console.warn('Server logout failed:', error)
      // Don't throw - this is a background operation
    }
  }

  /**
   * Perform Supabase logout
   */
  private async performSupabaseLogout(): Promise<void> {
    if (!supabase) return

    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      if (error) {
        console.warn('Supabase logout error:', error)
      }
    } catch (error) {
      console.warn('Supabase logout failed:', error)
      // Don't throw - this is a background operation
    }
  }

  /**
   * Force sign-out ignoring pending operations
   */
  async forceSignOut(options: {
    onStart?: () => void
    onSuccess?: () => void
    onError?: (error: Error) => void
    redirectTo?: string
  } = {}): Promise<{ success: boolean; error?: Error }> {
    return this.performInstantSignOut({ ...options, skipPendingCheck: true })
  }

  /**
   * Get current sign-out status
   */
  getStatus(): {
    isSigningOut: boolean
    pendingOperations: string[]
    hasPendingOperations: boolean
  } {
    return {
      isSigningOut: this.isSigningOut,
      pendingOperations: this.getPendingOperations(),
      hasPendingOperations: this.hasPendingOperations()
    }
  }
}

// Export singleton instance
export const instantSignOut = InstantSignOut.getInstance()

// Utility functions for common use cases
export const signOutInstantly = (options?: Parameters<typeof instantSignOut.performInstantSignOut>[0]) => 
  instantSignOut.performInstantSignOut(options)

export const forceSignOut = (options?: Parameters<typeof instantSignOut.forceSignOut>[0]) => 
  instantSignOut.forceSignOut(options)

export const registerPendingOperation = (operationId: string) => 
  instantSignOut.registerPendingOperation(operationId)

export const completePendingOperation = (operationId: string) => 
  instantSignOut.completePendingOperation(operationId)