import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/auth-server'
import { logAuthEvent, isProfileComplete, getMissingProfileFields } from '@/lib/auth-utils'
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
    return { response, supabase: null, user: null }
  }
} 

// Route definitions
const publicRoutes = ['/', '/about', '/contact', '/marketplace', '/how-it-works', '/sustainability', '/terms', '/privacy', '/cookies']
const authRoutes = ['/auth/login', '/auth/register', '/auth/reset-password', '/auth/forgot-password', '/auth/verify', '/auth/callback', '/auth/google-oauth-fix', '/auth/oauth-config']
const completeSignupRoute = '/complete-signup' 
const completeProfileRoutes = ['/complete-signup']
const protectedRoutes = ['/profile', '/messages', '/dashboard', '/settings', '/admin', '/profile/listings']
const debugRoutes = ['/debug-auth', '/test-unified-auth']
 
export async function middleware(request: NextRequest) { 
  const { response, user } = await updateSessionAndGetUser(request) 
  const path = request.nextUrl.pathname 
  console.log(`🔍 [Middleware] Processing: ${path} (DEMO MODE - All protections disabled)`)

  // Skip middleware for static files and API routes
  if (
    path.startsWith('/_next/') ||
    path.startsWith('/api/') ||
    path.includes('.') ||
    path.startsWith('/favicon')
  ) {
    return response
  }

  // Determine route types
  const isAuthRoute = authRoutes.some(route => path.startsWith(route)) 

  // Only redirect authenticated users away from auth routes (except callback)
  if (user && isAuthRoute && !path.includes('/callback')) { 
    console.log(`🔄 [Middleware] Redirecting authenticated user away from auth route`)
    return NextResponse.redirect(new URL('/', request.url)) 
  } 

  // For demo: Allow access to all routes regardless of authentication or profile completion
  console.log(`✅ [Middleware] DEMO MODE: Allowing access to ${path}`)
  return response 
} 
 
export const config = { 
  matcher: [ 
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)', 
  ], 
}