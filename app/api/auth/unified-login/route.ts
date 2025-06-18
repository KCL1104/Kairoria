import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_OPTIONS, logAuthEvent } from '@/lib/auth-utils'

/**
 * 統一登入 API 端點
 * 處理所有登入類型：密碼登入、OAuth、魔法連結等
 */
export async function POST(request: NextRequest) {
  try {
    logAuthEvent('unified_login_attempt')
    
    // 創建 Supabase 客戶端
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      logAuthEvent('unified_login_config_error', { error: 'Database configuration not available' })
      return NextResponse.json(
        { 
          success: false, 
          message: 'Database configuration not available' 
        },
        { status: 500 }
      )
    }

    // 創建響應對象用於處理 cookies
    let response = NextResponse.json({ success: false })
    
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const enhancedOptions = {
              ...options,
              ...AUTH_COOKIE_OPTIONS,
              domain: undefined,
              maxAge: name.includes('refresh') 
                ? 60 * 60 * 24 * 30 // 30 天 refresh token
                : 60 * 60           // 1 小時 access token
            }
            
            response.cookies.set(name, value, enhancedOptions)
          })
        },
      },
    })

    const body = await request.json()
    const { loginType, ...credentials } = body

    // 驗證登入類型
    if (!loginType) {
      logAuthEvent('unified_login_validation_error', { error: 'Missing login type' })
      return NextResponse.json(
        { 
          success: false, 
          message: 'Login type is required' 
        },
        { status: 400 }
      )
    }

    let authResult
    let loginMethod = ''

    // 根據登入類型處理不同的認證方式
    switch (loginType) {
      case 'password':
        authResult = await handlePasswordLogin(supabase, credentials)
        loginMethod = 'password'
        break
        
      case 'oauth':
        authResult = await handleOAuthLogin(supabase, credentials, request)
        loginMethod = `oauth_${credentials.provider || 'unknown'}`
        break
        
      case 'magic_link':
        authResult = await handleMagicLinkLogin(supabase, credentials)
        loginMethod = 'magic_link'
        break
        
      case 'phone':
        authResult = await handlePhoneLogin(supabase, credentials)
        loginMethod = 'phone'
        break
        
      default:
        logAuthEvent('unified_login_unsupported_type', { loginType })
        return NextResponse.json(
          { 
            success: false, 
            message: `Unsupported login type: ${loginType}` 
          },
          { status: 400 }
        )
    }

    if (authResult.error) {
      logAuthEvent('unified_login_failed', { 
        error: authResult.error.message, 
        loginMethod,
        email: credentials.email 
      })
      return NextResponse.json(
        { 
          success: false, 
          message: authResult.error.message || 'Authentication failed' 
        },
        { status: 401 }
      )
    }

    if (!authResult.data?.user || !authResult.data?.session) {
      logAuthEvent('unified_login_failed', { 
        error: 'No user or session returned', 
        loginMethod 
      })
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication failed' 
        },
        { status: 401 }
      )
    }

    // 獲取用戶資料
    const userProfile = await fetchUserProfile(supabase, authResult.data.user.id)

    // 更新響應內容
    response = NextResponse.json({
      success: true,
      message: 'Login successful',
      loginMethod,
      user: {
        id: authResult.data.user.id,
        email: authResult.data.user.email,
        name: userProfile?.full_name || authResult.data.user.user_metadata?.full_name || '',
        profile: userProfile
      },
      session: {
        access_token: authResult.data.session.access_token,
        refresh_token: authResult.data.session.refresh_token,
        expires_at: authResult.data.session.expires_at
      }
    })

    logAuthEvent('unified_login_successful', { 
      userId: authResult.data.user.id, 
      email: authResult.data.user.email,
      loginMethod 
    })
    
    return response

  } catch (error) {
    console.error('Unified login error:', error)
    logAuthEvent('unified_login_error', { error: String(error) })
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

/**
 * 處理密碼登入
 */
async function handlePasswordLogin(supabase: any, credentials: any) {
  const { email, password } = credentials

  if (!email || !password) {
    return {
      error: { message: 'Email and password are required' }
    }
  }

  return await supabase.auth.signInWithPassword({
    email,
    password,
  })
}

/**
 * 處理 OAuth 登入
 */
async function handleOAuthLogin(supabase: any, credentials: any, request: NextRequest) {
  const { provider, redirectTo } = credentials

  if (!provider) {
    return {
      error: { message: 'OAuth provider is required' }
    }
  }

  const origin = new URL(request.url).origin
  const defaultRedirectTo = `${origin}/auth/callback`

  return await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectTo || defaultRedirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    },
  })
}

/**
 * 處理魔法連結登入
 */
async function handleMagicLinkLogin(supabase: any, credentials: any) {
  const { email, redirectTo } = credentials

  if (!email) {
    return {
      error: { message: 'Email is required for magic link login' }
    }
  }

  return await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo
    }
  })
}

/**
 * 處理手機號碼登入
 */
async function handlePhoneLogin(supabase: any, credentials: any) {
  const { phone, token } = credentials

  if (!phone || !token) {
    return {
      error: { message: 'Phone number and verification token are required' }
    }
  }

  return await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms'
  })
}

/**
 * 獲取用戶資料
 */
async function fetchUserProfile(supabase: any, userId: string) {
  try {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    return profileData
  } catch (profileError) {
    console.error('Error fetching profile:', profileError)
    logAuthEvent('profile_fetch_error', { error: String(profileError), userId })
    return null
  }
}

/**
 * GET 方法用於獲取支援的登入類型
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    supportedLoginTypes: [
      {
        type: 'password',
        name: '密碼登入',
        description: '使用電子郵件和密碼登入',
        requiredFields: ['email', 'password']
      },
      {
        type: 'oauth',
        name: 'OAuth 登入',
        description: '使用第三方服務登入（Google、Facebook 等）',
        requiredFields: ['provider'],
        optionalFields: ['redirectTo'],
        supportedProviders: ['google', 'facebook', 'github', 'apple']
      },
      {
        type: 'magic_link',
        name: '魔法連結',
        description: '透過電子郵件發送登入連結',
        requiredFields: ['email'],
        optionalFields: ['redirectTo']
      },
      {
        type: 'phone',
        name: '手機驗證',
        description: '使用手機號碼和驗證碼登入',
        requiredFields: ['phone', 'token']
      }
    ]
  })
}