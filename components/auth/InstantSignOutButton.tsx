"use client"

import { useState } from 'react'
import { LogOut, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useInstantSignOut } from '@/hooks/use-instant-signout'
import { cn } from '@/lib/utils'

// Define the props for the sign-out button
interface InstantSignOutButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'default' | 'lg'
  showIcon?: boolean
  showText?: boolean
  className?: string
  confirmBeforeSignOut?: boolean
  children?: React.ReactNode
}

/**
 * Enhanced sign-out button with instant feedback and pending operation handling
 */
export function InstantSignOutButton({
  variant = 'ghost',
  size = 'default',
  showIcon = true,
  showText = true,
  className,
  confirmBeforeSignOut = false,
  children
}: InstantSignOutButtonProps) {
  const {
    isSigningOut,
    error,
    pendingOperations,
    hasPendingOperations,
    signOut,
    forceSignOut,
    clearError
  } = useInstantSignOut()

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const handleSignOut = async () => {
    clearError()
    
    // Show confirmation dialog if enabled
    if (confirmBeforeSignOut && !showConfirmDialog && !isSigningOut) {
      setShowConfirmDialog(true)
      return
    }

    // Sign out with redirect to home page with success message
    await signOut({
      redirectTo: '/?signout=success'
    })
    setShowConfirmDialog(false)
  }

  const handleForceSignOut = async () => {
    clearError()
    // Force sign out with redirect to home page with success message
    await forceSignOut({
      redirectTo: '/?signout=success'
    })
    setShowConfirmDialog(false)
  }

  const buttonContent = children || (
    <>
      {showIcon && (
        isSigningOut ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )
      )}
      {showText && (
        <span className={showIcon ? "ml-2" : ""}>
          {isSigningOut ? "Signing out..." : "Sign Out"}
        </span>
      )}
    </>
  )

  if (confirmBeforeSignOut) {
    return (
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={cn(className)}
            disabled={isSigningOut}
            onClick={() => setShowConfirmDialog(true)}
          >
            {buttonContent}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? This will end your current session.
              {hasPendingOperations && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                    <span className="text-sm font-medium text-yellow-800">
                      Pending Operations Detected
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-yellow-700">
                    The following operations are still in progress:
                    <ul className="list-disc list-inside mt-1">
                      {pendingOperations.map((op, index) => (
                        <li key={index}>{op}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {hasPendingOperations ? (
              <>
                <AlertDialogAction onClick={handleSignOut}>
                  Wait & Sign Out
                </AlertDialogAction>
                <AlertDialogAction 
                  onClick={handleForceSignOut}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Force Sign Out
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction onClick={handleSignOut}>
                Sign Out
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      disabled={isSigningOut}
      onClick={handleSignOut}
    >
      {buttonContent}
    </Button>
  )
}