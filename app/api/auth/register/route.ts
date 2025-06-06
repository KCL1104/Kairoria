import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Handler for POST requests to the registration endpoint
export async function POST(request: NextRequest) {
  try {
    // Create Supabase client at runtime to avoid build-time errors
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Database configuration not available' 
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const body = await request.json();
    const { email, password, fullName } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Email and password are required' 
        },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Password must be at least 6 characters long' 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Please enter a valid email address' 
        },
        { status: 400 }
      );
    }

    // Attempt to sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        },
      },
    });

    if (error) {
      console.error('Supabase registration error:', error);
      
      // Handle specific error cases
      if (error.message.includes('already registered')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'An account with this email already exists' 
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { 
          success: false, 
          message: error.message || 'Registration failed' 
        },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Registration failed - no user created' 
        },
        { status: 500 }
      );
    }

    // Check if email confirmation is required
    const needsEmailConfirmation = !data.session && data.user && !data.user.email_confirmed_at;

    return NextResponse.json({
      success: true,
      message: needsEmailConfirmation 
        ? 'Registration successful! Please check your email for a verification link before logging in.'
        : 'Registration successful! You can now log in.',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: fullName || '',
        email_confirmed: !!data.user.email_confirmed_at
      },
      needsEmailConfirmation
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}