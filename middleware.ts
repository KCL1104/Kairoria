import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Helper function: Update session and get user based on the latest Supabase SSR pattern
async function updateSessionAndGetUser(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Important: This call automatically refreshes the token, crucial for maintaining login status
  const { data: { user } } = await supabase.auth.getUser()

  return { response, supabase, user }
}

// Helper function: Check if the user has the necessary profile fields
function hasRequiredProfileFields(profile: any): boolean {
  return !!(profile?.full_name && profile?.phone && profile?.location)
}

// Helper function: Check if the phone is verified
function isPhoneVerified(profile: any): boolean {
  return profile?.is_phone_verified === true
}

// Helper function: Check if the email is verified
function isEmailVerified(profile: any): boolean {
  return profile?.is_email_verified === true
}

// Helper function: Check if signup is complete (basic fields + email verification)
function isSignupComplete(profile: any): boolean {
  return hasRequiredProfileFields(profile) && isEmailVerified(profile)
}

// Helper function: Check if the profile is fully complete (including phone verification)
function isProfileComplete(profile: any): boolean {
  return isSignupComplete(profile) && isPhoneVerified(profile)
}

// Define route types
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
  '/auth/reset-password'
]

const profileCompletionRoutes = [
  '/complete-profile',
  '/complete-signup',
  '/incomplete-signup'
]

// Routes that require a complete profile (including phone verification)
const requiresCompleteProfile = [
  '/profile/listings/new',
  '/profile/listings/edit',
  '/messages'
]

export async function middleware(request: NextRequest) {
  // Step 1: Update and get session and user information
  const { response, supabase, user } = await updateSessionAndGetUser(request)
  const path = request.nextUrl.pathname

  console.log('🚀 Middleware running for path:', path)

  // Check if the current path belongs to a certain type
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  const isAuthRoute = authRoutes.some(route => path.startsWith(route))
  const isProfileCompletionRoute = profileCompletionRoutes.some(route => path.startsWith(route))
  const requiresFullProfile = requiresCompleteProfile.some(route => path.startsWith(route))

  // Rule 1: Logged-in users should not access login/signup pages again
  if (user && isAuthRoute) {
    console.log('✅ Logged-in user accessing auth page, redirecting to home')
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Rule 2: Unauthenticated users accessing protected pages should be redirected to the login page
  if (!user && isProtectedRoute) {
    console.log('❌ Unauthenticated user accessing protected page, redirecting to login')
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(redirectUrl)
  }

  // Rule 3: Logged-in users, perform profile check
  if (user && (isProtectedRoute || isAuthRoute)) {
    try {
      // Query user profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, phone, location, is_email_verified, is_phone_verified')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error querying profile:', error)
        // Redirect to complete-profile as a safety measure on error
        return NextResponse.redirect(new URL('/complete-profile', request.url))
      }

      // Rule 3.1: If basic profile data is incomplete, redirect to complete-profile
      if (!hasRequiredProfileFields(profile)) {
        if (!isProfileCompletionRoute || path === '/incomplete-signup') {
          console.log('🔄 Basic profile data incomplete, redirecting to complete-profile')
          return NextResponse.redirect(new URL('/complete-profile', request.url))
        }
      }
      // Rule 3.2: If email is not verified, redirect to complete-signup
      else if (!isEmailVerified(profile)) {
        if (!isProfileCompletionRoute || path === '/incomplete-signup') {
          console.log('🔄 Email not verified, redirecting to complete-signup')
          return NextResponse.redirect(new URL('/complete-signup', request.url))
        }
      }
      // Rule 3.3: If accessing a route that requires a complete profile but phone is not verified
      else if (requiresFullProfile && !isPhoneVerified(profile)) {
        if (!isProfileCompletionRoute) {
          console.log('🔄 Phone verification required, redirecting to incomplete-signup')
          const redirectUrl = new URL('/incomplete-signup', request.url)
          redirectUrl.searchParams.set('return', path)
          return NextResponse.redirect(redirectUrl)
        }
      }
      // Rule 3.4: If profile is complete but user is accessing a completion page, redirect to home or return URL
      else if (isProfileComplete(profile) && isProfileCompletionRoute) {
        console.log('✅ Profile complete, redirecting to home or return URL')
        const returnUrl = request.nextUrl.searchParams.get('return')
        return NextResponse.redirect(new URL(returnUrl || '/', request.url))
      }

      console.log('✅ Profile check passed')
    } catch (error) {
      console.error('Profile check error:', error)
      // 錯誤時導向 complete-profile 作為安全措施
      return NextResponse.redirect(new URL('/complete-profile', request.url))
    }
  }

  console.log(`✅ Middleware check passed, proceeding to: ${path}`)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}