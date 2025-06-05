"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { useEffect } from 'react'
import { ArrowLeft, Copy, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useState } from 'react'

export default function GoogleOAuthFixPage() {
  const [copied, setCopied] = useState<string | null>(null)
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // Redirect authenticated users to home page
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/')
    }
  }, [isAuthenticated, authLoading, router])

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const redirectUri = "https://ubykuxexphcowvjvdvuo.supabase.co/auth/v1/callback"
  const clientId = "944207055388-vuf90l1jsq7qsaevu7iibmmhmub64keu.apps.googleusercontent.com"

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-6">
        <Link href="/auth/login" className="text-sm text-muted-foreground flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Link>
      </div>

      <div className="flex justify-center mb-6">
        <h1 className="text-2xl font-bold">Google OAuth redirect_uri_mismatch Fix</h1>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Error:</strong> redirect_uri_mismatch - You need to add the Supabase redirect URI to your Google Cloud Console OAuth configuration.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {/* Error Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>🔍 What the Error Means</CardTitle>
            <CardDescription>
              Google is rejecting the OAuth request because the redirect URI isn't authorized
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-destructive">Missing Redirect URI:</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-red-50 border border-red-200 px-2 py-1 rounded text-sm flex-1">
                  {redirectUri}
                </code>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(redirectUri, 'redirect-uri')}
                >
                  {copied === 'redirect-uri' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Your Google Client ID:</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-muted px-2 py-1 rounded text-sm flex-1 text-xs">
                  {clientId}
                </code>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(clientId, 'client-id')}
                >
                  {copied === 'client-id' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step-by-step Fix */}
        <Card>
          <CardHeader>
            <CardTitle>🛠️ How to Fix This</CardTitle>
            <CardDescription>
              Follow these exact steps to add the redirect URI to Google Cloud Console
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold flex items-center gap-2">
                  Step 1: Open Google Cloud Console
                  <a 
                    href="https://console.cloud.google.com/apis/credentials" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Go to: APIs & Services → Credentials
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
                >
                  Open Google Cloud Console <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </div>

              {/* Step 2 */}
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold">Step 2: Find Your OAuth Client</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Look for the Client ID ending in: <code className="bg-muted px-1 rounded">...hmub64keu.apps.googleusercontent.com</code>
                </p>
                <p className="text-sm text-muted-foreground">
                  Click the <strong>pencil/edit icon</strong> next to it
                </p>
              </div>

              {/* Step 3 */}
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold">Step 3: Add Redirect URI</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Scroll down to <strong>"Authorized redirect URIs"</strong>
                </p>
                <ol className="text-sm mt-2 space-y-1">
                  <li>1. Click <strong>"+ ADD URI"</strong></li>
                  <li>2. Paste this exact URL:</li>
                </ol>
                <div className="flex items-center gap-2 mt-2">
                  <code className="bg-green-50 border border-green-200 px-2 py-1 rounded text-sm flex-1">
                    {redirectUri}
                  </code>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(redirectUri, 'step3-uri')}
                  >
                    {copied === 'step3-uri' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm mt-2">3. Click <strong>"SAVE"</strong></p>
              </div>

              {/* Step 4 */}
              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="font-semibold">Step 4: Wait & Test</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Wait <strong>2-5 minutes</strong> for Google to update their servers, then test the login again.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Common Issues */}
        <Card>
          <CardHeader>
            <CardTitle>⚠️ Common Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span><strong>Wrong project:</strong> Make sure you're in the correct Google Cloud project</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span><strong>Typos:</strong> The URI must be copied exactly - no extra spaces or characters</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span><strong>Not saved:</strong> Make sure to click "SAVE" after adding the URI</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span><strong>Cache delay:</strong> Changes can take 2-5 minutes to take effect</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Success Message */}
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>After adding the redirect URI:</strong> Your Google OAuth should work immediately. 
            If it doesn't work right away, wait a few minutes and try again.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
} 