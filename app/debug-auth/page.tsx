"use client"

import { useEffect, useState } from 'react'
import { AuthDebugger } from '@/lib/auth-debug'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AuthState {
  hasSupabaseClient: boolean
  hasSession: boolean
  hasUser: boolean
  userId?: string
  email?: string
  localStorageKeys: string[]
  cookies: string[]
  sessionData?: any
}

export default function DebugAuthPage() {
  const [authState, setAuthState] = useState<AuthState | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuthState = async () => {
    setIsLoading(true)
    
    try {
      // Check Supabase client
      const hasSupabaseClient = !!supabase
      
      // Check session
      let hasSession = false
      let hasUser = false
      let userId = undefined
      let email = undefined
      let sessionData = undefined
      
      if (supabase) {
        const { data: { session }, error } = await supabase.auth.getSession()
        hasSession = !!session
        hasUser = !!session?.user
        userId = session?.user?.id
        email = session?.user?.email
        sessionData = session
        
        console.log('Debug - Session check:', { hasSession, hasUser, userId, error })
      }
      
      // Check localStorage
      const localStorageKeys = []
      if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes('supabase') || key.includes('auth') || key.includes('token'))) {
            localStorageKeys.push(key)
          }
        }
      }
      
      // Check cookies
      const cookies = []
      if (typeof window !== 'undefined') {
        const cookieString = document.cookie
        const cookieArray = cookieString.split(';')
        for (const cookie of cookieArray) {
          const [name] = cookie.trim().split('=')
          if (name && (name.includes('supabase') || name.includes('auth') || name.includes('token') || name.includes('sb-'))) {
            cookies.push(name)
          }
        }
      }
      
      setAuthState({
        hasSupabaseClient,
        hasSession,
        hasUser,
        userId,
        email,
        localStorageKeys,
        cookies,
        sessionData
      })
      
    } catch (error) {
      console.error('Error checking auth state:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearAllAuthData = () => {
    if (typeof window !== 'undefined') {
      // Clear localStorage
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('supabase') || key.includes('auth') || key.includes('token'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Clear cookies
      const cookiesToClear = [
        'sb-access-token',
        'sb-refresh-token',
        'supabase-auth-token',
        '__supabase_session',
        '__supabase_auth'
      ]
      
      cookiesToClear.forEach(name => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
      })
      
      // Refresh the page
      window.location.reload()
    }
  }

  const testGoogleAuth = async () => {
    if (!supabase) {
      alert('Supabase client not available')
      return
    }

    console.log('🔄 Testing Google OAuth...')
    AuthDebugger.logAuthState('Before Google OAuth Test')
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      console.log('Google OAuth result:', { data, error })
    } catch (error) {
      console.error('Google OAuth error:', error)
    }
  }

  useEffect(() => {
    checkAuthState()
    
    // Set up auth state listener
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state change in debug page:', event, session?.user?.id)
        checkAuthState()
      })
      
      return () => subscription.unsubscribe()
    }
  }, [])

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-10">
        <div className="text-center">Loading auth debug info...</div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="grid gap-6">
        {/* Auth State Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication State</CardTitle>
            <CardDescription>Current authentication status and session information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Supabase Client:</strong> {authState?.hasSupabaseClient ? '✅ Available' : '❌ Not Available'}
              </div>
              <div>
                <strong>Has Session:</strong> {authState?.hasSession ? '✅ Yes' : '❌ No'}
              </div>
              <div>
                <strong>Has User:</strong> {authState?.hasUser ? '✅ Yes' : '❌ No'}
              </div>
              <div>
                <strong>User ID:</strong> {authState?.userId || 'None'}
              </div>
              <div className="col-span-2">
                <strong>Email:</strong> {authState?.email || 'None'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Information */}
        <Card>
          <CardHeader>
            <CardTitle>Storage Information</CardTitle>
            <CardDescription>Authentication tokens and data in browser storage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <strong>LocalStorage Keys:</strong>
                <div className="mt-2 p-2 bg-muted rounded">
                  {authState?.localStorageKeys.length ? (
                    <ul className="list-disc list-inside">
                      {authState.localStorageKeys.map(key => (
                        <li key={key} className="text-sm font-mono">{key}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted-foreground">No auth-related localStorage keys found</span>
                  )}
                </div>
              </div>
              
              <div>
                <strong>Cookies:</strong>
                <div className="mt-2 p-2 bg-muted rounded">
                  {authState?.cookies.length ? (
                    <ul className="list-disc list-inside">
                      {authState.cookies.map(cookie => (
                        <li key={cookie} className="text-sm font-mono">{cookie}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted-foreground">No auth-related cookies found</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Data */}
        {authState?.sessionData && (
          <Card>
            <CardHeader>
              <CardTitle>Session Data</CardTitle>
              <CardDescription>Raw session information from Supabase</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                {JSON.stringify(authState.sessionData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Actions</CardTitle>
            <CardDescription>Tools to test and debug authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={checkAuthState}>
                Refresh Auth State
              </Button>
              <Button onClick={testGoogleAuth} variant="outline">
                Test Google OAuth
              </Button>
              <Button onClick={clearAllAuthData} variant="destructive">
                Clear All Auth Data
              </Button>
              <Button 
                onClick={() => AuthDebugger.logAuthState('Manual Check')} 
                variant="outline"
              >
                Log to Console
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>1. Open browser developer tools (F12) and go to the Console tab</p>
              <p>2. Try logging in with Google OAuth and watch the console logs</p>
              <p>3. Check the Application/Storage tab to see cookies and localStorage</p>
              <p>4. Use the "Log to Console" button to see detailed auth state</p>
              <p>5. If tokens are missing, check the Network tab during OAuth flow</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}