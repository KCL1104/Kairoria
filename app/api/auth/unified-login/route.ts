import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_OPTIONS, logAuthEvent } from '@/lib/auth-utils'

/**
 * Unified login API endpoint
 * Handles all login types: password login, OAuth, magic link, etc.
 */
export async function POST(request: NextRequest) {
  try {
    logAuthEvent('unified_login_attempt')
    
    // Create Supabase client
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

    // Create response object for handling cookies
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
                ? 60 * 60 * 24 * 30 // 30 days refresh token
                : 60 * 60           // 1 hour access token
            }
            
            response.cookies.set(name, value, enhancedOptions)
          })
        },
      },
    })

    const body = await request.json()
    const { loginType, ...credentials } = body

    // Validate login type
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

    // Handle different authentication methods based on login type
    switch (loginType) {
      case 'password':
        authResult = await handlePasswordLogin(supabase, credentials)
        loginMethod = 'password'
        break
        
      case 'oauth':
        authResult = await handleOAuthLogin(supabase, credentials, request)
        loginMethod = 'oauth'
        break
        
      default:
        logAuthEvent('unified_login_validation_error', { error: 'Invalid login type', loginType })
        return NextResponse.json(
          { 
            success: false, 
            message: 'Invalid login type' 
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

    // Get user profile data
    const userProfile = await fetchUserProfile(supabase, authResult.data.user.id)

    // Update response content
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
 * Handle password login
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
 * Handle OAuth login
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
 * Get user profile data
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
 * GET method for retrieving supported login types
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    supportedLoginTypes: [
      {
        type: 'password',
        name: 'Password Login',
        description: 'Login using email and password',
        requiredFields: ['email', 'password']
      },
      {
        type: 'oauth',
        name: 'OAuth Login',
        description: 'Login using third-party services (Google, Facebook, etc.)',
        requiredFields: ['provider'],
        optionalFields: ['redirectTo'],
        supportedProviders: ['google', 'facebook', 'github', 'apple']
      }
    ]
  })
}