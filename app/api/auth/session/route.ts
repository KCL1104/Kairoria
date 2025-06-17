import { NextRequest, NextResponse } from 'next/server'
import { createSecureServerClient, logAuthEvent } from '@/lib/auth-utils'

/**
 * API route to get the current session status
 * Used for client-side authentication checks
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createSecureServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      logAuthEvent('session_fetch_error', { error: error.message })
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to get session',
          authenticated: false
        },
        { status: 401 }
      )
    }
    
    if (!session) {
      return NextResponse.json(
        { 
          success: true, 
          authenticated: false 
        },
        { status: 200 }
      )
    }
    
    // Return minimal user info for security
    return NextResponse.json(
      { 
        success: true, 
        authenticated: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          email_confirmed: !!session.user.email_confirmed_at
        },
        expires_at: session.expires_at
      },
      { status: 200 }
    )
    
  } catch (error) {
    console.error('Session API error:', error)
    logAuthEvent('session_api_error', { error: String(error) })
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        authenticated: false
      },
      { status: 500 }
    )
  }
}

/**
 * API route to refresh the session
 * Used when token is about to expire
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSecureServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      logAuthEvent('session_refresh_error', { error: error?.message || 'No session' })
      return NextResponse.json(
        { 
          success: false, 
          message: 'No valid session to refresh',
          authenticated: false
        },
        { status: 401 }
      )
    }
    
    // Refresh the session
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    
    if (refreshError) {
      logAuthEvent('token_refresh_error', { error: refreshError.message })
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to refresh session',
          authenticated: false
        },
        { status: 401 }
      )
    }
    
    logAuthEvent('token_refreshed', { userId: session.user.id })
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Session refreshed successfully',
        authenticated: true,
        expires_at: refreshData.session?.expires_at
      },
      { status: 200 }
    )
    
  } catch (error) {
    console.error('Session refresh API error:', error)
    logAuthEvent('session_refresh_api_error', { error: String(error) })
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        authenticated: false
      },
      { status: 500 }
    )
  }
}