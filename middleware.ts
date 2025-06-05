import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// List of routes that require authentication
const PROTECTED_ROUTES = [
  '/profile',
  '/profile/listings',
  '/profile/rentals',
  '/profile/listings/new',
  '/messages',
  '/admin',
]

// List of authentication routes that should redirect to home if already logged in
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname
  
  try {
    // Create Supabase client for auth checks
    const supabase = createMiddlewareClient({ req, res })
    
    // Check if session exists
    const {
      data: { session },
    } = await supabase.auth.getSession()
    
    const isAuthenticated = !!session
    
    // Handle protected routes - redirect to login if not authenticated
    if (PROTECTED_ROUTES.some(route => pathname.startsWith(route)) && !isAuthenticated) {
      const redirectUrl = new URL('/auth/login', req.url)
      redirectUrl.searchParams.set('callbackUrl', encodeURI(pathname))
      return NextResponse.redirect(redirectUrl)
    }
    
    // Handle auth routes - redirect to home if already authenticated
    if (AUTH_ROUTES.some(route => pathname.startsWith(route)) && isAuthenticated) {
      // Don't redirect the callback route which is used by Supabase auth
      if (!pathname.includes('/auth/callback')) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }
    
    // Special case for logout page - allow this to process normally as it handles the logout flow
    if (pathname === '/auth/logout') {
      return res
    }
    
    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return res
  }
}

// Configure the middleware to run only on specific paths
export const config = {
  matcher: [
    // Include all routes starting with these prefixes
    '/profile/:path*',
    '/messages/:path*',
    '/auth/:path*',
    '/admin/:path*',
  ],
}