import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr' 

// Helper function to update session and get user
async function updateSessionAndGetUser(request: NextRequest) { 
  let response = NextResponse.next({ 
    request: { 
      headers: request.headers, 
    }, 
  }) 

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    return { response, supabase: null, user: null }
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  ) 

  try {
    const { data: { user } } = await supabase.auth.getUser()
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
  const isPublicRoute = publicRoutes.some(route => path === route || path.startsWith(route + '/'))
  const isAuthRoute = authRoutes.some(route => path.startsWith(route)) 
  const isCompleteSignupRoute = path === completeSignupRoute 
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route)) 

  console.log(`[Middleware] Path: ${path}, User: ${user?.id ? 'logged in' : 'not logged in'}`) 

  // Rule 1: Unauthenticated users
  if (!user) { 
    // Allow access to public routes and auth routes
    if (isPublicRoute || isAuthRoute) { 
      return response 
    } 
    
    // Redirect to login for protected routes
    const redirectUrl = new URL('/auth/login', request.url) 
    redirectUrl.searchParams.set('callbackUrl', path) 
    return NextResponse.redirect(redirectUrl) 
  } 

  // Rule 2: Authenticated users shouldn't access auth routes
  if (user && isAuthRoute && !path.includes('/callback')) { 
    return NextResponse.redirect(new URL('/', request.url)) 
  } 

  // Rule 3: Check registration status for authenticated users
  if (user && supabase) { 
    try { 
      // Get user profile
      const { data: profile, error } = await supabase 
        .from('profiles') 
        .select('full_name, phone, location, is_email_verified, is_phone_verified') 
        .eq('id', user.id) 
        .single() 

      if (error && error.code !== 'PGRST116') { 
        console.error('Profile fetch error:', error) 
        return response // Continue without profile check on error
      } 

      const profileData = profile || {} 
      const fullyRegistered = isFullyRegistered(profileData) 

      console.log(`[Middleware] User ${user.id} fully registered: ${fullyRegistered}`) 

      // If fully registered
      if (fullyRegistered) { 
        // Redirect away from complete-signup page
        if (isCompleteSignupRoute) { 
          const returnUrl = request.nextUrl.searchParams.get('return') 
          return NextResponse.redirect(new URL(returnUrl || '/', request.url)) 
        } 
        // Allow access to all routes
        return response 
      } 

      // If not fully registered
      if (!fullyRegistered) { 
        // Allow staying on complete-signup page
        if (isCompleteSignupRoute) { 
          return response 
        } 
        
        // Redirect protected routes to complete-signup
        if (isProtectedRoute) { 
          const redirectUrl = new URL(completeSignupRoute, request.url) 
          redirectUrl.searchParams.set('return', path) 
          return NextResponse.redirect(redirectUrl) 
        } 
        
        // Allow access to public routes
        return response 
      } 

    } catch (e: any) { 
      console.error('Middleware exception:', e.message) 
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