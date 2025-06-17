"use client"

import { useState, useEffect, useCallback } from 'react'
import { instantSignOut } from '@/lib/instant-signout'
import { useToast } from '@/hooks/use-toast'

interface UseInstantSignOutReturn {
  isSigningOut: boolean
  error: string | null
  pendingOperations: string[]
  hasPendingOperations: boolean
  signOut: (options?: {
    redirectTo?: string
    showToast?: boolean
  }) => Promise<void>
  forceSignOut: (options?: {
    redirectTo?: string
    showToast?: boolean
  }) => Promise<void>
  registerPendingOperation: (operationId: string) => void
  completePendingOperation: (operationId: string) => void
  clearError: () => void
}

/**
 * React hook for instant sign-out functionality with UI state management
 */
export function useInstantSignOut(): UseInstantSignOutReturn {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingOperations, setPendingOperations] = useState<string[]>([])
  const { toast } = useToast()

  // Update pending operations state
  const updatePendingOperations = useCallback(() => {
    const status = instantSignOut.getStatus()
    setPendingOperations(status.pendingOperations)
    setIsSigningOut(status.isSigningOut)
  }, [])

  // Poll for status updates
  useEffect(() => {
    const interval = setInterval(updatePendingOperations, 100)
    return () => clearInterval(interval)
  }, [updatePendingOperations])

  const signOut = useCallback(async (options: {
    redirectTo?: string
    showToast?: boolean
  } = {}) => {
    const { redirectTo = '/', showToast = true } = options

    setError(null)

    const result = await instantSignOut.performInstantSignOut({
      redirectTo,
      onStart: () => {
        setIsSigningOut(true)
        if (showToast) {
          toast({
            title: "Signing out...",
            description: "Please wait while we sign you out securely.",
          })
        }
      },
      onSuccess: () => {
        setIsSigningOut(false)
        if (showToast) {
          toast({
            title: "Signed out successfully",
            description: "You have been securely signed out.",
          })
        }
      },
      onError: (err) => {
        setIsSigningOut(false)
        setError(err.message)
        if (showToast) {
          toast({
            variant: "destructive",
            title: "Sign out failed",
            description: err.message,
          })
        }
      }
    })

    if (!result.success && result.error) {
      setError(result.error.message)
    }
  }, [toast])

  const forceSignOut = useCallback(async (options: {
    redirectTo?: string
    showToast?: boolean
  } = {}) => {
    const { redirectTo = '/', showToast = true } = options

    setError(null)

    const result = await instantSignOut.forceSignOut({
      redirectTo,
      onStart: () => {
        setIsSigningOut(true)
        if (showToast) {
          toast({
            title: "Force signing out...",
            description: "Ignoring pending operations and signing out immediately.",
          })
        }
      },
      onSuccess: () => {
        setIsSigningOut(false)
        if (showToast) {
          toast({
            title: "Signed out successfully",
            description: "You have been forcefully signed out.",
          })
        }
      },
      onError: (err) => {
        setIsSigningOut(false)
        setError(err.message)
        if (showToast) {
          toast({
            variant: "destructive",
            title: "Force sign out failed",
            description: err.message,
          })
        }
      }
    })

    if (!result.success && result.error) {
      setError(result.error.message)
    }
  }, [toast])

  const registerPendingOperation = useCallback((operationId: string) => {
    instantSignOut.registerPendingOperation(operationId)
    updatePendingOperations()
  }, [updatePendingOperations])

  const completePendingOperation = useCallback((operationId: string) => {
    instantSignOut.completePendingOperation(operationId)
    updatePendingOperations()
  }, [updatePendingOperations])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isSigningOut,
    error,
    pendingOperations,
    hasPendingOperations: pendingOperations.length > 0,
    signOut,
    forceSignOut,
    registerPendingOperation,
    completePendingOperation,
    clearError
  }
}