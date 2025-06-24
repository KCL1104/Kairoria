"use client"

import Link from "next/link"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle, Lock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Component that uses useSearchParams
function ResetPasswordPageWithSearchParams() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  
  // If there's a token in the URL, redirect to the token-specific page
  useEffect(() => {
    if (token) {
      router.push(`/auth/reset-password/${token}`)
    }
  }, [token, router])
  
  return (
    <div className="container max-w-lg py-10">
      <div className="mb-6">
        <Link href="/auth/login" className="text-sm text-muted-foreground flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Link>
      </div>
      
      <div className="flex justify-center mb-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-xl">
          <span>Kairoria</span>
        </Link>
      </div>
      
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pt-6">
          <AlertCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            To reset your password, please go to the{" "}
            <Link
              href="/auth/forgot-password"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              forgot password page
            </Link>
            {" "}and enter your email address.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/auth/forgot-password">
              Go to Forgot Password
            </Link>
          </Button>
        </CardContent>
        <CardFooter>
          <div className="text-center w-full text-sm">
            Remember your password?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

// Main ResetPasswordPage component with Suspense boundary
export default function ResetPasswordPage() {
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
            <CardTitle className="text-2xl font-bold text-center">Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <ResetPasswordPageWithSearchParams />
    </Suspense>
  )
}