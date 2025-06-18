'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UnifiedLoginForm } from '@/components/auth/UnifiedLoginForm'
import { CheckCircle, XCircle, Info } from 'lucide-react'

/**
 * Unified authentication system test page
 * Demonstrates how to use unified login API and components
 */
export default function TestUnifiedAuthPage() {
  const [loginResult, setLoginResult] = useState<any>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [showDemo, setShowDemo] = useState(true)

  const handleLoginSuccess = (user: any) => {
    setLoginResult(user)
    setLoginError(null)
    console.log('Login successful:', user)
  }

  const handleLoginError = (error: string) => {
    setLoginError(error)
    setLoginResult(null)
    console.error('Login failed:', error)
  }

  const resetTest = () => {
    setLoginResult(null)
    setLoginError(null)
  }

  const resetDemo = resetTest

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Unified Authentication System Test</h1>
            <p className="text-gray-600">
              This page demonstrates the unified login API functionality with a unified interface supporting multiple authentication methods.
            </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left side: Feature description */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Unified Login API Features
              </CardTitle>
              <CardDescription>
                One API endpoint handles all login types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Supported login methods:</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Password Login</Badge>
                  <Badge variant="secondary">Google OAuth</Badge>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">API Endpoint:</h4>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  POST /api/auth/unified-login
                </code>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Request format:</h4>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "loginType": "password",
  "email": "user@example.com",
  "password": "password123"
}`}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">OAuth request format:</h4>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "loginType": "oauth",
  "provider": "google",
  "redirectTo": "/dashboard"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Account</CardTitle>
              <CardDescription>
                Use the following test account for login testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <strong>Email:</strong> 
                  <code className="bg-gray-100 px-2 py-1 rounded ml-2">testuser@example.com</code>
                </div>
                <div>
                  <strong>Password:</strong> 
                  <code className="bg-gray-100 px-2 py-1 rounded ml-2">Abcd_123</code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Login result display */}
          {loginResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Login Successful
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-green-50 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(loginResult, null, 2)}
                </pre>
                <Button onClick={resetDemo} className="mt-4" variant="outline">
                  Test Again
                </Button>
              </CardContent>
            </Card>
          )}

          {loginError && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  Login Failed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
                <Button onClick={resetDemo} className="mt-4" variant="outline">
                  Test Again
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right side: Login form */}
        <div>
          {showDemo && (
            <UnifiedLoginForm
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
              redirectTo="/test-unified-auth"
              className="sticky top-8"
            />
          )}
        </div>
      </div>

      {/* Bottom: Usage instructions */}
      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Usage Instructions</CardTitle>
            <CardDescription>
              How to use the unified authentication system in your application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. Using Hook:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import useUnifiedAuth from '@/hooks/use-unified-auth'

const { loginWithPassword, loginWithGoogle } = useUnifiedAuth()

// Password login
const result = await loginWithPassword('user@example.com', 'password')

// Google OAuth login
const result = await loginWithGoogle('/dashboard')`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">2. Using Component:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { UnifiedLoginForm } from '@/components/auth/UnifiedLoginForm'

<UnifiedLoginForm
  onSuccess={(user) => console.log('Login successful', user)}
  onError={(error) => console.error('Login failed', error)}
  redirectTo="/dashboard"
/>`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">3. Direct API Call:</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`const response = await fetch('/api/auth/unified-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    loginType: 'password',
    email: 'user@example.com',
    password: 'password123'
  })
})

const result = await response.json()`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}