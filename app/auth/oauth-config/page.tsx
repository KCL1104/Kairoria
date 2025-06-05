"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { ArrowLeft, Copy, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function OAuthConfigPage() {
  const [currentDomain, setCurrentDomain] = useState('')
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // Redirect authenticated users to home page
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    setCurrentDomain(window.location.origin)
    
    // Get Supabase URL from environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL
    if (url) {
      setSupabaseUrl(url)
    }
  }, [])

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const extractProjectRef = (url: string) => {
    const match = url.match(/https:\/\/([^.]+)\.supabase\.co/)
    return match ? match[1] : 'ubykuxexphcowvjvdvuo'
  }

  const projectRef = supabaseUrl ? extractProjectRef(supabaseUrl) : 'ubykuxexphcowvjvdvuo'
  const supabaseOAuthRedirect = `https://${projectRef}.supabase.co/auth/v1/callback`

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-6">
        <Link href="/auth/login" className="text-sm text-muted-foreground flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Link>
      </div>

      <div className="flex justify-center mb-6">
        <h1 className="text-2xl font-bold">OAuth Configuration Helper</h1>
      </div>

      <div className="grid gap-6">
        {/* Current Environment */}
        <Card>
          <CardHeader>
            <CardTitle>Your Current Environment</CardTitle>
            <CardDescription>
              These are the URLs detected from your current deployment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current Domain:</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-muted px-2 py-1 rounded text-sm flex-1">
                  {currentDomain || 'Loading...'}
                </code>
                {currentDomain && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(currentDomain, 'domain')}
                  >
                    {copied === 'domain' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Supabase URL:</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-muted px-2 py-1 rounded text-sm flex-1">
                  {supabaseUrl || 'Not configured'}
                </code>
                {supabaseUrl && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(supabaseUrl, 'supabase')}
                  >
                    {copied === 'supabase' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supabase Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>1. Supabase Dashboard Configuration</CardTitle>
            <CardDescription>
              Go to your Supabase Dashboard → Authentication → Settings → URL Configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Site URL:</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-muted px-2 py-1 rounded text-sm flex-1">
                  {currentDomain}
                </code>
                {currentDomain && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(currentDomain, 'site-url')}
                  >
                    {copied === 'site-url' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Redirect URLs (add this):</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-muted px-2 py-1 rounded text-sm flex-1">
                  {currentDomain}/auth/callback
                </code>
                {currentDomain && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(`${currentDomain}/auth/callback`, 'redirect-url')}
                  >
                    {copied === 'redirect-url' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Google Cloud Console Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>2. Google Cloud Console Configuration</CardTitle>
            <CardDescription>
              Go to Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Authorized redirect URIs (add this):</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-muted px-2 py-1 rounded text-sm flex-1">
                  {supabaseOAuthRedirect}
                </code>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(supabaseOAuthRedirect, 'google-redirect')}
                >
                  {copied === 'google-redirect' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This is Supabase's OAuth endpoint, NOT your app's callback URL
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>3. Configuration Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Copy the URLs above using the copy buttons</li>
              <li>
                <strong>Supabase:</strong> Go to{' '}
                <a 
                  href="https://supabase.com/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Supabase Dashboard
                </a>{' '}
                → Authentication → Settings → URL Configuration
              </li>
              <li>
                <strong>Google:</strong> Go to{' '}
                <a 
                  href="https://console.cloud.google.com/apis/credentials" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Google Cloud Console
                </a>{' '}
                → APIs & Services → Credentials
              </li>
              <li>Update both configurations with the URLs above</li>
              <li>Wait a few minutes for changes to propagate</li>
              <li>Test the Google OAuth flow again</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 