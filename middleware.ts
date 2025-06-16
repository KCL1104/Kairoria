import { type NextRequest, NextResponse } from 'next/server' 
import { createServerClient } from '@supabase/ssr' 

// 輔助函數：更新 session 並取得使用者 
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

  const { data: { user } } = await supabase.auth.getUser() 

  return { response, supabase, user } 
} 

// 簡化的檢查函數 - 檢查是否完全完成註冊 
function isFullyRegistered(profile: any): boolean { 
  return !!( 
    profile?.full_name && 
    profile?.phone && 
    profile?.location && 
    profile?.is_email_verified === true && 
    profile?.is_phone_verified === true 
  ) 
} 

// 路由定義 
const publicRoutes = ['/', '/about', '/contact'] // 公開路由 
const authRoutes = ['/auth/login', '/auth/signup', '/auth/reset-password'] 
const completeSignupRoute = '/complete-signup' 
const protectedRoutes = ['/profile', '/messages', '/dashboard', '/settings', '/admin'] 
 
 
 export async function middleware(request: NextRequest) { 
  const { response, supabase, user } = await updateSessionAndGetUser(request) 
  const path = request.nextUrl.pathname 

  // 判斷路由類型 
  const isPublicRoute = publicRoutes.some(route => path === route) 
  const isAuthRoute = authRoutes.some(route => path.startsWith(route)) 
  const isCompleteSignupRoute = path === completeSignupRoute 
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route)) 

  console.log(`[Middleware] Path: ${path}, User: ${user?.id ? 'logged in' : 'not logged in'}`) 

  // 規則 1: 未登入使用者 
  if (!user) { 
    // 允許訪問公開路由和登入頁面 
    if (isPublicRoute || isAuthRoute) { 
      return response 
    } 
    
    // 嘗試訪問受保護路由 → 導向登入 
    const redirectUrl = new URL('/auth/login', request.url) 
    redirectUrl.searchParams.set('callbackUrl', path) 
    return NextResponse.redirect(redirectUrl) 
  } 

  // 規則 2: 已登入使用者不應訪問登入頁面 
  if (user && isAuthRoute) { 
    return NextResponse.redirect(new URL('/', request.url)) 
  } 

  // 規則 3: 已登入使用者的註冊狀態檢查 
  if (user) { 
    try { 
      // 獲取用戶 profile 
      const { data: profile, error } = await supabase 
        .from('profiles') 
        .select('full_name, phone, location, is_email_verified, is_phone_verified') 
        .eq('id', user.id) 
        .single() 

      if (error && error.code !== 'PGRST116') { 
        console.error('Profile fetch error:', error) 
        return NextResponse.redirect(new URL('/?error=profile_error', request.url)) 
      } 

      const profileData = profile || {} 
      const fullyRegistered = isFullyRegistered(profileData) 

      console.log(`[Middleware] User ${user.id} fully registered: ${fullyRegistered}`) 

      // 如果已完全註冊 
      if (fullyRegistered) { 
        // 如果在 complete-signup 頁面，重定向到首頁或返回URL 
        if (isCompleteSignupRoute) { 
          const returnUrl = request.nextUrl.searchParams.get('return') 
          return NextResponse.redirect(new URL(returnUrl || '/', request.url)) 
        } 
        // 否則放行 
        return response 
      } 

      // 如果未完全註冊 
      if (!fullyRegistered) { 
        // 如果已經在 complete-signup 頁面，允許停留 
        if (isCompleteSignupRoute) { 
          return response 
        } 
        
        // 如果訪問受保護路由，導向 complete-signup 
        if (isProtectedRoute) { 
          const redirectUrl = new URL(completeSignupRoute, request.url) 
          redirectUrl.searchParams.set('return', path) 
          return NextResponse.redirect(redirectUrl) 
        } 
        
        // 訪問公開路由，允許訪問 
        return response 
      } 

    } catch (e: any) { 
      console.error('Middleware exception:', e.message) 
      return NextResponse.redirect(new URL('/?error=middleware_error', request.url)) 
    } 
  } 

  return response 
} 
 
 export const config = { 
   matcher: [ 
     '/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)', 
   ], 
 }