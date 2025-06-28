'use client'

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase-client"
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
    is_email_verified: true, // Auto-verified for demo
    is_phone_verified: true  // Auto-verified for demo
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const returnUrl = searchParams.get('return') || '/'

  // Simplified completion check - just need basic info
  const isFullyComplete = () => {
    return !!(profile.full_name && profile.phone && profile.location)
  }

  // Simplified profile loading
  useEffect(() => {
    async function loadProfile() {
      try {
        if (!user) {
          if (!loading) router.push('/auth/login')
          return
        }

        const { data: profileData } = await supabase!
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile({
            full_name: profileData.full_name || '',
            phone: profileData.phone || '',
            location: profileData.location || '',
            is_email_verified: true, // Auto-verified for demo
            is_phone_verified: true  // Auto-verified for demo
          })
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [user, router, loading])

  // Simplified save and complete function
  const handleCompleteProfile = async () => {
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
      // Save profile data with verification flags set to true
      const { error } = await supabase!
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          location: profile.location,
          is_email_verified: true,  // Auto-verified for demo
          is_phone_verified: true   // Auto-verified for demo
        })
        .eq('id', user?.id)

      if (error) throw error

      toast({
        title: "🎉 Profile completed!",
        description: "Welcome! Your account is now fully set up."
      })
      
      // Redirect immediately
      router.push(returnUrl)

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

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading...</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">Just fill in your basic information to get started</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>This information will be used for your profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Enter your full name"
                className="h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <PhoneInput
                value={profile.phone}
                onChange={(value) => setProfile({ ...profile, phone: value })}
                placeholder="Enter your phone number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                placeholder="City, Country"
                className="h-12"
              />
            </div>
            
            <Button
              onClick={handleCompleteProfile}
              disabled={saving || !isFullyComplete()}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Completing Profile...
                </>
              ) : (
                <>
                  Complete Profile & Continue
                  <CheckCircle2 className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
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