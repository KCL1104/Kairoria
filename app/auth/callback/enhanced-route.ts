import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Enhanced OAuth callback handler with improved token persistence
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  console.log('OAuth callback received:', { 
    hasCode: !!code, 
    error, 
    origin: requestUrl.origin 
  })

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    
    const errorMap: Record<string, string> = {
      'access_denied': 'User denied access to the application',
      'redirect_uri_mismatch': 'OAuth configuration error. Please contact support.',
      'invalid_request': 'Invalid OAuth request. Please try again.',
      'unauthorized_client': 'OAuth client not authorized. Please contact support.',
      'unsupported_response_type': 'OAuth configuration error. Please contact support.',
      'invalid_scope': 'Invalid OAuth scope requested.',
      'server_error': 'OAuth provider error. Please try again later.',
      'temporarily_unavailable': 'OAuth service temporarily unavailable. Please try again later.'
    }
    
    const userFriendlyError = errorMap[error] || errorDescription || 'Authentication failed'
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=${encodeURIComponent(userFriendlyError)}`)
  }

  if (!code) {
    console.error('No authorization code received')
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=No authorization code received`)
  }

  try {
    // Get Supabase configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=Server configuration error`)
    }

    const cookieStore = await cookies()

    // Create Supabase client with enhanced cookie handling
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                // Enhanced cookie options for better persistence
                const enhancedOptions = {
                  ...options,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax' as const,
                  httpOnly: name.includes('refresh'), // Only refresh tokens should be httpOnly
                  maxAge: name.includes('refresh') ? 30 * 24 * 60 * 60 : 60 * 60, // 30 days for refresh, 1 hour for access
                }
                
                cookieStore.set(name, value, enhancedOptions)
                console.log(`Set cookie: ${name} with options:`, enhancedOptions)
              })
            } catch (error) {
              console.warn('Could not set cookies in callback:', error)
            }
          },
        },
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce'
        }
      }
    )

    console.log('Exchanging code for session...')
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=Authentication failed. Please try again.`)
    }

    if (!data.session) {
      console.error('No session returned from code exchange')
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=Session creation failed`)
    }

    console.log('✅ OAuth authentication successful for user:', data.session.user.id)

    // Create response with additional security headers
    const response = NextResponse.redirect(`${requestUrl.origin}/`)
    
    // Set additional cookies for client-side access
    response.cookies.set('sb-user-id', data.session.user.id, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    // Set session indicator for immediate client-side detection
    response.cookies.set('sb-authenticated', 'true', {
      path: '/',
      maxAge: 60 * 60, // 1 hour
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    return response
    
  } catch (error) {
    console.error('Callback processing error:', error)
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=Authentication processing failed`)
  }
}