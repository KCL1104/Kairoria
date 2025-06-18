import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_OPTIONS, logAuthEvent } from '@/lib/auth-utils';

// Handler for POST requests to the login endpoint
export async function POST(request: NextRequest) {
  try {
    logAuthEvent('login_attempt')
    
    // Create Supabase client at runtime to avoid build-time errors
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      logAuthEvent('login_config_error', { error: 'Database configuration not available' })
      return NextResponse.json(
        { 
          success: false, 
          message: 'Database configuration not available' 
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Set session to persist for 1 month (30 days)
        persistSession: false, // We'll handle persistence ourselves with secure cookies
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      logAuthEvent('login_validation_error', { error: 'Missing credentials' })
      return NextResponse.json(
        { 
          success: false, 
          message: 'Email and password are required' 
        },
        { status: 400 }
      );
    }

    // Attempt to sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase login error:', error);
      logAuthEvent('login_failed', { error: error.message, email })
      return NextResponse.json(
        { 
          success: false, 
          message: error.message || 'Invalid credentials' 
        },
        { status: 401 }
      );
    }

    if (!data.user || !data.session) {
      logAuthEvent('login_failed', { error: 'Authentication failed', email })
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authentication failed' 
        },
        { status: 401 }
      );
    }

    // Fetch user profile from database
    let profile = null;
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      profile = profileData;
    } catch (profileError) {
      console.error('Error fetching profile:', profileError);
      // Continue without profile data - it's not critical for login
      logAuthEvent('profile_fetch_error', { error: String(profileError), userId: data.user.id })
    }

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.full_name || data.user.user_metadata?.full_name || '',
        profile: profile
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in
      }
    });

    // Set session cookies for server-side authentication
    const cookieStore = cookies();
    
    // Set access token cookie (24 hours)
    response.cookies.set('sb-access-token', data.session.access_token, {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 // 24 hours for access token
    });

    // Set refresh token cookie (30 days)
    response.cookies.set('sb-refresh-token', data.session.refresh_token, {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 30 // 30 days for refresh token
    });
    
    // Set user ID cookie for easier access
    response.cookies.set('sb-user-id', data.user.id, {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    logAuthEvent('login_successful', { userId: data.user.id, email })
    return response;

  } catch (error) {
    console.error('Login error:', error);
    logAuthEvent('login_error', { error: String(error) })
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}