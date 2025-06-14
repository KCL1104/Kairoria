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

// List of routes that require complete signup (profile completion)
const COMPLETE_SIGNUP_REQUIRED_ROUTES = [
  '/profile',
  '/profile/listings',
  '/profile/rentals', 
  '/profile/listings/new',
  '/marketplace/', // for item viewing and renting (will match /marketplace/123 etc.)
  '/messages', // for communication about rentals
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
  '/incomplete-signup',
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
    
    if (profileError) {
      console.log('Profile not found or error:', profileError)
      // If profile doesn't exist (PGRST116), it's definitely not complete
      return false
    }
    
    if (!profile) {
      console.log('No profile data found')
      return false
    }
    
    // Check if basic profile fields are filled
    const hasRequiredFields = !!(profile.full_name?.trim() && profile.location?.trim() && profile.phone?.trim())
    
    if (!hasRequiredFields) {
      console.log('Missing required profile fields:', {
        full_name: !!profile.full_name?.trim(),
        location: !!profile.location?.trim(),
        phone: !!profile.phone?.trim()
      })
      return false
    }
    
    // Check email verification status
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('User not found or error:', userError)
      return false
    }
    
    const emailVerified = !!user.email_confirmed_at
    
    // Check if Firebase is configured by checking environment variables
    // In middleware, we need to be more careful about environment variable access
    let isFirebaseConfigured = false
    try {
      isFirebaseConfigured = !!(
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      )
    } catch (error) {
      console.log('Could not check Firebase configuration in middleware, assuming not configured')
      isFirebaseConfigured = false
    }
    
    console.log('Profile completeness check details:', {
      userId,
      hasRequiredFields,
      emailVerified,
      phoneVerified: profile.is_verified,
      isFirebaseConfigured,
      fullName: !!profile.full_name?.trim(),
      location: !!profile.location?.trim(),
      phone: !!profile.phone?.trim()
    })
    
    // Profile is complete if:
    // 1. All required fields are present
    // 2. Email is verified
    // 3. Phone is verified (only if Firebase is configured)
    const phoneRequirementMet = !isFirebaseConfigured || profile.is_verified
    const isComplete = hasRequiredFields && emailVerified && phoneRequirementMet
    
    console.log('Profile completion check result:', {
      hasRequiredFields,
      emailVerified,
      phoneRequirementMet,
      isComplete
    })
    
    return isComplete
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
            // Check if this is a route that requires complete signup
            const requiresCompleteSignup = COMPLETE_SIGNUP_REQUIRED_ROUTES.some(route => {
              // Special handling for marketplace product pages
              if (route === '/marketplace/' && pathname.startsWith('/marketplace/') && pathname !== '/marketplace') {
                return true
              }
              return pathname.startsWith(route)
            })
            
            if (requiresCompleteSignup) {
              // Redirect to incomplete signup page for routes that require complete signup
              const redirectUrl = new URL('/incomplete-signup', req.url)
              redirectUrl.searchParams.set('return', encodeURI(pathname))
              console.log('Redirecting to incomplete-signup from:', pathname)
              return NextResponse.redirect(redirectUrl)
            } else {
              // For other routes, redirect directly to complete profile
              const redirectUrl = new URL('/complete-profile', req.url)
              redirectUrl.searchParams.set('return', encodeURI(pathname))
              console.log('Redirecting to complete-profile from:', pathname)
              return NextResponse.redirect(redirectUrl)
            }
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