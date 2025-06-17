import { type NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient, logAuthEvent } from '@/lib/auth-utils'
import { AuthDebugger } from '@/lib/auth-debug'

// Helper function to update session and get user
async function updateSessionAndGetUser(request: NextRequest) { 
  let response = NextResponse.next({ 
    request: { 
      headers: request.headers, 
    }, 
  }) 

  try {
    const supabase = createMiddlewareClient(request, response)

    const { data: { user } } = await supabase.auth.getUser()
    console.log('🔍 Middleware - User check:', {
      path: request.nextUrl.pathname,
      hasUser: !!user,
      userId: user?.id
    })
    return { response, supabase, user }
  } catch (error) {
    console.error('Error getting user in middleware:', error)
    return { response, supabase, user: null }
  }
} 

// Simplified check function - check if fully registered
function isFullyRegistered(profile: any): boolean { 
  return !!( 
    profile?.full_name && 
    profile?.phone && 
    profile?.location && 
    profile?.is_email_verified === true && 
    profile?.is_phone_verified === true 
  ) 
} 

// Route definitions
const publicRoutes = ['/', '/about', '/contact', '/marketplace', '/how-it-works', '/sustainability', '/terms', '/privacy', '/cookies']
const authRoutes = ['/auth/login', '/auth/register', '/auth/reset-password', '/auth/forgot-password', '/auth/verify', '/auth/callback']
const completeSignupRoute = '/complete-signup' 
const protectedRoutes = ['/profile', '/messages', '/dashboard', '/settings', '/admin']
 
export async function middleware(request: NextRequest) { 
  const { response, supabase, user } = await updateSessionAndGetUser(request) 
  const path = request.nextUrl.pathname 
  console.log(`🔍 [Middleware] Processing: ${path}`)

  // Skip middleware for static files and API routes
  if (
    path.startsWith('/_next/') ||
    path.startsWith('/api/') ||
    path.includes('.') ||
    path.startsWith('/favicon')
  ) {
    console.log(`⏭️ [Middleware] Skipping: ${path}`)
    return response
  }

  // Determine route types
  const isPublicRoute = publicRoutes.some(route => path === route || path.startsWith(route + '/'))
  const isAuthRoute = authRoutes.some(route => path.startsWith(route)) 
  const isCompleteSignupRoute = path === completeSignupRoute 
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route)) 

  console.log(`🔍 [Middleware] Path: ${path}, User: ${user?.id ? 'logged in' : 'not logged in'}`) 

  // Rule 1: Unauthenticated users
  if (!user) { 
    // Allow access to public routes and auth routes
    if (isPublicRoute || isAuthRoute) {
      if (isProtectedRoute) {
        logAuthEvent('access_denied', { 
          path, 
          reason: 'unauthenticated',
          redirectTo: '/auth/login'
        })
      }
      return response 
    } 
    console.log(`🔒 [Middleware] Redirecting unauthenticated user to login`)
    
    // Redirect to login for protected routes
    const redirectUrl = new URL('/auth/login', request.url) 
    redirectUrl.searchParams.set('callbackUrl', path) 
    return NextResponse.redirect(redirectUrl) 
  } 

  // Rule 2: Authenticated users shouldn't access auth routes
  if (user && isAuthRoute && !path.includes('/callback')) { 
    console.log(`🔄 [Middleware] Redirecting authenticated user away from auth route`)
    logAuthEvent('auth_route_redirect', { 
      userId: user.id,
      path,
      redirectTo: '/'
    })
    return NextResponse.redirect(new URL('/', request.url)) 
  } 

  // Rule 3: Check registration status for authenticated users
  if (user && supabase) { 
    try { 
      // Get user profile
      console.log(`👤 [Middleware] Fetching profile for user: ${user.id}`)
      const { data: profile, error } = await supabase 
        .from('profiles') 
        .select('full_name, phone, location, is_email_verified, is_phone_verified') 
        .eq('id', user.id) 
        .single() 

      if (error && error.code !== 'PGRST116') { 
        console.error('❌ [Middleware] Profile fetch error:', {
          code: error.code,
          message: error.message
        })
        console.error('Profile fetch error:', error) 
        return response // Continue without profile check on error
      } 

      const profileData = profile || {} 
      const fullyRegistered = isFullyRegistered(profileData) 

      console.log(`✅ [Middleware] User ${user.id} fully registered: ${fullyRegistered}`) 

      // If fully registered
      if (fullyRegistered) { 
        // Redirect away from complete-signup page
        if (isCompleteSignupRoute) { 
          const returnUrl = request.nextUrl.searchParams.get('return') 
          return NextResponse.redirect(new URL(returnUrl || '/', request.url)) 
          console.log(`🔄 [Middleware] Redirecting fully registered user away from complete-signup`)
        } 
        // Allow access to all routes
        return response 
      } 

      // If not fully registered
      if (!fullyRegistered) { 
        // Allow staying on complete-signup page
        console.log(`📝 [Middleware] User not fully registered, profile:`, profileData)
        logAuthEvent('incomplete_profile', { 
          userId: user.id,
          path,
          profileStatus: profileData
        })
        
        if (isCompleteSignupRoute) { 
          return response 
        } 
        
        // Redirect protected routes to complete-signup
        if (isProtectedRoute) { 
          const redirectUrl = new URL(completeSignupRoute, request.url) 
          console.log(`🔄 [Middleware] Redirecting incomplete user to complete-signup`)
          redirectUrl.searchParams.set('return', path) 
          logAuthEvent('profile_completion_redirect', { 
            userId: user.id,
            path,
            redirectTo: redirectUrl.toString()
          })
          return NextResponse.redirect(redirectUrl) 
        } 
        
        // Allow access to public routes
        return response 
      } 

    } catch (e: any) { 
      console.error('❌ [Middleware] Exception:', e.message) 
      return response // Continue on error
    } 
  } 

  return response 
} 
 
export const config = { 
  matcher: [ 
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)', 
  ], 
}