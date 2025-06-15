import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Define route patterns
const protectedRoutes = [
  '/profile',
  '/messages',
  '/dashboard',
  '/settings',
  '/admin'
]

const authRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/auth/reset-password'
]

const profileCompletionRoutes = [
  '/complete-profile',
  '/complete-signup',
  '/incomplete-signup'
]

// Routes that require complete signup (verification)
const requiresCompleteSignup = [
  '/messages',
  '/dashboard'
]

// Routes that require complete profile (full profile data)
const requiresCompleteProfile = [
  '/profile',
  '/profile/listings',
  '/profile/listings/new',
  '/profile/listings/edit',
  '/profile/settings'
]

// Routes that need complete signup but should redirect to incomplete-signup first
const needsCompleteSignupRoutes = [
  '/messages',
  '/dashboard',
  '/profile',
  '/profile/listings',
  '/profile/listings/new',
  '/profile/listings/edit',
  '/profile/settings'
]

// Helper function to check if user has required profile fields
function hasRequiredProfileFields(profile: any): boolean {
  return !!(profile?.full_name && profile?.phone && profile?.location)
}

// Helper function to check if phone is verified
function isPhoneVerified(profile: any): boolean {
  return profile?.is_phone_verified === true
}

// Helper function to check if email is verified
function isEmailVerified(profile: any): boolean {
  return profile?.is_email_verified === true
}

// Helper function to check if profile is complete (both email and phone verified)
function isProfileComplete(profile: any): boolean {
  return hasRequiredProfileFields(profile) && 
         isPhoneVerified(profile) && 
         isEmailVerified(profile)
}

// Helper function to check if signup is complete (only basic fields required)
function isSignupComplete(profile: any): boolean {
  return hasRequiredProfileFields(profile)
}

export async function middleware(request: NextRequest) {
  // First, update the session using the new SSR approach
  let response = await updateSession(request)
  
  // Get the current path
  const path = request.nextUrl.pathname
  
  console.log('🚀 Middleware running for path:', path)
  
  // Check if it's a protected route
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  const isAuthRoute = authRoutes.some(route => path.startsWith(route))
  const isProfileCompletionRoute = profileCompletionRoutes.some(route => path.startsWith(route))
  
  console.log('isProtectedRoute:', isProtectedRoute)
  console.log('isAuthRoute:', isAuthRoute)
  console.log('isProfileCompletionRoute:', isProfileCompletionRoute)
  
  // Create a new Supabase client for this request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Don't set cookies in middleware, let updateSession handle it
        },
        remove(name: string, options: any) {
          // Don't remove cookies in middleware, let updateSession handle it
        },
      },
    }
  )
  
  // Get the user
  const { data: { user }, error } = await supabase.auth.getUser()
  
  console.log('User status:', user ? 'authenticated' : 'not authenticated')
  if (error) {
    console.error('User fetch error:', error)
  }
  
  // If user is not authenticated and trying to access protected route
  if (isProtectedRoute && !user) {
    console.log('❌ Redirecting unauthenticated user to login')
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Allow authenticated users to access profile completion routes without further checks
  if (user && isProfileCompletionRoute) {
    console.log('✅ Allowing authenticated user to access profile completion route')
    return response
  }
  
  // Check if user is trying to access routes that need complete signup
  // Skip this check if user is already on incomplete-signup page to prevent loops
  const needsCompleteSignup = needsCompleteSignupRoutes.some(route => path.startsWith(route))
  if (user && needsCompleteSignup && !isProfileCompletionRoute && path !== '/incomplete-signup') {
    console.log('🔍 Checking profile completeness for authenticated user accessing protected route')
    
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.error('Profile fetch error:', profileError)
      }
      
      // Check if user has incomplete signup - redirect to incomplete-signup page first
      if (!isSignupComplete(profile) || !isEmailVerified(profile) || !isPhoneVerified(profile)) {
        console.log('🔄 Redirecting to /incomplete-signup - signup incomplete')
        const redirectUrl = new URL('/incomplete-signup', request.url)
        redirectUrl.searchParams.set('return', path)
        return NextResponse.redirect(redirectUrl)
      }
      
      console.log('✅ Profile is complete, allowing access')
    } catch (error) {
      console.error('Error checking profile:', error)
      // On error, redirect to incomplete-signup as safety measure
      const redirectUrl = new URL('/incomplete-signup', request.url)
      redirectUrl.searchParams.set('return', path)
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  // If user is authenticated and trying to access auth routes (except callback and login), check profile completeness first
  if (user && isAuthRoute && path !== '/auth/callback' && path !== '/auth/login') {
    console.log('✅ Authenticated user accessing auth route, checking profile completeness')
    
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.error('Profile fetch error during auth route check:', profileError)
      }
      
      // If profile is incomplete, redirect to complete-profile instead of profile
      if (!isSignupComplete(profile)) {
        console.log('🔄 Redirecting to /complete-profile - missing required fields')
        return NextResponse.redirect(new URL('/complete-profile', request.url))
      }
      
      // If profile has required fields but not verified, redirect to complete-signup
      if (!isEmailVerified(profile) || !isPhoneVerified(profile)) {
        console.log('🔄 Redirecting to /complete-signup - verification needed')
        return NextResponse.redirect(new URL('/complete-signup', request.url))
      }
      
      // If profile is complete, redirect to incomplete-signup to handle next step
      console.log('✅ Profile complete, redirecting to /incomplete-signup')
      return NextResponse.redirect(new URL('/incomplete-signup', request.url))
    } catch (error) {
      console.error('Error checking profile during auth route access:', error)
      // Fallback to incomplete-signup redirect if there's an error
      return NextResponse.redirect(new URL('/incomplete-signup', request.url))
    }
  }
  
  // If authenticated user tries to access login page, redirect based on profile status
  if (user && path === '/auth/login') {
    console.log('✅ Authenticated user accessing login page, checking profile completeness')
    
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.error('Profile fetch error during login page check:', profileError)
      }
      
      // If profile is incomplete, redirect to complete-profile
      if (!isSignupComplete(profile)) {
        console.log('🔄 Redirecting to /complete-profile - missing required fields')
        return NextResponse.redirect(new URL('/complete-profile', request.url))
      }
      
      // If profile has required fields but not verified, redirect to complete-signup
      if (!isEmailVerified(profile) || !isPhoneVerified(profile)) {
        console.log('🔄 Redirecting to /complete-signup - verification needed')
        return NextResponse.redirect(new URL('/complete-signup', request.url))
      }
      
      // If profile is complete, redirect to incomplete-signup with callback URL
      const callbackUrl = request.nextUrl.searchParams.get('callbackUrl')
      const redirectUrl = new URL('/incomplete-signup', request.url)
      if (callbackUrl) {
        redirectUrl.searchParams.set('return', callbackUrl)
      }
      console.log('✅ Profile complete, redirecting to /incomplete-signup with return URL:', callbackUrl || 'none')
      return NextResponse.redirect(redirectUrl)
    } catch (error) {
      console.error('Error checking profile during login page access:', error)
      // Fallback to incomplete-signup redirect if there's an error
      return NextResponse.redirect(new URL('/incomplete-signup', request.url))
    }
  }
  
  console.log('✅ Allowing request to continue')
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}