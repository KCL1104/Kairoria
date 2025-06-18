'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
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
        
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        await supabase.auth.signOut()
        
        setStatus('success')
        setMessage('You have been successfully signed out.')
        
        // Redirect to home page after a short delay
        setTimeout(() => {
          router.push('/?signout=success')
        }, 2000)
        
      } catch (error) {
        console.error('Logout error:', error)
        setStatus('error')
        setMessage('An error occurred while signing out. Please try again.')
      }
    }

    performLogout()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full">
            {status === 'loading' && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            )}
            {status === 'success' && (
              <CheckCircle className="h-8 w-8 text-green-600" />
            )}
            {status === 'error' && (
              <AlertCircle className="h-8 w-8 text-red-600" />
            )}
          </div>
          
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {status === 'loading' && 'Signing Out'}
            {status === 'success' && 'Signed Out Successfully'}
            {status === 'error' && 'Sign Out Error'}
          </h2>
          
          <p className="mt-2 text-sm text-gray-600">
            {message}
          </p>
          
          {status === 'success' && (
            <p className="mt-2 text-xs text-gray-500">
              Redirecting you to the home page...
            </p>
          )}
          
          {status === 'error' && (
            <div className="mt-6 space-y-4">
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Try Again
              </Button>
              
              <Link href="/" className="block">
                <Button variant="outline" className="w-full">
                  Return to Home
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}