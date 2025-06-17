"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/SupabaseAuthContext"

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
import { Checkbox } from "@/components/ui/checkbox"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { signUp, signInWithGoogle, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Redirect authenticated users to home page
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/')
    }
  }, [isAuthenticated, authLoading, router])

  // Handle OAuth errors from URL parameters
  useEffect(() => {
    const oauthError = searchParams.get('error')
    if (oauthError) {
      setError(decodeURIComponent(oauthError))
    }
  }, [searchParams])

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div className="container max-w-lg py-10">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    
    try {
      const { error } = await signUp(email, password, name)
      if (!error) {
        // Registration successful - redirect to email verification page
        const params = new URLSearchParams({
          email: email,
          name: name
        })
        router.push(`/auth/verify-email?${params.toString()}`)
      } else {
        setError(error.message || "Registration failed")
      }
    } catch (error) {
      setError("Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setError("")
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setError(error.message || "Google sign up failed")
      }
      // If successful, auth context and middleware will handle redirection
    } catch (error) {
      setError("Google sign up failed. Please try again.")
    }
  }


  
  return (
    <div className="container max-w-lg py-10">
      <div className="mb-6">
        <Link href="/" className="text-sm text-muted-foreground flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </div>
      
      <div className="flex justify-center mb-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-xl">
          <span>Kairoria</span>
        </Link>
      </div>
      
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your information to create a Kairoria account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email/Password Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" required />
              <Label htmlFor="terms" className="text-sm">
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  Terms of Service
                </Link>
                {" "}and{" "}
                <Link
                  href="/privacy"
                  className="text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  Privacy Policy
                </Link>
              </Label>
            </div>
            
            {error && (
              <div className="text-sm text-destructive text-center">
                {error}
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          
          <div className="flex items-center">
            <div className="flex-1 h-px bg-border"></div>
            <span className="px-2 text-sm text-muted-foreground">OR</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>
          
          {/* OAuth and Solana Wallet Options */}
          <div className="grid gap-3">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleGoogleSignUp}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </Button>
            

          </div>
        </CardContent>
        <CardFooter>
          <div className="text-center w-full text-sm">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
      
      <p className="text-center text-sm text-muted-foreground mt-6">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </Link>
        {" "}and{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </Link>
      </p>
    </div>
  )
}