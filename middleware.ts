import { type NextRequest, NextResponse } from 'next/server' 
 import { createServerClient } from '@supabase/ssr' 
 
 // 輔助函數：更新 session 並取得使用者 (保持不變) 
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
 
 // 您的輔助函數 (保持不變) 
 function hasRequiredProfileFields(profile: any): boolean { 
   return !!(profile?.full_name && profile?.phone && profile?.location) 
 } 
 function isPhoneVerified(profile: any): boolean { 
   return profile?.is_phone_verified === true 
 } 
 function isEmailVerified(profile: any): boolean { 
   return profile?.is_email_verified === true 
 } 
 function isSignupComplete(profile: any): boolean { 
   return hasRequiredProfileFields(profile) && isEmailVerified(profile) 
 } 
 function isProfileComplete(profile: any): boolean { 
   return isSignupComplete(profile) && isPhoneVerified(profile) 
 } 
 
 // 您的路由定義 (保持不變) 
 const protectedRoutes = ['/profile', '/messages', '/dashboard', '/settings', '/admin'] 
 const authRoutes = ['/auth/login', '/auth/signup', '/auth/reset-password'] 
 const profileCompletionRoutes = ['/complete-profile', '/complete-signup', '/incomplete-signup'] 
 const requiresCompleteProfile = ['/profile/listings/new', '/profile/listings/edit', '/messages'] 
 
 
 export async function middleware(request: NextRequest) { 
   const { response, supabase, user } = await updateSessionAndGetUser(request) 
   const path = request.nextUrl.pathname 
 
   const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route)) 
   const isAuthRoute = authRoutes.some(route => path.startsWith(route)) 
   const isProfileCompletionRoute = profileCompletionRoutes.some(route => path.startsWith(route)) 
   const requiresFullProfile = requiresCompleteProfile.some(route => path.startsWith(route)) 
 
   // 規則 1: 已登入的使用者，不應再訪問登入/註冊頁面 
   if (user && isAuthRoute) { 
     return NextResponse.redirect(new URL('/', request.url)) 
   } 
 
   // 規則 2: 未登入的使用者，訪問受保護頁面，應被導向登入頁 
   if (!user && (isProtectedRoute || requiresFullProfile)) { 
     const redirectUrl = new URL('/auth/login', request.url) 
     redirectUrl.searchParams.set('callbackUrl', path) 
     return NextResponse.redirect(redirectUrl) 
   } 
 
   // 規則 3: 對已登入使用者，進行階層式狀態檢查 
   if (user) { 
     try { 
       const { data: profile, error } = await supabase 
         .from('profiles') 
         .select('full_name, phone, location, is_email_verified, is_phone_verified') 
         .eq('id', user.id) 
         .single() 
       
       const profileData = profile || {} // 您的優秀實踐！ 
 
       if (error && error.code !== 'PGRST116') { 
         console.error('查詢 Profile 錯誤:', error) 
         return NextResponse.redirect(new URL('/?error=profile_fetch_failed', request.url)) 
       } 
 
       // --- 改進後的核心邏輯 --- 
       
       // 如果使用者正在訪問補全頁面，我們先讓他留下，除非他資料已完整 
       if (isProfileCompletionRoute) { 
         if (isProfileComplete(profileData)) { 
            console.log('✅ Profile 已完成，從補全頁導向首頁'); 
            const returnUrl = request.nextUrl.searchParams.get('return'); 
            return NextResponse.redirect(new URL(returnUrl || '/', request.url)); 
         } 
         // 如果資料還不完整，就允許他停留在當前的補全頁面，這是防止迴圈的關鍵 
         console.log('➡️ Profile 未完成，允許停留在補全頁面'); 
         return response; 
       } 
 
       // 如果使用者在訪問任何其他頁面，我們開始進行階層檢查 
       // 只要有一項不滿足，就立刻重導向，後續的 else if 不會再執行 
 
       // 第一優先級：檢查基本資料 
       if (!hasRequiredProfileFields(profileData)) { 
         console.log('🔄 優先級 1：基本資料未完成 -> /complete-profile'); 
         return NextResponse.redirect(new URL('/complete-profile', request.url)); 
       } 
       // 第二優先級：檢查 Email 
       else if (!isEmailVerified(profileData)) { 
         console.log('🔄 優先級 2：Email 未驗證 -> /complete-signup'); 
         return NextResponse.redirect(new URL('/complete-signup', request.url)); 
       } 
       // 第三優先級：檢查手機 (僅限需要完整 Profile 的頁面) 
       else if (requiresFullProfile && !isPhoneVerified(profileData)) { 
         console.log('🔄 優先級 3：需要手機驗證 -> /incomplete-signup'); 
         const redirectUrl = new URL('/incomplete-signup', request.url); 
         redirectUrl.searchParams.set('return', path); 
         return NextResponse.redirect(redirectUrl); 
       } 
       
       // 如果所有檢查都通過，代表使用者是完整的，可以繼續 
       console.log('✅ 所有階層檢查通過'); 
 
     } catch (e: any) { 
       console.error('Middleware 發生例外:', e.message) 
       return NextResponse.redirect(new URL('/?error=middleware_exception', request.url)) 
     } 
   } 
 
   console.log(`✅ Middleware 檢查通過，繼續前往: ${path}`) 
   return response 
 } 
 
 export const config = { 
   matcher: [ 
     '/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)', 
   ], 
 }