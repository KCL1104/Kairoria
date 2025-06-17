"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { instantSignOut } from '@/lib/instant-signout'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function LogoutPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('Signing you out...')

  useEffect(() => {
    const performLogout = async () => {
      try {
        setStatus('loading')
        setMessage('Securely signing you out...')
        
        // Use instant sign-out for immediate feedback
        const result = await instantSignOut.performInstantSignOut({
          redirectTo: '/',
          onStart: () => {
            setMessage('Clearing session data...')
          },
          onSuccess: () => {
            setStatus('success')
            setMessage('You have been successfully signed out.')
          },
          onError: (error) => {
            setStatus('error')
            setMessage('There was a problem signing you out. Please try again.')
          }
        })
        
        // If redirect didn't happen, show success and redirect manually
        if (result.success) {
          setTimeout(() => {
            router.push('/')
          }, 1000)
        }
      } catch (error) {
        console.error('Failed to sign out:', error)
        setStatus('error')
        setMessage('There was a problem signing you out. Please try again.')
      }
    }

    performLogout()
  }, [router])

  const retryLogout = async () => {
    setStatus('loading')
    setMessage('Retrying sign out...')
    
    try {
      await instantSignOut.forceSignOut({
        redirectTo: '/',
        onSuccess: () => {
          setStatus('success')
          setMessage('Successfully signed out.')
        }
      })
    } catch (error) {
      setStatus('error')
      setMessage('Sign out failed again. Please try refreshing the page.')
    }
  }

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
                <Button onClick={retryLogout}>
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