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
import { Check, Mail, Phone, Shield, AlertTriangle, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/SupabaseAuthContext"

export default function CompleteSignupPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [emailVerified, setEmailVerified] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [emailResendCooldown, setEmailResendCooldown] = useState(0)
  const [phoneResendCooldown, setPhoneResendCooldown] = useState(0)
  const [phoneVerificationStep, setPhoneVerificationStep] = useState<'initial' | 'code-sent' | 'verified'>('initial')
  const [verificationCode, setVerificationCode] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const recaptchaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const returnUrl = searchParams.get('return') || '/'

  // Initialize recaptcha verifier
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

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          return
        }
        
        setProfile(profileData)
        setEmailVerified(profileData.is_email_verified || false)
        setPhoneVerified(profileData.is_phone_verified || false)
        
        if (profileData.is_phone_verified) {
          setPhoneVerificationStep('verified')
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

  const sendPhoneVerification = async () => {
    if (!profile?.phone || !recaptchaVerifier || !auth) {
      toast({
        variant: "destructive",
        title: "Phone verification unavailable",
        description: "Phone number or verification system not available"
      })
      return
    }

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
        description: "Failed to send verification code. Please try again."
      })
    }
  }

  const verifyPhoneCode = async () => {
    if (!confirmationResult || !verificationCode) {
      toast({
        variant: "destructive",
        title: "Invalid code",
        description: "Please enter the verification code"
      })
      return
    }

    try {
      await confirmationResult.confirm(verificationCode)
      
      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({ is_phone_verified: true })
        .eq('id', user?.id)

      if (error) throw error

      setPhoneVerificationStep('verified')
      setPhoneVerified(true)
      
      toast({
        title: "Phone verified",
        description: "Your phone number has been successfully verified"
      })

    } catch (error) {
      console.error('Error verifying code:', error)
      toast({
        variant: "destructive",
        title: "Invalid code",
        description: "The verification code is incorrect. Please try again."
      })
    }
  }

  const handleEmailVerification = async () => {
    if (!supabase || !user) return

    try {
      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({ is_email_verified: true })
        .eq('id', user.id)

      if (error) throw error

      setEmailVerified(true)
      
      toast({
        title: "Email verified",
        description: "Your email has been successfully verified"
      })

    } catch (error) {
      console.error('Error updating email verification:', error)
    }
  }

  // Check email verification status
  useEffect(() => {
    const checkEmailVerification = async () => {
      if (!supabase || !user) return
      
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (currentUser?.email_confirmed_at && !emailVerified) {
          await handleEmailVerification()
        }
      } catch (error) {
        console.error('Error checking email verification:', error)
      }
    }

    checkEmailVerification()
    
    // Listen for auth state changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user?.email_confirmed_at && !emailVerified) {
          await handleEmailVerification()
        }
      })
      
      return () => subscription.unsubscribe()
    }
  }, [user, emailVerified])

  const handleContinue = async () => {
    if (!emailVerified || !phoneVerified) {
      toast({
        variant: "destructive",
        title: "Verification required",
        description: "Please verify both your email and phone number before continuing"
      })
      return
    }

    setSubmitting(true)
    
    try {
      // Redirect to the return URL or home
      router.push(returnUrl)
    } catch (error) {
      console.error('Error continuing:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
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
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Complete Verification
          </CardTitle>
          <CardDescription className="text-gray-600">
            Verify your email and phone number to complete your signup
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Email Verification */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-600" />
              <Label className="text-sm font-medium">Email Verification</Label>
              {emailVerified && <Check className="w-4 h-4 text-green-600" />}
            </div>
            
            {emailVerified ? (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">✓ Email verified successfully</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">We sent a verification link to {user?.email}</p>
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

          {/* Phone Verification */}
          {isFirebaseConfigured && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-600" />
                <Label className="text-sm font-medium">Phone Verification</Label>
                {phoneVerified && <Check className="w-4 h-4 text-green-600" />}
              </div>
              
              {phoneVerificationStep === 'verified' ? (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">✓ Phone verified successfully</p>
                </div>
              ) : phoneVerificationStep === 'code-sent' ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Enter the verification code sent to {profile?.phone}</p>
                  <Input
                    type="text"
                    placeholder="Enter verification code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                  />
                  <div className="flex space-x-2">
                    <Button
                      onClick={verifyPhoneCode}
                      disabled={!verificationCode}
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
                  <p className="text-sm text-gray-600">We'll send a verification code to {profile?.phone}</p>
                  <Button
                    onClick={sendPhoneVerification}
                    disabled={!profile?.phone}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Send Verification Code
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Continue Button */}
          <div className="pt-4">
            <Button
              onClick={handleContinue}
              disabled={!emailVerified || (!phoneVerified && isFirebaseConfigured) || submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Continuing...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </div>

          {/* Status */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              {emailVerified && (phoneVerified || !isFirebaseConfigured) 
                ? "All verifications complete! You can now continue."
                : "Please complete all verifications to continue."
              }
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* reCAPTCHA container */}
      <div ref={recaptchaRef} className="hidden"></div>
    </div>
  )
}