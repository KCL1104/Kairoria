import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_OPTIONS, logAuthEvent } from '@/lib/auth-utils'
import { createSecureServerClient } from '@/lib/auth-server'

/**
 * Unified registration API endpoint
 * Handles user registration with email/password and automatic profile creation
 */
export async function POST(request: NextRequest) {
  try {
    logAuthEvent('unified_register_attempt')
    
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      logAuthEvent('unified_register_config_error', { error: 'Database configuration not available' })
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

    const body = await request.json()
    const { email, password, fullName } = body

    // Validate required fields
    if (!email || !password) {
      logAuthEvent('unified_register_validation_error', { error: 'Missing email or password' })
      return NextResponse.json(
        { 
          success: false, 
          message: 'Email and password are required' 
        },
        { status: 400 }
      )
    }

    if (!fullName) {
      logAuthEvent('unified_register_validation_error', { error: 'Missing full name' })
      return NextResponse.json(
        { 
          success: false, 
          message: 'Full name is required' 
        },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      logAuthEvent('unified_register_validation_error', { error: 'Password too short' })
      return NextResponse.json(
        { 
          success: false, 
          message: 'Password must be at least 6 characters long' 
        },
        { status: 400 }
      )
    }

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })

    if (authError) {
      logAuthEvent('unified_register_failed', { 
        error: authError.message, 
        email 
      })
      return NextResponse.json(
        { 
          success: false, 
          message: authError.message || 'Registration failed' 
        },
        { status: 400 }
      )
    }

    if (!authData?.user) {
      logAuthEvent('unified_register_failed', { 
        error: 'No user returned', 
        email 
      })
      return NextResponse.json(
        { 
          success: false, 
          message: 'Registration failed' 
        },
        { status: 400 }
      )
    }

    // Create initial profile entry
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
        avatar_url: authData.user.user_metadata?.avatar_url || null,
        is_email_verified: !!authData.user.email_confirmed_at,
        is_phone_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      logAuthEvent('profile_creation_error', { 
        error: profileError.message, 
        userId: authData.user.id 
      })
      // Don't fail registration if profile creation fails - it can be retried later
    }

    // Update response content
    response = NextResponse.json({
      success: true,
      message: 'Registration successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: fullName,
        needsEmailVerification: !authData.user.email_confirmed_at
      },
      session: authData.session ? {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at
      } : null
    })

    logAuthEvent('unified_register_successful', { 
      userId: authData.user.id, 
      email: authData.user.email,
      needsEmailVerification: !authData.user.email_confirmed_at
    })
    
    return response

  } catch (error) {
    console.error('Unified registration error:', error)
    logAuthEvent('unified_register_error', { error: String(error) })
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
 * GET method for retrieving registration requirements
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    requirements: {
      fields: [
        {
          name: 'email',
          type: 'email',
          required: true,
          description: 'Valid email address'
        },
        {
          name: 'password',
          type: 'password',
          required: true,
          minLength: 6,
          description: 'Password must be at least 6 characters long'
        },
        {
          name: 'fullName',
          type: 'text',
          required: true,
          description: 'Full name for profile'
        }
      ],
      emailVerification: true,
      profileCreation: true
    }
  })
}