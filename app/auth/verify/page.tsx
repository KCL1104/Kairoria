"use client"

import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

enum VerificationStatus {
  LOADING,
  SUCCESS,
  FAILED
}

// Component that uses useSearchParams
function VerifyPageWithSearchParams() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  
  const [status, setStatus] = useState<VerificationStatus>(VerificationStatus.LOADING)
  const [message, setMessage] = useState<string>("Verifying your email address...")
  
  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus(VerificationStatus.FAILED)
        setMessage("Verification failed. No token provided.")
        return
      }
      
      try {
        // In a real app, this would make an API request to verify the token
        // const response = await fetch(`/api/auth/verify?token=${token}`)
        // const data = await response.json()
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Simulate successful verification
        setStatus(VerificationStatus.SUCCESS)
        setMessage("Your email has been successfully verified!")
        
        // Redirect to login after success
        setTimeout(() => {
          router.push("/auth/login")
        }, 3000)
      } catch (error) {
        setStatus(VerificationStatus.FAILED)
        setMessage("Verification failed. The link may be invalid or expired.")
      }
    }
    
    verifyEmail()
  }, [token, router])
  
  return (
    <div className="container max-w-lg py-10">
      <div className="flex justify-center mb-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-xl">
          <span>Kairoria</span>
        </Link>
      </div>
      
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Email Verification</CardTitle>
          <CardDescription className="text-center">
            {status === VerificationStatus.LOADING
              ? "We're verifying your email address"
              : status === VerificationStatus.SUCCESS
              ? "Your email has been verified"
              : "Verification failed"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center pt-6">
          {status === VerificationStatus.LOADING && (
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
          )}
          {status === VerificationStatus.SUCCESS && (
            <CheckCircle className="h-16 w-16 text-primary" />
          )}
          {status === VerificationStatus.FAILED && (
            <XCircle className="h-16 w-16 text-destructive" />
          )}
          
          <p className="mt-6 text-center">
            {message}
          </p>
          
          {status === VerificationStatus.SUCCESS && (
            <p className="mt-2 text-sm text-muted-foreground text-center">
              Redirecting you to the login page...
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {status === VerificationStatus.FAILED && (
            <div className="flex flex-col items-center space-y-4">
              <Button asChild>
                <Link href="/auth/register">
                  Try registering again
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                If you continue to have issues, please{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  contact support
                </Link>
              </p>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

// Main VerifyPage component with Suspense boundary
export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-lg py-10">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-xl">
            <span>Kairoria</span>
          </Link>
        </div>
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Verifying...</CardTitle>
            <CardDescription className="text-center">
              Please wait while we verify your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyPageWithSearchParams />
    </Suspense>
  )
}