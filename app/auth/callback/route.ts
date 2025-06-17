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
        console.error('Missing Supabase environment variables')
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=config_error`)
      }

      const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
              const cookieStore = cookies()
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              const cookieStore = cookies()
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            },
          },
          auth: {
            // Set session to persist for 1 month (30 days)
            persistSession: true, // This will be handled by the cookie store in ssr client
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      )
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=exchange_failed`)
      }

      // After successful exchange, the session should be in the cookies.
      // The middleware will pick it up on the next request.

      // Always redirect to home page after successful authentication
      return NextResponse.redirect(`${requestUrl.origin}/`)
      
    } catch (error) {
      console.error('Callback error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=callback_error`)
    }
  }

  // No code parameter, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/auth/login`)
}