'use client'

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase-client"
import { auth, RecaptchaVerifier, signInWithPhoneNumber, isFirebaseConfigured } from "@/lib/firebase"
import type { ConfirmationResult } from "firebase/auth"
import { Check, Mail, Phone, Shield, User, MapPin, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/SupabaseAuthContext"

interface ProfileData {
  full_name: string
  phone: string
  location: string
  is_email_verified: boolean
  is_phone_verified: boolean
}

export default function CompleteSignupPage() {
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    phone: '',
    location: '',
    is_email_verified: false,
    is_phone_verified: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
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
    if (typeof window !== 'undefined' && recaptchaRef.current && !recaptchaVerifier && isFirebaseConfigured && auth) {
      try {
        const verifier = new RecaptchaVerifier(auth, recaptchaRef.current, {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          },
        })
        setRecaptchaVerifier(verifier)
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error)
      }
    }
  }, [recaptchaVerifier])

  // Load profile data
  useEffect(() => {
    async function loadProfile() {
      try {
        if (!supabase || !user) {
          return
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile({
            full_name: profileData.full_name || '',
            phone: profileData.phone || '',
            location: profileData.location || '',
            is_email_verified: profileData.is_email_verified || false,
            is_phone_verified: profileData.is_phone_verified || false
          })
          
          if (profileData.is_phone_verified) {
            setPhoneVerificationStep('verified')
          }
        }

      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [user])

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

  // Save profile data
  const saveProfileData = async () => {
    if (!profile.full_name || !profile.phone || !profile.location) {
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
          phone: profile.phone,
          location: profile.location
        })
        .eq('id', user?.id)

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your profile information has been saved"
      })

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
    if (!supabase || !user?.email) {
      toast({
        variant: "destructive",
        title: "Email verification unavailable",
        description: "Database connection not available"
      })
      return
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      })

      if (error) throw error

      setEmailResendCooldown(60)
      toast({
        title: "Verification email sent",
        description: "Please check your email for the verification link"
      })

    } catch (error) {
      console.error('Error sending email verification:', error)
      toast({
        variant: "destructive",
        title: "Email verification failed",
        description: "Failed to send verification email. Please try again."
      })
    }
  }

  // Phone verification
  const sendPhoneVerification = async () => {
    if (!profile.phone || !recaptchaVerifier || !auth) {
      toast({
        variant: "destructive",
        title: "Phone verification unavailable",
        description: "Please enter a phone number first"
      })
      return
    }

    // Save phone number first
    await saveProfileData()

    try {
      const result = await signInWithPhoneNumber(auth, profile.phone, recaptchaVerifier)
      setConfirmationResult(result)
      setPhoneVerificationStep('code-sent')
      setPhoneResendCooldown(60)
      
      toast({
        title: "Verification code sent",
        description: "Please check your phone for the verification code"
      })

    } catch (error) {
      console.error('Error sending phone verification:', error)
      toast({
        variant: "destructive",
        title: "Phone verification failed",
        description: "Failed to send verification code"
      })
    }
  }

  const verifyPhoneCode = async () => {
    if (!confirmationResult || !verificationCode) return

    try {
      await confirmationResult.confirm(verificationCode)
      
      const { error } = await supabase!
        .from('profiles')
        .update({ is_phone_verified: true })
        .eq('id', user?.id)

      if (error) throw error

      setPhoneVerificationStep('verified')
      setProfile(prev => ({ ...prev, is_phone_verified: true }))
      
      toast({
        title: "Phone verified",
        description: "Your phone number has been successfully verified"
      })

    } catch (error) {
      console.error('Error verifying code:', error)
      toast({
        variant: "destructive",
        title: "Invalid code",
        description: "The verification code is incorrect"
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
              title: "Email verified",
              description: "Your email has been successfully verified"
            })
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
  }, [user, profile.is_email_verified])

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Complete Your Registration
            </CardTitle>
            <CardDescription className="text-gray-600">
              Please complete all steps to access all features
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Step 1: Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  profile.full_name && profile.phone && profile.location
                    ? 'bg-green-100'
                    : 'bg-blue-100'
                }`}>
                  {profile.full_name && profile.phone && profile.location ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <User className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold">Basic Information</h3>
              </div>
              
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+886 912 345 678"
                  />
                </div>
                
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="City, Country"
                  />
                </div>
                
                <Button
                  onClick={saveProfileData}
                  disabled={saving || !profile.full_name || !profile.phone || !profile.location}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Information'
                  )}
                </Button>
              </div>
            </div>

            {/* Step 2: Email Verification */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  profile.is_email_verified ? 'bg-green-100' : 'bg-orange-100'
                }`}>
                  {profile.is_email_verified ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Mail className="w-5 h-5 text-orange-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold">Email Verification</h3>
              </div>
              
              {profile.is_email_verified ? (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">✓ Email verified successfully</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    We sent a verification link to <strong>{user?.email}</strong>
                  </p>
                  <Button
                    onClick={sendEmailVerification}
                    disabled={emailResendCooldown > 0}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {emailResendCooldown > 0 ? `Resend in ${emailResendCooldown}s` : 'Resend Email'}
                  </Button>
                </div>
              )}
            </div>

            {/* Step 3: Phone Verification */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  profile.is_phone_verified ? 'bg-green-100' : 'bg-orange-100'
                }`}>
                  {profile.is_phone_verified ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Phone className="w-5 h-5 text-orange-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold">Phone Verification</h3>
              </div>
              
              {phoneVerificationStep === 'verified' ? (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">✓ Phone verified successfully</p>
                </div>
              ) : phoneVerificationStep === 'code-sent' ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Enter the verification code sent to <strong>{profile.phone}</strong>
                  </p>
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={verifyPhoneCode}
                      disabled={!verificationCode || verificationCode.length !== 6}
                      className="flex-1"
                    >
                      Verify Code
                    </Button>
                    <Button
                      onClick={sendPhoneVerification}
                      disabled={phoneResendCooldown > 0}
                      variant="outline"
                      size="sm"
                    >
                      {phoneResendCooldown > 0 ? `${phoneResendCooldown}s` : 'Resend'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    We'll send a verification code to your phone number
                  </p>
                  <Button
                    onClick={sendPhoneVerification}
                    disabled={!profile.phone}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Send Verification Code
                  </Button>
                </div>
              )}
            </div>

            {/* Complete Button */}
            <div className="pt-6 border-t">
              <Button
                onClick={handleComplete}
                disabled={!isFullyComplete()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {isFullyComplete() ? (
                  'Complete Registration'
                ) : (
                  'Please complete all steps above'
                )}
              </Button>
              
              {!isFullyComplete() && (
                <p className="text-sm text-gray-500 text-center mt-3">
                  Complete all steps to unlock full access to the platform
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* reCAPTCHA container */}
      <div ref={recaptchaRef} className="hidden"></div>
    </div>
  )
}