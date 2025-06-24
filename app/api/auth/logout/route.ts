import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logAuthEvent } from '@/lib/auth-utils';

export async function DELETE(request: Request) {
  try {
    logAuthEvent('logout_attempt')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      logAuthEvent('logout_config_error', { error: 'Supabase configuration missing' })
      return NextResponse.json(
        { success: false, message: 'Supabase configuration missing' },
        { status: 500 }
      );
    }
    
    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // Let Supabase handle cookie setting
        },
      },
    });
    
    // Sign out
    await supabase.auth.signOut();
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
    
    // Clear all Supabase-related cookies more thoroughly
    const allCookies = cookieStore.getAll();
    
    // Clear all cookies that match Supabase patterns
    allCookies.forEach(cookie => {
      if (cookie.name.startsWith('sb-') || cookie.name.includes('supabase')) {
        response.cookies.set(cookie.name, '', {
          path: '/',
          expires: new Date(0),
          maxAge: 0,
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
      }
    });
    
    // Also clear common auth-related cookies
    const authCookies = ['auth-token', 'session', 'access_token', 'refresh_token'];
    authCookies.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        path: '/',
        expires: new Date(0),
        maxAge: 0,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });
    
    logAuthEvent('logout_successful')
    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    logAuthEvent('logout_error', { error: String(error) })
    return NextResponse.json(
      { success: false, message: 'Error processing logout' },
      { status: 500 }
    );
  }
}