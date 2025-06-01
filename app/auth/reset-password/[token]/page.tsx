"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ShoppingBag, CheckCircle, Lock, AlertCircle } from "lucide-react"
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

// This generates a static page with a placeholder token at build time
export function generateStaticParams() {
  // Return a placeholder token that would never be used in real scenarios
  // The actual token validation will happen client-side
  return [{ token: "placeholder-token" }]
}

export default function ResetPasswordPage({
  params,
}: {
  params: { token: string }
}) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState(true)
  
  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      // For placeholder tokens, mark as invalid to show error
      if (params.token === "placeholder-token") {
        setIsValidToken(false)
        return
      }
      
      // In a real app, validate the token here
      // For demo, we'll treat all non-placeholder tokens as valid
      setIsValidToken(true)
    }
    
    validateToken()
  }, [params.token])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Basic validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    setIsLoading(true)
    
    // In a real application, this would call the password reset API
    // with the token from params.token and the new password
    setTimeout(() => {
      setIsLoading(false)
      setIsSuccess(true)
      
      // Redirect to login after success
      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)
    }, 1500)
  }
  
  return (
    <div className="container max-w-md py-10">
      <div className="mb-6">
        <Link href="/auth/login" className="text-sm text-muted-foreground flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Link>
      </div>
      
      <div className="flex justify-center mb-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-xl">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <span>Kairoria</span>
        </Link>
      </div>
      
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter a new password for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isValidToken ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Invalid or Expired Token</h3>
                <p className="text-muted-foreground">
                  This password reset link is invalid or has expired.
                </p>
                <p className="text-muted-foreground mt-2">
                  Please request a new password reset link.
                </p>
              </div>
              <Button className="mt-4" asChild>
                <Link href="/auth/forgot-password">
                  Request New Link
                </Link>
              </Button>
            </div>
          ) : !isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters and include uppercase, lowercase, 
                  number and special character.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              
              {error && (
                <div className="text-sm text-destructive">
                  {error}
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Processing..." : "Reset Password"}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Password Reset Successful</h3>
                <p className="text-muted-foreground">
                  Your password has been updated successfully.
                </p>
                <p className="text-muted-foreground mt-2">
                  Redirecting to login page...
                </p>
              </div>
            </div>
          )}
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