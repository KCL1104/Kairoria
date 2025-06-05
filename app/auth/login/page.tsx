"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/SupabaseAuthContext"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
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
import { Separator } from "@/components/ui/separator"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { signIn, signInWithGoogle, signInWithTwitter, signInWithSolana, isAuthenticated, isLoading: authLoading } = useAuth()
  const { connected } = useWallet()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

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
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    
    try {
      const { error } = await signIn(email, password)
      if (!error) {
        router.push("/")
      } else {
        setError(error.message || "Invalid email or password")
      }
    } catch (error) {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError("")
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setError(error.message || "Google login failed")
      }
    } catch (error) {
      setError("Google login failed. Please try again.")
    }
  }

  const handleTwitterLogin = async () => {
    setError("")
    try {
      const { error } = await signInWithTwitter()
      if (error) {
        setError(error.message || "Twitter login failed")
      }
    } catch (error) {
      setError("Twitter login failed. Please try again.")
    }
  }

  const handleSolanaLogin = async () => {
    setError("")
    if (!connected) {
      setError("Please connect your Solana wallet first")
      return
    }
    
    try {
      const { error } = await signInWithSolana()
      if (!error) {
        router.push("/")
      } else {
        setError(error.message || "Solana wallet login failed")
      }
    } catch (error) {
      setError("Solana wallet login failed. Please try again.")
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
          <CardTitle className="text-2xl font-bold text-center">Sign in</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email/Password Form */}
          <form onSubmit={handleLogin} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <div className="text-sm text-destructive text-center">
                {error}
                {(error.includes('OAuth') || error.includes('redirect_uri')) && (
                  <div className="mt-2">
                    <Link 
                      href="/auth/google-oauth-fix" 
                      className="text-xs text-primary underline"
                    >
                      Fix Google OAuth redirect_uri_mismatch error →
                    </Link>
                  </div>
                )}
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
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
              onClick={handleGoogleLogin}
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
              Continue with Google
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleTwitterLogin}
            >
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              Continue with Twitter
            </Button>

            <div className="space-y-2">
              <style jsx global>{`
                .wallet-adapter-button {
                  background-color: white !important;
                  color: black !important;
                  border: 1px solid #d1d5db !important;
                  font-weight: 500 !important;
                }
                .wallet-adapter-button:hover {
                  background-color: #f9fafb !important;
                }
                .wallet-adapter-button:not([disabled]):hover {
                  background-color: #f9fafb !important;
                }
              `}</style>
              <WalletMultiButton className="!w-full" />
              {connected && (
                <Button 
                  variant="outline" 
                  className="w-full bg-white text-black border-gray-300 hover:bg-gray-50" 
                  onClick={handleSolanaLogin}
                >
                  Sign in with Connected Wallet
                </Button>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-center w-full text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
      
      <p className="text-center text-sm text-muted-foreground mt-6">
        By signing in, you agree to our{" "}
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