'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UnifiedLoginForm } from '@/components/auth/UnifiedLoginForm'
import { CheckCircle, XCircle, Info } from 'lucide-react'

/**
 * 統一認證系統測試頁面
 * 展示如何使用統一登入 API 和組件
 */
export default function TestUnifiedAuthPage() {
  const [loginResult, setLoginResult] = useState<any>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [showDemo, setShowDemo] = useState(true)

  const handleLoginSuccess = (user: any) => {
    setLoginResult(user)
    setLoginError(null)
    console.log('登入成功:', user)
  }

  const handleLoginError = (error: string) => {
    setLoginError(error)
    setLoginResult(null)
    console.error('登入失敗:', error)
  }

  const resetDemo = () => {
    setLoginResult(null)
    setLoginError(null)
    setShowDemo(true)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">統一認證系統測試</h1>
        <p className="text-gray-600 mb-6">
          這個頁面展示了統一登入 API 的功能，支援多種認證方式的統一介面。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左側：功能說明 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                統一登入 API 功能
              </CardTitle>
              <CardDescription>
                一個 API 端點處理所有登入類型
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">支援的登入方式：</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">密碼登入</Badge>
                  <Badge variant="secondary">Google OAuth</Badge>
                  <Badge variant="secondary">魔法連結</Badge>
                  <Badge variant="secondary">手機驗證</Badge>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">API 端點：</h4>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  POST /api/auth/unified-login
                </code>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">請求格式：</h4>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "loginType": "password",
  "email": "user@example.com",
  "password": "password123"
}`}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">OAuth 請求格式：</h4>
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
              <CardTitle>測試帳號</CardTitle>
              <CardDescription>
                使用以下測試帳號進行登入測試
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <strong>電子郵件：</strong> 
                  <code className="bg-gray-100 px-2 py-1 rounded ml-2">testuser@example.com</code>
                </div>
                <div>
                  <strong>密碼：</strong> 
                  <code className="bg-gray-100 px-2 py-1 rounded ml-2">Abcd_123</code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 登入結果顯示 */}
          {loginResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  登入成功
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-green-50 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(loginResult, null, 2)}
                </pre>
                <Button onClick={resetDemo} className="mt-4" variant="outline">
                  重新測試
                </Button>
              </CardContent>
            </Card>
          )}

          {loginError && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  登入失敗
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
                <Button onClick={resetDemo} className="mt-4" variant="outline">
                  重新測試
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右側：登入表單 */}
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

      {/* 底部：使用說明 */}
      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>使用說明</CardTitle>
            <CardDescription>
              如何在您的應用中使用統一認證系統
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. 使用 Hook：</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import useUnifiedAuth from '@/hooks/use-unified-auth'

const { loginWithPassword, loginWithGoogle } = useUnifiedAuth()

// 密碼登入
const result = await loginWithPassword('user@example.com', 'password')

// Google OAuth 登入
const result = await loginWithGoogle('/dashboard')`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">2. 使用組件：</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { UnifiedLoginForm } from '@/components/auth/UnifiedLoginForm'

<UnifiedLoginForm
  onSuccess={(user) => console.log('登入成功', user)}
  onError={(error) => console.error('登入失敗', error)}
  redirectTo="/dashboard"
/>`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">3. 直接調用 API：</h4>
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