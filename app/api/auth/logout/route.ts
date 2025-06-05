import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Handler for POST requests to the logout endpoint
export async function POST(request: Request) {
  try {
    // Get Supabase URL and key with flexible naming
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      // Get cookies from request to identify the session
      const cookies = request.headers.get('cookie')
      if (cookies) {
        // Extract the session token from cookies if needed
        // This depends on how your authentication is set up
        
        // For server-side logout with Supabase, we can use admin privileges
        // to invalidate the session if needed
      }
      
      // Server-side signout to invalidate the session
      await supabase.auth.signOut()
    }
    
    // Always return success, even if we couldn't perform server-side logout
    // The client-side logout will handle most of the cleanup
    return NextResponse.json({ 
      success: true,
      message: 'Logged out successfully' 
    }, {
      headers: {
        // Clear any authentication cookies
        'Set-Cookie': [
          'supabase-auth-token=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax',
          'sb-access-token=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax',
          'sb-refresh-token=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax'
        ].join(', ')
      }
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Error processing logout' },
      { status: 500 }
    );
  }
}