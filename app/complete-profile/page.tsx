"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import PhoneInput from 'react-phone-number-input'
import { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import './phone-input-styles.css'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase-client"
import { auth, RecaptchaVerifier, signInWithPhoneNumber, isFirebaseConfigured } from "@/lib/firebase"
import type { ConfirmationResult } from "firebase/auth"
import { Check, Upload, Phone, Shield, AlertTriangle } from "lucide-react"

const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  bio: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  phone: z.string().refine((phone) => {
    if (!phone) return false;
    return isValidPhoneNumber(phone);
  }, "Please enter a valid phone number"),
  avatar_url: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

interface UserProfile {
  id: string
  full_name?: string
  email: string
  bio?: string
  avatar_url?: string
  location?: string
  phone?: string
  is_email_verified: boolean
  is_phone_verified: boolean
}

export default function CompleteProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [phoneVerificationStep, setPhoneVerificationStep] = useState<'initial' | 'code-sent' | 'verified'>('initial')
  const [verificationCode, setVerificationCode] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailResendCooldown, setEmailResendCooldown] = useState(0)
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>()

  const recaptchaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isValid },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
  })

  const watchedPhoneNumber = watch("phone")

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

  // Load existing profile data
  useEffect(() => {
    async function loadProfile() {
      try {
        if (!supabase) {
          toast({
            variant: "destructive",
            title: "Configuration Error",
            description: "Database connection not available"
          });
          return;
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push('/auth/login')
          return
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        let finalProfileData = null
        
        if (profileError) {
          // Check if the error is because the profile doesn't exist
          if (profileError.code === 'PGRST116') {
            console.log('Profile does not exist, creating a new one...')
            
            // Create a new profile
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email,
                full_name: null,
                bio: null,
                avatar_url: null,
                location: null,
                phone: null,
                is_email_verified: false, // Email verification will be handled separately
                is_phone_verified: false, // Phone verification will be handled separately
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single()

            if (createError) {
              console.error('Error creating profile:', createError)
              toast({
                variant: "destructive",
                title: "Error creating profile",
                description: "Failed to create your profile. Please try again."
              })
              return
            }

            console.log('New profile created:', newProfile)
            finalProfileData = newProfile
          } else {
            console.error('Error fetching profile:', profileError)
            toast({
              variant: "destructive",
              title: "Error loading profile",
              description: "Failed to load your profile data"
            })
            return
          }
        } else {
          finalProfileData = profileData
        }
        
        // Set profile state
        setProfile(finalProfileData)
        
        // Pre-fill form with existing data (works for both existing and newly created profiles)
        if (finalProfileData) {
          if (finalProfileData.full_name) setValue("full_name", finalProfileData.full_name)
          if (finalProfileData.bio) setValue("bio", finalProfileData.bio)
          if (finalProfileData.location) setValue("location", finalProfileData.location)
          if (finalProfileData.avatar_url) setValue("avatar_url", finalProfileData.avatar_url)
          
          // Set phone number directly
          if (finalProfileData.phone) {
            const phoneStr = finalProfileData.phone.toString()
            setPhoneNumber(phoneStr)
            setValue("phone", phoneStr)
          }
          
          if (finalProfileData.is_phone_verified) {
            setPhoneVerificationStep('verified')
            setPhoneVerified(true)
          }
          
          if (finalProfileData.is_email_verified) {
            setEmailVerified(true)
          }
        }

      } catch (error) {
        console.error('Error:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred"
        })
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [setValue, toast, router])

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Countdown timer for email resend cooldown
  useEffect(() => {
    if (emailResendCooldown > 0) {
      const timer = setTimeout(() => setEmailResendCooldown(emailResendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [emailResendCooldown])

  // Check email verification status
  useEffect(() => {
    const checkEmailVerification = async () => {
      if (!supabase) return
      
      try {
        const { data: { user } } = await supabase.auth.getUser()
        console.log('Email verification check:', {
          userEmail: user?.email,
          emailConfirmedAt: user?.email_confirmed_at,
          isVerified: !!user?.email_confirmed_at
        })
        
        if (user?.email_confirmed_at) {
          setEmailVerified(true)
        }
      } catch (error) {
        console.error('Error checking email verification:', error)
      }
    }

    checkEmailVerification()
    
    // Listen for auth state changes to update email verification status
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state change - email verification:', {
          event,
          userEmail: session?.user?.email,
          emailConfirmedAt: session?.user?.email_confirmed_at,
          isVerified: !!session?.user?.email_confirmed_at
        })
        
        if (session?.user?.email_confirmed_at) {
          setEmailVerified(true)
        }
      })
      
      return () => subscription.unsubscribe()
    }
  }, [])

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please select an image smaller than 5MB"
      })
      return
    }

    setAvatarUploading(true)

    try {
      if (!supabase) {
        throw new Error('Database connection not available')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      setValue("avatar_url", publicUrl)
      
      toast({
        title: "Avatar uploaded",
        description: "Your profile picture has been uploaded successfully"
      })

    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload your profile picture"
      })
    } finally {
      setAvatarUploading(false)
    }
  }

  const sendVerificationCode = async () => {
    if (!recaptchaVerifier || !auth || !isFirebaseConfigured) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Phone verification is not available"
      })
      return
    }

    const fullPhoneNumber = phoneNumber
    if (!fullPhoneNumber) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a phone number"
      })
      return
    }

    // Validate phone number format
    if (!isValidPhoneNumber(fullPhoneNumber)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid phone number"
      })
      return
    }
    
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifier)
      setConfirmationResult(confirmationResult)
      setPhoneVerificationStep('code-sent')
      setResendCooldown(60) // 60 second cooldown
      
      toast({
        title: "Verification code sent",
        description: `A 6-digit code has been sent to ${fullPhoneNumber}`
      })
    } catch (error: any) {
      console.error('Error sending verification code:', error)
      
      let errorMessage = "Failed to send verification code"
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = "Invalid phone number format"
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many requests. Please try again later."
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
    }
  }

  const verifyCode = async () => {
    if (!confirmationResult || !verificationCode) return

    try {
      await confirmationResult.confirm(verificationCode)
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

  const sendEmailVerification = async () => {
    if (!supabase) {
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
        email: profile?.email || ''
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

  const onSubmit = async (data: ProfileForm) => {
    setSubmitting(true)

    try {
      const response = await fetch('/api/profiles/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          phone: data.phone, // Use the full phone number directly
          is_email_verified: emailVerified,
          is_phone_verified: phoneVerified || !isFirebaseConfigured,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update profile')
      }

      toast({
        title: "Profile completed",
        description: "Your profile has been successfully updated"
      })

      // Redirect to the return URL if provided, otherwise to profile
      const returnUrl = searchParams.get('return')
      router.push(returnUrl && returnUrl !== '/complete-profile' ? decodeURI(returnUrl) : '/profile')

    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update your profile"
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container max-w-2xl py-10">
        <div className="flex justify-center items-center min-h-[500px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-10">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Welcome to Kairoria! Please complete your profile information to get started with our marketplace.
            You'll need to verify your email, provide your location and phone number, and verify your phone for security.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isFirebaseConfigured && (
            <div className="flex items-center space-x-2 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Phone verification is currently unavailable. You can complete your profile without phone verification.
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={watch("avatar_url") || ""} alt="Profile picture" />
                <AvatarFallback className="text-2xl">
                  {watch("full_name")?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center space-x-2">
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" disabled={avatarUploading} asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {avatarUploading ? "Uploading..." : "Upload Photo"}
                    </span>
                  </Button>
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Email Verification Section */}
            <div className="space-y-4">
              <Label>Email Verification *</Label>
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{profile?.email}</span>
                    {emailVerified ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <Check className="h-4 w-4" />
                        <span className="text-sm font-medium">Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-orange-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Unverified</span>
                      </div>
                    )}
                  </div>
                  {!emailVerified && (
                    <Button
                      type="button"
                      onClick={sendEmailVerification}
                      disabled={emailResendCooldown > 0}
                      variant="outline"
                      size="sm"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {emailResendCooldown > 0 
                        ? `Resend (${emailResendCooldown}s)`
                        : 'Send Verification'
                      }
                    </Button>
                  )}
                </div>
                {!emailVerified && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Please check your email and click the verification link to continue.
                  </p>
                )}
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                {...register("full_name")}
                placeholder="Enter your full name"
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                {...register("bio")}
                placeholder="Tell us about yourself..."
                rows={4}
              />
              {errors.bio && (
                <p className="text-sm text-destructive">{errors.bio.message}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                {...register("location")}
                placeholder="Enter your city and state"
              />
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location.message}</p>
              )}
            </div>

            {/* Phone Number Verification */}
            <div className="space-y-4">
              <Label htmlFor="phone">
                Phone Number * {isFirebaseConfigured ? "(Required for verification)" : "(Verification unavailable)"}
              </Label>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <PhoneInput
                          placeholder="Enter phone number"
                          value={phoneNumber}
                          onChange={(value) => {
                            setPhoneNumber(value)
                            onChange(value)
                          }}
                          defaultCountry="US"
                          disabled={phoneVerificationStep === 'verified'}
                          className={phoneVerificationStep === 'verified' ? 'phone-input-verified' : 'phone-input'}
                        />
                      )}
                    />
                  </div>
                  {phoneVerificationStep === 'verified' ? (
                    <Button type="button" disabled className="bg-green-600">
                      <Check className="h-4 w-4 mr-2" />
                      Verified
                    </Button>
                  ) : isFirebaseConfigured ? (
                    <Button
                      type="button"
                      onClick={sendVerificationCode}
                      disabled={!phoneNumber || phoneVerificationStep === 'code-sent' || resendCooldown > 0}
                      variant="outline"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      {phoneVerificationStep === 'code-sent' 
                        ? resendCooldown > 0 
                          ? `Resend (${resendCooldown}s)`
                          : 'Resend Code'
                        : 'Send Code'
                      }
                    </Button>
                  ) : (
                    <Button type="button" disabled variant="outline">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Unavailable
                    </Button>
                  )}
                </div>

                {phoneVerificationStep === 'code-sent' && isFirebaseConfigured && (
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      maxLength={6}
                    />
                    <Button
                      type="button"
                      onClick={verifyCode}
                      disabled={verificationCode.length !== 6}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Verify
                    </Button>
                  </div>
                )}

                {phoneVerificationStep === 'verified' && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Phone number verified successfully</span>
                  </div>
                )}
              </div>
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter your complete phone number including country code. The country will be automatically detected.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || !isValid || !emailVerified || (isFirebaseConfigured && !phoneVerified)}
            >
              {submitting ? "Saving Profile..." : "Save Profile"}
            </Button>
            
            {/* Verification Status Summary */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Verification Required:
              </p>
              <div className="flex justify-center space-x-4 text-sm">
                <div className={`flex items-center space-x-1 ${emailVerified ? 'text-green-600' : 'text-orange-600'}`}>
                  {emailVerified ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <span>Email</span>
                </div>
                <div className={`flex items-center space-x-1 ${
                  phoneVerified || !isFirebaseConfigured ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {phoneVerified || !isFirebaseConfigured ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <span>Phone {!isFirebaseConfigured && '(Disabled)'}</span>
                </div>
              </div>
            </div>
          </form>

          {/* Invisible reCAPTCHA container */}
          {isFirebaseConfigured && <div ref={recaptchaRef}></div>}
        </CardContent>
      </Card>
    </div>
  )
}