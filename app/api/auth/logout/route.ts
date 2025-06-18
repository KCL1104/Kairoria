import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logAuthEvent } from '@/lib/auth-utils';

// Handler for POST requests to the logout endpoint
export async function DELETE(request: Request) {
  try {
    logAuthEvent('logout_attempt')
    
    // Set response headers for immediate feedback
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    })

    // Get Supabase URL and key with flexible naming
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      logAuthEvent('logout_config_error', { error: 'Supabase configuration missing' })
      return NextResponse.json(
        { success: false, message: 'Supabase configuration missing' },
        { status: 500, headers }
      );
    }
    
    // Extract session token from cookie or authorization header
    const cookieStore = cookies();
    const supabaseAuthCookie = cookieStore.get('sb-access-token')?.value;
    const authHeader = request.headers.get('authorization')?.split('Bearer ')[1];
    const sessionToken = supabaseAuthCookie || authHeader;
    
    // Create admin client for server-side operations
    const adminClient = supabaseServiceKey 
      ? createServerClient(supabaseUrl, supabaseServiceKey, {
          cookies: {
            get(name: string) {
              return request.headers.get('cookie')?.split(`${name}=`)[1]?.split(';')[0]
            },
            set(name: string, value: string, options: any) {
              // Server-side cookie setting will be handled by the response
            },
            remove(name: string, options: any) {
              // Server-side cookie removal will be handled by the response
            },
          },
        })
      : null;
      
    // If we have a session token and admin client, invalidate the session
    if (sessionToken && adminClient) {
      try {
        logAuthEvent('session_invalidation_attempt', { hasToken: !!sessionToken })
        // Attempt to invalidate the specific session
        await adminClient.auth.admin.signOut(sessionToken);
        logAuthEvent('session_invalidated_success')
      } catch (error) {
        console.error('Failed to invalidate session:', error);
        logAuthEvent('session_invalidation_error', { error: String(error) })
        // Continue with the response even if session invalidation fails
      }
    }
    
    // Create response with cookie clearing headers
    const response = NextResponse.json({ 
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    }, { headers });
    
    // Clear all potential auth cookies
    const cookiesToClear = [
      // Supabase auth cookies
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
    
    // Clear cookies with multiple configurations to ensure complete removal
    cookiesToClear.forEach(name => {
      // Clear cookie configurations
      const clearConfigs = [
        // Basic path-only config
        {
          path: '/',
          expires: new Date(0),
          maxAge: 0,
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true,
          sameSite: 'lax' as const
        },
        // With domain for cross-subdomain support
        {
          path: '/',
          domain: `.${new URL(request.url).hostname}`,
          expires: new Date(0),
          maxAge: 0,
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true,
          sameSite: 'lax' as const
        },
        // Root domain only
        {
          path: '/',
          domain: new URL(request.url).hostname,
          expires: new Date(0),
          maxAge: 0,
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true,
          sameSite: 'lax' as const
        }
      ];

      // Apply all configurations to ensure cookie is cleared
      clearConfigs.forEach(config => {
        response.cookies.set(name, '', config);
      });
    });
    
    logAuthEvent('logout_successful')
    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    logAuthEvent('logout_error', { error: String(error) })
    return NextResponse.json(
      { success: false, message: 'Error processing logout' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}

// Support POST method for backward compatibility
export const POST = DELETE;