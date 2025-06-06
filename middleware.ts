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

// Routes that don't require profile completion (even when authenticated)
const PROFILE_COMPLETION_EXEMPT_ROUTES = [
  '/complete-profile',
  '/auth/logout',
  '/auth/callback',
  '/api',
]

// Helper function to check if profile is complete
async function isProfileComplete(supabase: any, userId: string): Promise<boolean> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, location, phone')
      .eq('id', userId)
      .single()
    
    if (error || !profile) {
      return false
    }
    
    // Profile is complete if all required fields are present and non-empty
    return !!(profile.full_name?.trim() && profile.location?.trim() && profile.phone?.trim())
  } catch (error) {
    console.error('Error checking profile completeness:', error)
    return false
  }
}

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

    // Check profile completeness for authenticated users
    if (isAuthenticated && session?.user) {
      // Skip profile completion check for exempt routes
      const isExemptRoute = PROFILE_COMPLETION_EXEMPT_ROUTES.some(route => 
        pathname.startsWith(route)
      )
      
      if (!isExemptRoute) {
        const profileComplete = await isProfileComplete(supabase, session.user.id)
        
        if (!profileComplete) {
          // Redirect to complete profile page
          const redirectUrl = new URL('/complete-profile', req.url)
          redirectUrl.searchParams.set('return', encodeURI(pathname))
          return NextResponse.redirect(redirectUrl)
        }
      }
    }
    
    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return res
  }
}

// Configure the middleware to run on most paths to check profile completeness
export const config = {
  matcher: [
    // Include all routes except static files and API routes that don't need checking
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}