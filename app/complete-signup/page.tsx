'use client'

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase-client"
import { auth, RecaptchaVerifier, signInWithPhoneNumber, isFirebaseConfigured } from "@/lib/firebase"
import type { ConfirmationResult } from "firebase/auth"
import { Check, Mail, Phone, Shield, User, MapPin, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react"
import { useAuth } from "@/contexts/SupabaseAuthContext"
import { cn } from "@/lib/utils"

interface ProfileData {
  full_name: string
  phone: string
  location: string
  is_email_verified: boolean
  is_phone_verified: boolean
}

interface StepProps {
  number: number
  title: string
  description: string
  completed: boolean
  current: boolean
  icon: React.ReactNode
}

function StepIndicator({ number, title, description, completed, current, icon }: StepProps) {
  return (
    <div className="flex items-start gap-4">
      <div className={cn(
        "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
        completed ? "bg-green-500 border-green-500 text-white" :
        current ? "bg-blue-500 border-blue-500 text-white" :
        "bg-gray-100 border-gray-300 text-gray-400"
      )}>
        {completed ? <CheckCircle2 className="w-6 h-6" /> : icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          "text-lg font-semibold transition-colors",
          completed ? "text-green-700" : current ? "text-blue-700" : "text-gray-500"
        )}>
          {title}
        </h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  )
}

