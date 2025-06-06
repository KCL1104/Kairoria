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
    console.log('Checking profile completeness for user:', userId)
    
    // Check profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, location, phone, is_verified')
      .eq('id', userId)
      .single()
    
    if (profileError || !profile) {
      console.log('Profile not found or error:', profileError)
      return false
    }
    
    // Check if basic profile fields are filled
    const hasRequiredFields = !!(profile.full_name?.trim() && profile.location?.trim() && profile.phone?.trim())
    
    if (!hasRequiredFields) {
      console.log('Missing required profile fields')
      return false
    }
    
    // Check email verification status
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('User not found or error:', userError)
      return false
    }
    
    const emailVerified = !!user.email_confirmed_at
    
    console.log('Profile completeness check details:', {
      userId,
      hasRequiredFields,
      emailVerified,
      phoneVerified: profile.is_verified,
      fullName: !!profile.full_name?.trim(),
      location: !!profile.location?.trim(),
      phone: !!profile.phone?.trim()
    })
    
    // Profile is complete if all required fields are present and both email and phone are verified
    // Note: phone verification is stored in is_verified field (set by complete-profile page)
    return hasRequiredFields && emailVerified && profile.is_verified
  } catch (error) {
    console.error('Error checking profile completeness:', error)
    return false
  }
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname
  
  console.log('Middleware executing for:', pathname)
  
  try {
    // Create Supabase client for auth checks
    const supabase = createMiddlewareClient({ req, res })
    
    // Check if session exists
    const {
      data: { session },
    } = await supabase.auth.getSession()
    
    const isAuthenticated = !!session
    
    console.log('Middleware auth check:', {
      pathname,
      isAuthenticated,
      userId: session?.user?.id
    })
    
    // Handle protected routes - redirect to login if not authenticated
    if (PROTECTED_ROUTES.some(route => pathname.startsWith(route)) && !isAuthenticated) {
      const redirectUrl = new URL('/auth/login', req.url)
      redirectUrl.searchParams.set('callbackUrl', encodeURI(pathname))
      console.log('Redirecting to login from protected route:', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    // Handle auth routes - redirect to home if already authenticated
    if (AUTH_ROUTES.some(route => pathname.startsWith(route)) && isAuthenticated) {
      // Don't redirect the callback route which is used by Supabase auth
      if (!pathname.includes('/auth/callback')) {
        console.log('Redirecting authenticated user from auth route:', pathname)
        return NextResponse.redirect(new URL('/', req.url))
      }
    }
    
    // Special case for logout page - allow this to process normally as it handles the logout flow
    if (pathname === '/auth/logout') {
      console.log('Allowing logout page access')
      return res
    }

    // Check profile completeness for authenticated users
    if (isAuthenticated && session?.user) {
      // Skip profile completion check for exempt routes
      const isExemptRoute = PROFILE_COMPLETION_EXEMPT_ROUTES.some(route => 
        pathname.startsWith(route)
      )
      
      console.log('Middleware check:', {
        pathname,
        isExemptRoute,
        userId: session.user.id
      })
      
      if (!isExemptRoute) {
        try {
          const profileComplete = await isProfileComplete(supabase, session.user.id)
          
          console.log('Profile complete check result:', {
            pathname,
            profileComplete,
            userId: session.user.id
          })
          
          if (!profileComplete) {
            // Redirect to complete profile page
            const redirectUrl = new URL('/complete-profile', req.url)
            redirectUrl.searchParams.set('return', encodeURI(pathname))
            console.log('Redirecting to complete-profile from:', pathname)
            return NextResponse.redirect(redirectUrl)
          }
        } catch (error) {
          console.error('Profile completeness check failed:', error)
          // Continue without redirect to avoid breaking the app
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