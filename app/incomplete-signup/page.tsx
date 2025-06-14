'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, User, CheckCircle } from 'lucide-react'
import { useAuth } from '@/contexts/SupabaseAuthContext'

export default function IncompleteSignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading } = useAuth()
  const returnUrl = searchParams.get('return') || '/'

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  const handleCompleteSignup = () => {
    // Redirect to complete profile page with return URL
    const completeProfileUrl = new URL('/complete-profile', window.location.origin)
    completeProfileUrl.searchParams.set('return', returnUrl)
    router.push(completeProfileUrl.toString())
  }

  const handleGoHome = () => {
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Complete Your Signup
          </CardTitle>
          <CardDescription className="text-gray-600">
            You need to complete your profile setup to access this feature.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Profile Information</p>
                <p className="text-sm text-blue-700">Complete your basic profile details</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Verification</p>
                <p className="text-sm text-green-700">Verify your email and phone number</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={handleCompleteSignup}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              Complete Signup Now
            </Button>
            
            <Button 
              onClick={handleGoHome}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Go to Homepage
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Complete your signup to access all features including profile management, 
              item listings, and rental services.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}