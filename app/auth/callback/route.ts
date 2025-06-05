import { createClient } from '@supabase/supabase-js'
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

      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=exchange_failed`)
      }

      // Check if there's a redirect URL in the query params or cookies
      const redirectTo = requestUrl.searchParams.get('redirect_to') || '/'
      return NextResponse.redirect(`${requestUrl.origin}${redirectTo}`)
      
    } catch (error) {
      console.error('Callback error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=callback_error`)
    }
  }

  // No code parameter, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/auth/login`)
} 