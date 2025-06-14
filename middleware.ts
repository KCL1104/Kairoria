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

const requiresCompleteSignup = [
  '/messages',
  '/dashboard'
]

const requiresCompleteProfile = [
  '/profile',
  '/profile/listings',
  '/profile/listings/new',
  '/profile/listings/edit',
  '/profile/settings'
]

// Helper function to check if profile has all required fields
function hasRequiredProfileFields(profile: any): boolean {
  if (!profile) return false
  
  const requiredFields = [
    'full_name',
    'phone',
    'location'
  ]
  
  return requiredFields.every(field => {
    const value = profile[field]
    return value !== null && value !== undefined && value !== ''
  })
}

// Helper function to check if phone number is verified
function isPhoneVerified(profile: any): boolean {
  return profile?.is_verified === true
}

// Helper function to check if email is verified
function isEmailVerified(user: any): boolean {
  return user?.email_confirmed_at !== null
}

// Helper function to check if profile is complete
function isProfileComplete(user: any, profile: any): boolean {
  console.log('🔍 Checking profile completeness:')
  console.log('User:', {
    id: user?.id,
    email: user?.email,
    email_confirmed_at: user?.email_confirmed_at
  })
  console.log('Profile:', profile)
  
  const hasRequiredFieldsResult = hasRequiredProfileFields(profile)
  const emailVerified = isEmailVerified(user)
  const phoneRequirementMet = isPhoneVerified(profile)
  
  console.log('hasRequiredFields:', hasRequiredFieldsResult)
  console.log('emailVerified:', emailVerified)
  console.log('phoneRequirementMet:', phoneRequirementMet)
  
  const isComplete = hasRequiredFieldsResult && emailVerified && phoneRequirementMet
  console.log('isComplete:', isComplete)
  
  return isComplete
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
  
  console.log('isProtectedRoute:', isProtectedRoute)
  console.log('isAuthRoute:', isAuthRoute)
  
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
  
  // If user is authenticated, check profile completeness for certain routes
  if (user && (requiresCompleteSignup.some(route => path.startsWith(route)) || requiresCompleteProfile.some(route => path.startsWith(route)))) {
    console.log('🔍 Checking profile completeness for authenticated user')
    
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
      
      const profileComplete = isProfileComplete(user, profile)
      
      if (!profileComplete) {
        console.log('❌ Profile incomplete, redirecting...')
        
        // For routes that require complete signup, redirect to incomplete-signup
        if (requiresCompleteSignup.some(route => path.startsWith(route))) {
          console.log('Redirecting to /incomplete-signup')
          return NextResponse.redirect(new URL('/incomplete-signup', request.url))
        }
        
        // For routes that require complete profile, redirect to complete-profile
        if (requiresCompleteProfile.some(route => path.startsWith(route))) {
          console.log('Redirecting to /complete-profile')
          return NextResponse.redirect(new URL('/complete-profile', request.url))
        }
      } else {
        console.log('✅ Profile is complete, allowing access')
      }
    } catch (error) {
      console.error('Error checking profile:', error)
    }
  }
  
  // If user is authenticated and trying to access auth routes, redirect to profile
  if (user && isAuthRoute && path !== '/auth/callback') {
    console.log('✅ Redirecting authenticated user away from auth routes')
    return NextResponse.redirect(new URL('/profile', request.url))
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