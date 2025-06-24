import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logAuthEvent } from '@/lib/auth-utils'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  logAuthEvent('oauth_callback_received', {
    code: code ? 'present' : 'missing',
    error,
    errorDescription,
    url: requestUrl.toString()
  })

  // Handle OAuth errors
  if (error) {
    logAuthEvent('oauth_error', { error, errorDescription })
    
    // Handle specific error types
    if (error === 'access_denied') {
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=User denied access`)
    } else if (error === 'redirect_uri_mismatch') {
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=OAuth configuration error. Please contact support.`)
    }
    
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=${errorDescription || error}`)
  }

  if (code) {
    try {
      // Get Supabase URL and key with flexible naming
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseAnonKey) {
        logAuthEvent('oauth_config_error', {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey
        })
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=config_error`)
      }

      const cookieStore = await cookies()

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
                  // Set cookies with enhanced options for 1-hour session
                  const enhancedOptions = {
                    path: '/',
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax' as const,
                    maxAge: name.includes('refresh') ? 30 * 24 * 60 * 60 : 60 * 60 // 30 days for refresh, 1 hour for access
                  }
                  
                  logAuthEvent('setting_cookie', { name })
                  cookieStore.set(name, value, enhancedOptions)
                })
              } catch (error) {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
                console.warn('Could not set cookies in callback:', error)
              }
            },
          },
          auth: {
            detectSessionInUrl: true
          }
        }
      )

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        logAuthEvent('code_exchange_error', {
          message: exchangeError.message,
          status: exchangeError.status || 'unknown',
          code: exchangeError.code || 'unknown'
        })
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=exchange_failed`)
      } else {
        logAuthEvent('code_exchange_success')
        
        // Verify session was created
        const { data: { session } } = await supabase.auth.getSession()
        logAuthEvent('session_after_exchange', {
          hasSession: !!session,
          hasUser: !!session?.user
        })
        
        // Verify cookies were set
        const allCookies = cookieStore.getAll()
        logAuthEvent('cookies_after_exchange', {
          cookieCount: allCookies.length,
          hasAccessToken: allCookies.some(c => c.name === 'sb-access-token'),
          hasRefreshToken: allCookies.some(c => c.name === 'sb-refresh-token')
        })
      }

      // After successful exchange, the session should be in the cookies.
      // The middleware will pick it up on the next request.

      // Always redirect to home page after successful authentication with a refresh parameter
      return NextResponse.redirect(`${requestUrl.origin}/?auth=success&t=${Date.now()}`)
      
    } catch (error) {
      logAuthEvent('callback_error', { error: String(error) })
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=callback_error`)
    }
  }

  // No code parameter, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/auth/login`)
}