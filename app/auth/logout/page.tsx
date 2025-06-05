"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function LogoutPage() {
  const router = useRouter()
  const { signOut, isAuthenticated, isLoading } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('Signing you out...')

  const performLogout = useCallback(async () => {
    if (isLoading) return; // Wait until auth state is determined
    
    if (isAuthenticated) {
      try {
        setStatus('loading')
        setMessage('Securely signing you out...')
        
        // Perform signOut
        await signOut()
        
        // The signOut function already handles redirection, but in case
        // we get here (maybe redirect failed), show success state
        setStatus('success')
        setMessage('You have been successfully signed out.')
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } catch (error) {
        console.error('Failed to sign out:', error)
        setStatus('error')
        setMessage('There was a problem signing you out. Please try again.')
      }
    } else {
      // Already signed out
      setStatus('success')
      setMessage('You are already signed out.')
      
      // Redirect to home page after a brief delay
      setTimeout(() => {
        router.push('/')
      }, 1500)
    }
  }, [isLoading, isAuthenticated, signOut, router])

  useEffect(() => {
    performLogout()
  }, [signOut, router, isAuthenticated, isLoading, performLogout])

  return (
    <div className="container max-w-lg py-10">
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center p-8 border rounded-lg w-full max-w-md shadow-sm">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <h1 className="text-xl font-semibold mt-4 mb-2">Signing Out</h1>
              <p className="text-muted-foreground">{message}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h1 className="text-xl font-semibold mt-4 mb-2">Successfully Signed Out</h1>
              <p className="text-muted-foreground">{message}</p>
              <Button asChild className="mt-6">
                <Link href="/">Return to Home</Link>
              </Button>
            </>
          )}
          
          {status === 'error' && (
            <>
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h1 className="text-xl font-semibold mt-4 mb-2">Sign Out Failed</h1>
              <p className="text-muted-foreground">{message}</p>
              <div className="flex flex-col space-y-2 mt-6">
                <Button onClick={() => performLogout()}>
                  Try Again
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Return to Home</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}