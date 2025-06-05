import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Handler for POST requests to the logout endpoint
export async function POST(request: Request) {
  try {
    // Get Supabase URL and key with flexible naming
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, message: 'Supabase configuration missing' },
        { status: 500 }
      );
    }
    
    // Extract session token from cookie or authorization header
    const cookieStore = cookies();
    const supabaseAuthCookie = cookieStore.get('sb-access-token')?.value;
    const authHeader = request.headers.get('authorization')?.split('Bearer ')[1];
    const sessionToken = supabaseAuthCookie || authHeader;
    
    // Create admin client for server-side operations
    const adminClient = supabaseServiceKey 
      ? createClient(supabaseUrl, supabaseServiceKey, {
          auth: { persistSession: false }
        })
      : null;
      
    // If we have a session token and admin client, invalidate the session
    if (sessionToken && adminClient) {
      try {
        // Attempt to invalidate the specific session
        await adminClient.auth.admin.signOut(sessionToken);
      } catch (error) {
        console.error('Failed to invalidate session:', error);
        // Continue with the response even if session invalidation fails
      }
    }
    
    // Create response with cookie clearing headers
    const response = NextResponse.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
    
    // Clear all potential auth cookies
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      '__supabase_session',
      '__supabase_auth',
      'supabase-user-id',
      'supabase-user-email',
      'sb-user-token',
      'sb-provider-token',
      'sb-auth-token'
    ];
    
    cookiesToClear.forEach(name => {
      // Set each cookie to expire immediately
      // Include various path options to ensure all cookies are cleared
      cookieStore.set(name, '', { 
        expires: new Date(0),
        path: '/',
        maxAge: 0,
        secure: true,
        httpOnly: true,
        sameSite: 'strict'
      });
      
      // Also try with lax same-site policy
      cookieStore.set(name, '', { 
        expires: new Date(0),
        path: '/',
        maxAge: 0,
        secure: true,
        httpOnly: true,
        sameSite: 'lax'
      });
    });
    
    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Error processing logout' },
      { status: 500 }
    );
  }
}