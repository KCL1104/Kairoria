import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  console.log('🔄 OAuth Callback - Request received:', {
    code: code ? 'present' : 'missing',
    error,
    errorDescription,
    url: requestUrl.toString()
  })

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription)
    
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
        console.error('❌ Missing Supabase environment variables:', {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey
        })
        console.error('Missing Supabase environment variables')
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
                  // Set cookies with enhanced options for better cross-tab support
                  const enhancedOptions = {
                    ...options,
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    path: '/',
                    maxAge: name.includes('refresh') ? 30 * 24 * 60 * 60 : 60 * 60
                  }
                  
                  console.log(`🍪 Setting enhanced cookie: ${name}`)
                  cookieStore.set(name, value, enhancedOptions)
                  cookieStore.set(name, value, options)
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
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      )

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('❌ Code exchange error:', {
          message: exchangeError.message,
          status: exchangeError.status,
          code: exchangeError.code
        })
        console.error('Code exchange error:', exchangeError)
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=exchange_failed`)
      } else {
        console.log('✅ Code exchange successful')
        
        // Verify session was created
        const { data: { session } } = await supabase.auth.getSession()
        console.log('🔐 Session after exchange:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id
        })
      }

      // After successful exchange, the session should be in the cookies.
      // The middleware will pick it up on the next request.

      // Always redirect to home page after successful authentication
      return NextResponse.redirect(`${requestUrl.origin}/`)
      
    } catch (error) {
      console.error('❌ Callback processing error:', error)
      console.error('Callback error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=callback_error`)
    }
  }

  // No code parameter, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/auth/login`)
}