// Component that uses useSearchParams
function CompleteSignupPageWithSearchParams() {
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    phone: '',
    location: '',
    is_email_verified: false,
    is_phone_verified: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [fullPhoneNumber, setFullPhoneNumber] = useState('')
  
  // Email verification states
  const [emailResendCooldown, setEmailResendCooldown] = useState(0)
  
  // Phone verification states
  const [phoneResendCooldown, setPhoneResendCooldown] = useState(0)
  const [phoneVerificationStep, setPhoneVerificationStep] = useState<'initial' | 'code-sent' | 'verified'>('initial')
  const [verificationCode, setVerificationCode] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null)

  const recaptchaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const returnUrl = searchParams.get('return') || '/'

  // Check if all steps are completed
  const isFullyComplete = () => {
    return !!(
      profile.full_name &&
      profile.phone &&
      profile.location &&
      profile.is_email_verified &&
      profile.is_phone_verified
    )
  }

  // Initialize recaptcha
  useEffect(() => {
    const initializeRecaptcha = () => {
      if (typeof window !== 'undefined' && recaptchaRef.current && !recaptchaVerifier && isFirebaseConfigured && auth) {
        try {
          const verifier = new RecaptchaVerifier(auth, recaptchaRef.current, {
            size: 'invisible',
            callback: () => {
              console.log('reCAPTCHA solved successfully')
            },
            'expired-callback': () => {
              console.log('reCAPTCHA expired, reinitializing...')
              setRecaptchaVerifier(null)
            },
            'error-callback': (error: any) => {
              console.error('reCAPTCHA error:', error)
              setRecaptchaVerifier(null)
            }
          })
          setRecaptchaVerifier(verifier)
          console.log('reCAPTCHA initialized successfully')
        } catch (error) {
          console.error('Error initializing reCAPTCHA:', error)
        }
      }
    }

    initializeRecaptcha()
    
    // Cleanup function
    return () => {
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear()
        } catch (error) {
          console.error('Error clearing reCAPTCHA:', error)
        }
      }
    }
  }, [recaptchaVerifier, isFirebaseConfigured, auth])

  // Re-initialize recaptcha when needed
  const reinitializeRecaptcha = () => {
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear()
      } catch (error) {
        console.error('Error clearing existing recaptcha:', error)
      }
    }
    setRecaptchaVerifier(null)
    
    // Allow a brief moment for cleanup before reinitializing
    setTimeout(() => {
      if (typeof window !== 'undefined' && recaptchaRef.current && isFirebaseConfigured && auth) {
        try {
          const verifier = new RecaptchaVerifier(auth, recaptchaRef.current, {
            size: 'invisible',
            callback: () => {
              console.log('reCAPTCHA solved successfully')
            }
          })
          setRecaptchaVerifier(verifier)
        } catch (error) {
          console.error('Error reinitializing reCAPTCHA:', error)
        }
      }
    }, 100)
  }

  // Load profile data with better loading state management
  useEffect(() => {
    async function loadProfile() {
      try {
        // Wait for user to be loaded from auth context
        if (!user && !loading) {
          // If we're not loading and there's no user, redirect to login
          router.push('/auth/login')
          return
        }
        
        if (!user) {
          // Still waiting for user to load
          return
        }

        if (!supabase) {
          console.error('Supabase not available')
          setLoading(false)
          return
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileData) {
          const newProfile = {
            full_name: profileData.full_name || '',
            phone: profileData.phone || '',
            location: profileData.location || '',
            is_email_verified: profileData.is_email_verified || false,
            is_phone_verified: profileData.is_phone_verified || false
          }
          
          setProfile(newProfile)
          setFullPhoneNumber(profileData.phone || '')
          
          if (profileData.is_phone_verified) {
            setPhoneVerificationStep('verified')
          }
          
          // Determine current step based on completion status
          if (!newProfile.full_name || !newProfile.phone || !newProfile.location) {
            setCurrentStep(1)
          } else if (!newProfile.is_email_verified) {
            setCurrentStep(2)
          } else if (!newProfile.is_phone_verified) {
            setCurrentStep(3)
          } else {
            setCurrentStep(4) // All complete
          }
        }

      } catch (error) {
        console.error('Error loading profile:', error)
        toast({
          variant: "destructive",
          title: "Loading Error",
          description: "Failed to load your profile. Please refresh the page."
        })
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user, router, toast])

  // Countdown timers
  useEffect(() => {
    if (emailResendCooldown > 0) {
      const timer = setTimeout(() => setEmailResendCooldown(emailResendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [emailResendCooldown])

  useEffect(() => {
    if (phoneResendCooldown > 0) {
      const timer = setTimeout(() => setPhoneResendCooldown(phoneResendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [phoneResendCooldown])

  // Save profile data and progress to next step
  const saveProfileData = async () => {
    if (!profile.full_name || !fullPhoneNumber || !profile.location) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all required fields"
      })
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase!
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: fullPhoneNumber,
          location: profile.location
        })
        .eq('id', user?.id)

      if (error) throw error

      setProfile(prev => ({ ...prev, phone: fullPhoneNumber }))
      
      toast({
        title: "✅ Profile updated",
        description: "Your profile information has been saved successfully"
      })
      
      // Progress to email verification step
      setCurrentStep(2)

    } catch (error) {
      console.error('Error saving profile:', error)
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Failed to save profile information"
      })
    } finally {
      setSaving(false)
    }
  }

  // Email verification
  const sendEmailVerification = async () => {
    if (!user?.email) {
      toast({
        variant: "destructive",
        title: "Email verification unavailable",
        description: "No email address found for your account"
      })
      return
    }

    try {
      // Use Supabase auth resend with proper redirect URL
      const { error } = await supabase!.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        // Handle specific Supabase errors
        if (error.message.includes('rate limit')) {
          toast({
            variant: "destructive",
            title: "Too many requests",
            description: "Please wait a moment before requesting another email"
          })
          return
        }
        throw error
      }

      setEmailResendCooldown(60)
      toast({
        title: "📧 Verification email sent",
        description: "Check your email (including spam folder) for the verification link"
      })

    } catch (error: any) {
      console.error('Error sending email verification:', error)
      const errorMessage = error?.message || "Failed to send verification email"
      toast({
        variant: "destructive",
        title: "Email verification failed",
        description: errorMessage
      })
    }
  }

  // Phone verification
  const sendPhoneVerification = async () => {
    if (!fullPhoneNumber) {
      toast({
        variant: "destructive",
        title: "Phone number required",
        description: "Please enter a valid phone number"
      })
      return
    }

    if (!auth || !isFirebaseConfigured) {
      toast({
        variant: "destructive",
        title: "SMS service unavailable",
        description: "Phone verification is temporarily unavailable"
      })
      return
    }

    if (!recaptchaVerifier) {
      // Try to reinitialize recaptcha
      reinitializeRecaptcha()
      toast({
        variant: "destructive",
        title: "Security verification initializing",
        description: "Please wait a moment and try again"
      })
      return
    }

    try {
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifier)
      setConfirmationResult(result)
      setPhoneVerificationStep('code-sent')
      setPhoneResendCooldown(60)
      
      toast({
        title: "📱 Verification code sent",
        description: `Please check your phone (${fullPhoneNumber}) for the verification code`
      })

    } catch (error: any) {
      console.error('Error sending phone verification:', error)
      
      let errorMessage = "Failed to send verification code"
      
      // Handle specific Firebase errors
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = "Please enter a valid phone number"
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many SMS requests. Please try again later"
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = "SMS quota exceeded. Please try again tomorrow"
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        variant: "destructive",
        title: "Phone verification failed",
        description: errorMessage
      })
      
      // Reinitialize recaptcha on error
      setTimeout(() => {
        reinitializeRecaptcha()
      }, 1000)
    }
  }

  const verifyPhoneCode = async () => {
    if (!confirmationResult || !verificationCode) {
      toast({
        variant: "destructive",
        title: "Invalid verification",
        description: "Please enter the verification code"
      })
      return
    }

    if (verificationCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid code format",
        description: "Verification code must be 6 digits"
      })
      return
    }

    try {
      // Verify the code with Firebase
      await confirmationResult.confirm(verificationCode)
      
      // Update profile in Supabase
      const { error } = await supabase!
        .from('profiles')
        .update({ is_phone_verified: true })
        .eq('id', user?.id)

      if (error) {
        console.error('Error updating phone verification status:', error)
        throw new Error('Failed to update verification status')
      }

      setPhoneVerificationStep('verified')
      setProfile(prev => ({ ...prev, is_phone_verified: true }))
      
      toast({
        title: "🎉 Phone verified",
        description: "Your phone number has been successfully verified"
      })
      
      // Progress to completion step
      setCurrentStep(4)

    } catch (error: any) {
      console.error('Error verifying code:', error)
      
      let errorMessage = "The verification code is incorrect"
      
      // Handle specific Firebase errors
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = "Invalid verification code. Please check and try again"
      } else if (error.code === 'auth/code-expired') {
        errorMessage = "Verification code has expired. Please request a new one"
      } else if (error.message && !error.message.includes('Firebase')) {
        errorMessage = error.message
      }
      
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: errorMessage
      })
    }
  }

  // Check email verification status
  useEffect(() => {
    const checkEmailVerification = async () => {
      if (!supabase || !user) return
      
      try {
        const { data: { user: currentUser } } = await supabase!.auth.getUser()
        
        if (currentUser?.email_confirmed_at && !profile.is_email_verified) {
          const { error } = await supabase!
            .from('profiles')
            .update({ is_email_verified: true })
            .eq('id', user.id)

          if (!error) {
            setProfile(prev => ({ ...prev, is_email_verified: true }))
            toast({
              title: "✅ Email verified",
              description: "Your email has been successfully verified"
            })
            
            // Progress to phone verification if profile is complete
            if (profile.full_name && profile.phone && profile.location) {
              setCurrentStep(3)
            }
          }
        }
      } catch (error) {
        console.error('Error checking email verification:', error)
      }
    }

    checkEmailVerification()
    
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user?.email_confirmed_at && !profile.is_email_verified) {
          await checkEmailVerification()
        }
      })
      
      return () => subscription.unsubscribe()
    }
  }, [user, profile.is_email_verified, profile.full_name, profile.phone, profile.location, toast])

  const handleComplete = async () => {
    if (!isFullyComplete()) {
      toast({
        variant: "destructive",
        title: "Incomplete registration",
        description: "Please complete all steps before continuing"
      })
      return
    }

    router.push(returnUrl)
  }

  // Show loading only if we're actually loading user data
  if (loading || (!user && typeof window !== 'undefined')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
            <div className="absolute -top-1 -right-1">
              <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading your profile</h3>
          <p className="text-gray-600">Please wait while we prepare your registration...</p>
        </div>
      </div>
    )
  }

  // If no user after loading, redirect handled in useEffect
  if (!user) {
    return null
  }

  // Calculate progress
  const completedSteps = [
    !!(profile.full_name && profile.phone && profile.location),
    profile.is_email_verified,
    profile.is_phone_verified
  ].filter(Boolean).length
  
  const progressPercentage = (completedSteps / 3) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-yellow-800" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Registration
          </h1>
          <p className="text-gray-600 text-lg">
            Just a few more steps to unlock all features
          </p>
          
          {/* Progress Bar */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{completedSteps}/3 completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Steps Overview */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  Registration Steps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <StepIndicator
                  number={1}
                  title="Basic Information"
                  description="Your name, phone & location"
                  completed={!!(profile.full_name && profile.phone && profile.location)}
                  current={currentStep === 1}
                  icon={<User className="w-6 h-6" />}
                />
                <StepIndicator
                  number={2}
                  title="Email Verification"
                  description="Confirm your email address"
                  completed={profile.is_email_verified}
                  current={currentStep === 2}
                  icon={<Mail className="w-6 h-6" />}
                />
                <StepIndicator
                  number={3}
                  title="Phone Verification"
                  description="Verify your phone number"
                  completed={profile.is_phone_verified}
                  current={currentStep === 3}
                  icon={<Phone className="w-6 h-6" />}
                />
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0">
              <CardHeader className={cn(
                "border-b",
                currentStep === 1 ? "bg-blue-50" :
                currentStep === 2 ? "bg-green-50" :
                currentStep === 3 ? "bg-purple-50" : "bg-yellow-50"
              )}>
                <CardTitle className="text-xl">
                  {currentStep === 1 && "Step 1: Basic Information"}
                  {currentStep === 2 && "Step 2: Email Verification"}
                  {currentStep === 3 && "Step 3: Phone Verification"}
                  {currentStep === 4 && "🎉 Registration Complete!"}
                </CardTitle>
                <CardDescription>
                  {currentStep === 1 && "Please provide your basic information to get started"}
                  {currentStep === 2 && "Verify your email address to secure your account"}
                  {currentStep === 3 && "Confirm your phone number for account security"}
                  {currentStep === 4 && "You're all set! Welcome to our platform."}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-500">
                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">
                          Full Name *
                        </Label>
                        <Input
                          id="full_name"
                          value={profile.full_name}
                          onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                          placeholder="Enter your full name"
                          className="h-12 text-base"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Phone Number *
                        </Label>
                        <PhoneInput
                          value={fullPhoneNumber}
                          onChange={(value) => setFullPhoneNumber(value)}
                          placeholder="Enter your phone number"
                          className=""
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                          Location *
                        </Label>
                        <Input
                          id="location"
                          value={profile.location}
                          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                          placeholder="City, Country"
                          className="h-12 text-base"
                        />
                      </div>
                    </div>
                    
                    <Button
                      onClick={saveProfileData}
                      disabled={saving || !profile.full_name || !fullPhoneNumber || !profile.location}
                      className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      size="lg"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Saving Information...
                        </>
                      ) : (
                        <>
                          Continue to Email Verification
                          <CheckCircle2 className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Step 2: Email Verification */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-500">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                        <Mail className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Check Your Email</h3>
                      <p className="text-gray-600">
                        We sent a verification link to{' '}
                        <span className="font-semibold text-gray-900">{user?.email}</span>
                      </p>
                    </div>
                    
                    {profile.is_email_verified ? (
                      <div className="p-6 bg-green-50 rounded-xl border border-green-200">
                        <div className="flex items-center justify-center gap-3">
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                          <p className="text-green-800 font-medium">Email verified successfully!</p>
                        </div>
                        <Button
                          onClick={() => setCurrentStep(3)}
                          className="w-full mt-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                        >
                          Continue to Phone Verification
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-800">
                            💡 <strong>Tip:</strong> Check your spam folder if you don't see the email.
                          </p>
                        </div>
                        <Button
                          onClick={sendEmailVerification}
                          disabled={emailResendCooldown > 0}
                          variant="outline"
                          className="w-full h-12"
                        >
                          {emailResendCooldown > 0 ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Resend in {emailResendCooldown}s
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4 mr-2" />
                              Resend Verification Email
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-gray-500 text-center">
                          Didn't receive the email? Check your spam folder or try resending.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Phone Verification */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-500">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                        <Phone className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Verify Your Phone</h3>
                      <p className="text-gray-600">
                        We'll send a verification code to{' '}
                        <span className="font-semibold text-gray-900">{fullPhoneNumber}</span>
                      </p>
                    </div>
                    
                    {phoneVerificationStep === 'verified' ? (
                      <div className="p-6 bg-green-50 rounded-xl border border-green-200">
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                          <p className="text-green-800 font-medium">Phone verified successfully!</p>
                        </div>
                        <Button
                          onClick={handleComplete}
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                        >
                          🎉 Complete Registration
                        </Button>
                      </div>
                    ) : phoneVerificationStep === 'code-sent' ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <p className="text-sm text-purple-800">
                            📱 Enter the 6-digit code sent to your phone
                          </p>
                        </div>
                        <div className="space-y-3">
                          <Input
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                            className="h-12 text-center text-xl font-mono tracking-widest"
                          />
                          <div className="flex gap-3">
                            <Button
                              onClick={verifyPhoneCode}
                              disabled={!verificationCode || verificationCode.length !== 6}
                              className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Verify Code
                            </Button>
                            <Button
                              onClick={sendPhoneVerification}
                              disabled={phoneResendCooldown > 0}
                              variant="outline"
                              className="h-12 px-6"
                            >
                              {phoneResendCooldown > 0 ? `${phoneResendCooldown}s` : 'Resend'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-700">
                            <strong>Firebase Status:</strong> {isFirebaseConfigured ? '✅ Configured' : '❌ Not configured'}
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            <strong>reCAPTCHA:</strong> {recaptchaVerifier ? '✅ Ready' : '⏳ Initializing...'}
                          </p>
                        </div>
                        <Button
                          onClick={sendPhoneVerification}
                          disabled={!fullPhoneNumber || !isFirebaseConfigured}
                          className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          {!isFirebaseConfigured ? 'SMS Service Unavailable' : 'Send Verification Code'}
                        </Button>
                        {!isFirebaseConfigured && (
                          <p className="text-xs text-red-600 text-center">
                            Phone verification is currently unavailable. Please contact support.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Completion */}
                {currentStep === 4 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-500 text-center">
                    <div>
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <Sparkles className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2 text-gray-900">🎉 Welcome aboard!</h3>
                      <p className="text-gray-600 text-lg">
                        Your registration is complete. You now have full access to all features.
                      </p>
                    </div>
                    
                    <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                          <p className="text-xs font-medium text-green-800">Profile Complete</p>
                        </div>
                        <div>
                          <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                          <p className="text-xs font-medium text-green-800">Email Verified</p>
                        </div>
                        <div>
                          <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                          <p className="text-xs font-medium text-green-800">Phone Verified</p>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleComplete}
                      className="w-full h-12 text-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg"
                    >
                      🚀 Enter Platform
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Back Navigation */}
            {currentStep > 1 && currentStep < 4 && (
              <div className="mt-6 text-center">
                <Button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  variant="ghost"
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← Back to Previous Step
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* reCAPTCHA container */}
      <div ref={recaptchaRef} className="hidden"></div>
    </div>
  )
}

// Main CompleteSignupPage component with Suspense boundary
export default function CompleteSignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Registration</h1>
            <p className="text-gray-600">Loading your profile setup...</p>
          </div>
          <Card className="shadow-xl">
            <CardContent className="p-8">
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <CompleteSignupPageWithSearchParams />
    </Suspense>
  )
}