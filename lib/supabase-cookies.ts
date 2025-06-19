// lib/supabase-cookies.ts
export function getSupabaseCookieNames() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || ''
  
  return {
    authToken: `sb-${projectRef}-auth-token`,
    authTokenPattern: new RegExp(`sb-${projectRef}-auth-token(\\.\\d+)?`),
    projectRef
  }
}

export function getAllSupabaseCookies(cookieString: string): Record<string, string> {
  const { authTokenPattern } = getSupabaseCookieNames()
  const cookies: Record<string, string> = {}
  
  // Parse all cookies
  cookieString.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=')
    if (name && authTokenPattern.test(name)) {
      cookies[name] = value
    }
  })
  
  return cookies
}