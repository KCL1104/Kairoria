import { NextRequest, NextResponse } from 'next/server'
import { logAuthEvent } from '@/lib/auth-utils'
import { createSecureServerClient } from '@/lib/auth-server'

/**
 * Profile initialization API endpoint
 * Creates a basic profile for authenticated users who don't have one
 * Should be called when middleware detects missing profile
 */
export async function POST(request: NextRequest) {
  try {
    logAuthEvent('profile_initialization_attempt')
    
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      logAuthEvent('profile_initialization_config_error', { error: 'Database configuration not available' })
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
    const supabase = createSecureServerClient(response)

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      logAuthEvent('profile_initialization_auth_error', { error: authError?.message || 'No user found' })
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication required' 
        },
        { status: 401 }
      )
    }

    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // Error other than "not found"
      console.error('Profile check error:', checkError)
      logAuthEvent('profile_initialization_check_error', { 
        error: checkError.message, 
        userId: user.id 
      })
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to check existing profile' 
        },
        { status: 500 }
      )
    }

    if (existingProfile) {
      // Profile already exists
      logAuthEvent('profile_initialization_already_exists', { userId: user.id })
      return NextResponse.json({
        success: true,
        message: 'Profile already exists',
        profile: existingProfile,
        created: false
      })
    }

    // Create initial profile entry
    const profileData = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      is_email_verified: !!user.email_confirmed_at,
      is_phone_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (createError) {
      console.error('Profile creation error:', createError)
      logAuthEvent('profile_initialization_create_error', { 
        error: createError.message, 
        userId: user.id 
      })
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to create profile' 
        },
        { status: 500 }
      )
    }

    // Update response content
    response = NextResponse.json({
      success: true,
      message: 'Profile initialized successfully',
      profile: newProfile,
      created: true
    })

    logAuthEvent('profile_initialization_successful', { 
      userId: user.id, 
      email: user.email
    })
    
    return response

  } catch (error) {
    console.error('Profile initialization error:', error)
    logAuthEvent('profile_initialization_error', { error: String(error) })
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
 * GET method for checking profile initialization status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createSecureServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication required' 
        },
        { status: 401 }
      )
    }

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const hasProfile = !profileError && !!profile

    return NextResponse.json({
      success: true,
      hasProfile,
      profile: hasProfile ? profile : null,
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      }
    })

  } catch (error) {
    console.error('Profile check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}