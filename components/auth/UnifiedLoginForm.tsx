'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader } from 'lucide-react'
import useUnifiedAuth, { LoginCredentials, SupportedLoginType } from '@/hooks/use-unified-auth'

interface UnifiedLoginFormProps {
  onSuccess?: (user: any) => void
  onError?: (error: string) => void
  redirectTo?: string
  className?: string
  mode?: 'login' | 'register'
  showRegisterLink?: boolean
  showLoginLink?: boolean
}

/**
 * 統一登入表單組件
 * 支援多種登入方式的統一介面
 */
export function UnifiedLoginForm({ 
  onSuccess, 
  onError, 
  redirectTo = '/',
  className = '',
  mode = 'login',
  showRegisterLink = false,
  showLoginLink = false
}: UnifiedLoginFormProps) {
  const {
    isLoading,
    error,
    supportedTypes,
    login,
    loginWithPassword,
    loginWithGoogle,
    loginWithMagicLink,
    getSupportedLoginTypes,
    validateCredentials,
    clearError
  } = useUnifiedAuth()

  // 表單狀態
  const [activeTab, setActiveTab] = useState('password')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    token: ''
  })

  // 載入支援的登入類型
  useEffect(() => {
    getSupportedLoginTypes()
  }, [])

  // 處理表單輸入
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) clearError()
  }

  // 密碼登入處理
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const credentials: LoginCredentials = {
      loginType: 'password',
      email: formData.email,
      password: formData.password
    }

    const validationErrors = validateCredentials(credentials)
    if (validationErrors.length > 0) {
      onError?.(validationErrors.join(', '))
      return
    }

    const result = await loginWithPassword(formData.email, formData.password)
    
    if (result.success && result.user) {
      onSuccess?.(result.user)
    } else {
      onError?.(result.message)
    }
  }

  // Google OAuth 登入處理
  const handleGoogleLogin = async () => {
    const result = await loginWithGoogle(redirectTo)
    
    if (result.success && result.user) {
      onSuccess?.(result.user)
    } else if (!result.success) {
      onError?.(result.message)
    }
    // OAuth 可能會重定向，所以不一定會立即返回結果
  }

  // 魔法連結登入處理
  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email) {
      onError?.('請輸入電子郵件地址')
      return
    }

    const result = await loginWithMagicLink(formData.email, redirectTo)
    
    if (result.success) {
      onSuccess?.({ message: '魔法連結已發送到您的電子郵件' })
    } else {
      onError?.(result.message)
    }
  }

  // 手機驗證登入處理
  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const credentials: LoginCredentials = {
      loginType: 'phone',
      phone: formData.phone,
      token: formData.token
    }

    const validationErrors = validateCredentials(credentials)
    if (validationErrors.length > 0) {
      onError?.(validationErrors.join(', '))
      return
    }

    const result = await login(credentials)
    
    if (result.success && result.user) {
      onSuccess?.(result.user)
    } else {
      onError?.(result.message)
    }
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader>
        <CardTitle>登入</CardTitle>
        <CardDescription>
          選擇您偏好的登入方式
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="password">密碼</TabsTrigger>
            <TabsTrigger value="oauth">OAuth</TabsTrigger>
            <TabsTrigger value="magic">魔法連結</TabsTrigger>
            <TabsTrigger value="phone">手機</TabsTrigger>
          </TabsList>

          {/* 密碼登入 */}
          <TabsContent value="password">
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">電子郵件</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="請輸入您的電子郵件"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密碼</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="請輸入您的密碼"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    登入中...
                  </>
                ) : (
                  '登入'
                )}
              </Button>
            </form>
          </TabsContent>

          {/* OAuth 登入 */}
          <TabsContent value="oauth">
            <div className="space-y-4">
              <Button 
                onClick={handleGoogleLogin} 
                className="w-full" 
                variant="outline"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    連接中...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    使用 Google 登入
                  </>
                )}
              </Button>
              
              <div className="text-sm text-gray-500 text-center">
                更多 OAuth 提供商即將推出
              </div>
            </div>
          </TabsContent>

          {/* 魔法連結登入 */}
          <TabsContent value="magic">
            <form onSubmit={handleMagicLinkLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="magic-email">電子郵件</Label>
                <Input
                  id="magic-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="請輸入您的電子郵件"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    發送中...
                  </>
                ) : (
                  '發送魔法連結'
                )}
              </Button>
              <div className="text-sm text-gray-500 text-center">
                我們將發送一個登入連結到您的電子郵件
              </div>
            </form>
          </TabsContent>

          {/* 手機驗證登入 */}
          <TabsContent value="phone">
            <form onSubmit={handlePhoneLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">手機號碼</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="請輸入您的手機號碼"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="token">驗證碼</Label>
                <Input
                  id="token"
                  type="text"
                  value={formData.token}
                  onChange={(e) => handleInputChange('token', e.target.value)}
                  placeholder="請輸入驗證碼"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    驗證中...
                  </>
                ) : (
                  '驗證並登入'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* 支援的登入類型資訊 */}
        {supportedTypes.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="text-sm text-gray-500">
              <strong>支援的登入方式：</strong>
              <ul className="mt-2 space-y-1">
                {supportedTypes.map((type) => (
                  <li key={type.type} className="flex items-center justify-between">
                    <span>{type.name}</span>
                    <span className="text-xs text-gray-400">{type.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default UnifiedLoginForm