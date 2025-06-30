import { createServerClient } from '@supabase/ssr'
import { Provider, SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_OPTIONS, logAuthEvent } from '../../../../lib/auth-utils'
import { createSecureServerClient } from '../../../../lib/auth-server'

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
    
    // Use the unified secure server client to ensure consistent cookie handling
    const supabase = await createSecureServerClient(response)
    
    // Validate Supabase client initialization
    if (!supabase || !supabase.auth) {
      logAuthEvent('unified_login_client_error', { error: 'Supabase client initialization failed' })
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication service unavailable' 
        },
        { status: 500 }
      )
    }

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

    let authResult: any
    let loginMethod = ''

    // Handle different authentication methods based on login type
    switch (loginType) {
      case 'password':
        authResult = await handlePasswordLogin(supabase, credentials)
        loginMethod = 'password'
        break
        
      case 'oauth':
        // OAuth requires special handling since it redirects
        const oauthResult = await handleOAuthLogin(supabase, credentials, request)
        if ('data' in oauthResult && oauthResult.data?.url) {
          // Return redirect URL for OAuth
          return NextResponse.json({
            success: true,
            message: 'OAuth redirect initiated',
            redirectUrl: oauthResult.data.url,
          })
        } else {
          authResult = oauthResult
          loginMethod = 'oauth'
        }
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
        loginMethod
      })
      return NextResponse.json(
        { 
          success: false, 
          message: authResult.error.message || 'Authentication failed' 
        },
        { status: 401 }
      )
    }

    if (!authResult.data || !authResult.data.user || !authResult.data.session) {
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
      message: 'Authentication successful',
      loginMethod,
      user: {
        id: authResult.data.user.id,
        email: authResult.data.user.email,
        name: userProfile?.full_name || authResult.data.user.user_metadata?.full_name || '',
        profile: userProfile
      }
    })

    logAuthEvent('unified_login_successful', {
      userId: authResult.data.user.id,
      loginMethod
    })
    
    return response

  } catch (error) {
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
async function handlePasswordLogin(supabase: SupabaseClient, credentials: { email?: string; password?: string }) {
  const { email, password } = credentials

  if (!email || !password) {
    return {
      error: { message: 'Email and password are required' }
    }
  }

  // Additional safety check
  if (!supabase || !supabase.auth || typeof supabase.auth.signInWithPassword !== 'function') {
    return {
      error: { message: 'Authentication service is not properly configured' }
    }
  }

  try {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    })
  } catch (error) {
    return {
      error: { message: error instanceof Error ? error.message : 'Authentication failed' }
    }
  }
}

/**
 * Handle OAuth login
 */
async function handleOAuthLogin(supabase: SupabaseClient, credentials: { provider?: string; redirectTo?: string }, request: NextRequest) {
  const { provider, redirectTo } = credentials

  if (!provider) {
    return {
      error: { message: 'OAuth provider is required' }
    }
  }

  // Additional safety check
  if (!supabase || !supabase.auth || typeof supabase.auth.signInWithOAuth !== 'function') {
    return {
      error: { message: 'OAuth service is not properly configured' }
    }
  }

  try {
    const origin = new URL(request.url).origin
    const defaultRedirectTo = `${origin}/auth/callback`

    // Whitelist validation for redirectTo
    const allowedDomains = [new URL(origin).hostname, 'kairoria.com']; // Add your production domain here
    let finalRedirectTo = defaultRedirectTo;
    if (redirectTo) {
      try {
        const redirectUrl = new URL(redirectTo);
        if (allowedDomains.includes(redirectUrl.hostname)) {
          finalRedirectTo = redirectTo;
        } else {
          logAuthEvent('oauth_redirect_blocked', { providedRedirectTo: redirectTo });
        }
      } catch (e) {
        logAuthEvent('oauth_redirect_invalid', { providedRedirectTo: redirectTo });
      }
    }

    return await supabase.auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo: finalRedirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      },
    })
  } catch (error) {
    return {
      error: { message: error instanceof Error ? error.message : 'OAuth authentication failed' }
    }
  }
}

/**
 * Get user profile data
 */
async function fetchUserProfile(supabase: SupabaseClient, userId: string) {
  if (!supabase || !supabase.from) {
    return null
  }

  try {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      logAuthEvent('profile_fetch_error', { error: error.message, userId })
      return null
    }
    
    return profileData
  } catch (profileError) {
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