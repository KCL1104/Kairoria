'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/SupabaseAuthContext'

export default function TestWorkflowPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [testResults, setTestResults] = useState<string[]>([])

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        addTestResult(`User is authenticated: ${user.email}`)
      } else {
        addTestResult('User is not authenticated')
      }
    }
  }, [user, isLoading])

  const testRoutes = [
    { name: 'Profile Page', path: '/profile' },
    { name: 'Create Listing', path: '/profile/listings/new' },
    { name: 'Messages', path: '/messages' },
    { name: 'Marketplace Product', path: '/marketplace/1' },
    { name: 'Regular Marketplace', path: '/marketplace' },
  ]

  const handleTestRoute = (path: string, name: string) => {
    addTestResult(`Testing route: ${name} (${path})`)
    router.push(path)
  }

  const handleLogin = () => {
    router.push('/auth/login')
  }

  const handleRegister = () => {
    router.push('/auth/register')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Auth Workflow Test Page</CardTitle>
            <CardDescription>
              Test the new incomplete signup redirect workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Current Status:</h3>
                <p className="text-blue-800">
                  {user ? `Logged in as: ${user.email}` : 'Not logged in'}
                </p>
              </div>
              
              {!user && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Authentication:</h3>
                  <div className="flex gap-2">
                    <Button onClick={handleLogin} variant="outline">
                      Go to Login
                    </Button>
                    <Button onClick={handleRegister} variant="outline">
                      Go to Register
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <h3 className="font-semibold">Test Protected Routes:</h3>
                <p className="text-sm text-gray-600 mb-3">
                  These routes should redirect to incomplete-signup page if user hasn't completed profile:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {testRoutes.map((route) => (
                    <Button
                      key={route.path}
                      onClick={() => handleTestRoute(route.path, route.name)}
                      variant="outline"
                      className="justify-start"
                    >
                      {route.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Results Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500 italic">No test results yet...</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono bg-gray-100 p-2 rounded">
                    {result}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}