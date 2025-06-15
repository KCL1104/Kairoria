import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, User, CheckCircle, Mail, Phone, Shield } from 'lucide-react'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function IncompleteSignupPage({
  searchParams
}: {
  searchParams: { return?: string }
}) {
  const returnUrl = searchParams.return || '/'
  
  // Create Supabase client
  const supabase = createServerComponentClient({ cookies })
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  // If user is not authenticated, redirect to login
  if (!user || userError) {
    redirect('/auth/login')
  }
  
  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  // Check what needs to be completed
  const hasRequiredFields = !!(profile?.full_name && profile?.phone && profile?.location)
  const isEmailVerified = profile?.is_email_verified === true
  const isPhoneVerified = profile?.is_phone_verified === true
  
  const needsProfileData = !hasRequiredFields
  const needsVerification = hasRequiredFields && (!isEmailVerified || !isPhoneVerified)
  
  // If user has completed everything, redirect to return URL
  if (!needsProfileData && !needsVerification) {
    redirect(returnUrl)
  }

  // Determine what steps need to be completed
  const getStepStatus = (stepType: 'profile' | 'verification') => {
    if (stepType === 'profile') {
      return needsProfileData ? 'pending' : 'completed'
    }
    return needsVerification ? 'pending' : 'completed'
  }

  const getNextStepText = () => {
    if (needsProfileData) {
      return 'Complete Profile Information'
    } else if (needsVerification) {
      return 'Complete Verification'
    }
    return 'Continue to Your Destination'
  }

  const getDescriptionText = () => {
    if (needsProfileData) {
      return 'Please complete your profile information to access this feature.'
    } else if (needsVerification) {
      return 'Please verify your email and phone number to access this feature.'
    }
    return 'Your profile is complete! You can now access all features.'
  }

  // Determine the next step URL
  const getNextStepUrl = () => {
    if (needsProfileData) {
      return `/complete-profile?return=${encodeURIComponent(returnUrl)}`
    } else if (needsVerification) {
      return `/complete-signup?return=${encodeURIComponent(returnUrl)}`
    }
    return returnUrl
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
            {getDescriptionText()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {/* Profile Information Step */}
            <div className={`flex items-center space-x-3 p-3 rounded-lg ${
              getStepStatus('profile') === 'completed' 
                ? 'bg-green-50 border border-green-200' 
                : needsProfileData 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'bg-gray-50 border border-gray-200'
            }`}>
              {getStepStatus('profile') === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <User className="w-5 h-5 text-blue-600" />
              )}
              <div>
                <p className={`font-medium ${
                  getStepStatus('profile') === 'completed' 
                    ? 'text-green-900' 
                    : 'text-blue-900'
                }`}>
                  Profile Information
                  {getStepStatus('profile') === 'completed' && ' ✓'}
                </p>
                <p className={`text-sm ${
                  getStepStatus('profile') === 'completed' 
                    ? 'text-green-700' 
                    : 'text-blue-700'
                }`}>
                  {getStepStatus('profile') === 'completed' 
                    ? 'Profile information completed' 
                    : 'Complete your basic profile details'
                  }
                </p>
              </div>
            </div>
            
            {/* Verification Step */}
            <div className={`flex items-center space-x-3 p-3 rounded-lg ${
              getStepStatus('verification') === 'completed' 
                ? 'bg-green-50 border border-green-200' 
                : needsVerification 
                  ? 'bg-orange-50 border border-orange-200' 
                  : 'bg-gray-50 border border-gray-200'
            }`}>
              {getStepStatus('verification') === 'completed' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : needsVerification ? (
                <Shield className="w-5 h-5 text-orange-600" />
              ) : (
                <Shield className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className={`font-medium ${
                  getStepStatus('verification') === 'completed' 
                    ? 'text-green-900' 
                    : needsVerification 
                      ? 'text-orange-900' 
                      : 'text-gray-500'
                }`}>
                  Verification
                  {getStepStatus('verification') === 'completed' && ' ✓'}
                </p>
                <p className={`text-sm ${
                  getStepStatus('verification') === 'completed' 
                    ? 'text-green-700' 
                    : needsVerification 
                      ? 'text-orange-700' 
                      : 'text-gray-500'
                }`}>
                  {getStepStatus('verification') === 'completed' 
                    ? 'Email and phone verified' 
                    : needsVerification 
                      ? 'Verify your email and phone number' 
                      : 'Verification pending profile completion'
                  }
                </p>
              </div>
            </div>
            
            {/* Email and Phone Status */}
            {profile && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>Email</span>
                  </div>
                  <span className={`font-medium ${
                    profile.is_email_verified ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {profile.is_email_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>Phone</span>
                  </div>
                  <span className={`font-medium ${
                    profile.is_phone_verified ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {profile.is_phone_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <Link href={getNextStepUrl()} className="block">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {getNextStepText()}
              </Button>
            </Link>
            
            <Link href="/" className="block">
              <Button 
                variant="outline"
                className="w-full"
                size="lg"
              >
                Go to Homepage
              </Button>
            </Link>
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