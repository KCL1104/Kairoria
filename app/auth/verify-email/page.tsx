"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Mail, CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/SupabaseAuthContext"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function VerifyEmailPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState("")
  const { sendEmailConfirmation } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const email = searchParams.get('email')
  const name = searchParams.get('name')
  
  useEffect(() => {
    // If no email in URL params, redirect back to register
    if (!email) {
      router.replace('/auth/register')
    }
  }, [email, router])

  const handleSendConfirmation = async () => {
    if (!email) return
    
    setError("")
    setIsLoading(true)
    
    try {
      const { error } = await sendEmailConfirmation(email)
      if (!error) {
        setEmailSent(true)
      } else {
        setError(error.message || "Failed to send confirmation email")
      }
    } catch (error) {
      setError("Failed to send confirmation email. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!email) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="container max-w-lg py-10">
      <div className="mb-6">
        <Link href="/auth/register" className="text-sm text-muted-foreground flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Registration
        </Link>
      </div>
      
      <div className="flex justify-center mb-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-xl">
          <span>Kairoria</span>
        </Link>
      </div>
      
      <Card>
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4">
            {emailSent ? (
              <CheckCircle className="h-12 w-12 text-green-500" />
            ) : (
              <Mail className="h-12 w-12 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {emailSent ? "Email Sent!" : "Verify Your Email"}
          </CardTitle>
          <CardDescription>
            {emailSent ? (
              <>We've sent a confirmation link to <strong>{email}</strong></>  
            ) : (
              <>Hi {name}, please verify your email address to complete your registration</>  
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {emailSent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Check your email and click the confirmation link to activate your account.
                The link will expire in 24 hours.
              </p>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleSendConfirmation}
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Resend Email"}
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => router.push('/auth/login')}
                >
                  Go to Login
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Email Address:</p>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Click the button below to send a confirmation email to this address.
                You'll need to click the link in the email to activate your account.
              </p>
              
              {error && (
                <div className="text-sm text-destructive text-center">
                  {error}
                </div>
              )}
              
              <Button 
                onClick={handleSendConfirmation} 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Confirmation Email"}
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => router.push('/auth/register')}
              >
                Change Email Address
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <p className="text-center text-sm text-muted-foreground mt-6">
        Didn't receive the email? Check your spam folder or try resending.
      </p>
    </div>
  )
}