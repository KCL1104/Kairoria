/**
 * Shared authentication utilities for Supabase Auth
 * Contains only client-safe code that doesn't use next/headers
 */

// Cookie configuration for secure token storage
export const AUTH_COOKIE_OPTIONS = {
  path: '/',
  httpOnly: false,       // Allow JavaScript access for client-side auth state
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const, // Protects against CSRF
  maxAge: 60 * 60 * 24 * 30,  // 30 days default
}

/**
 * Log authentication events for security monitoring
 */
export function logAuthEvent(event: string, details: Record<string, any> = {}) {
  // In production, this could send to a logging service
  console.log(`🔐 AUTH EVENT [${new Date().toISOString()}]: ${event}`, {
    ...details,
    timestamp: Date.now()
  })
  
  // In development, also log to browser console if available
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log(`🔐 AUTH EVENT: ${event}`, details)
  }
}

/**
 * Check if a user profile is fully registered
 */
export function isProfileComplete(profile: any): boolean {
  return !!(
    profile?.full_name && 
    profile?.phone &&
    profile?.location &&
    profile?.is_email_verified === true &&
    profile?.is_phone_verified === true
  )
}

/**
 * Get missing profile fields for better error reporting
 */
export function getMissingProfileFields(profile: any): string[] {
  const missingFields = []
  
  if (!profile?.full_name) missingFields.push('full_name')
  if (!profile?.phone) missingFields.push('phone')
  if (!profile?.location) missingFields.push('location')
  if (profile?.is_email_verified !== true) missingFields.push('email_verification')
  if (profile?.is_phone_verified !== true) missingFields.push('phone_verification')
  
  return missingFields
}

/**
 * Check if a token is too long and might need chunking
 */
export function isTokenTooLong(token: string): boolean {
  const MAX_COOKIE_SIZE = 3800 // Same limit as in auth-server.ts
  return !!token && token.length > MAX_COOKIE_SIZE
}

/**
 * Validate a JWT token format with length check
 */
export function isValidJWT(token: string): boolean {
  if (!token) return false
  
  // First check token length
  if (isTokenTooLong(token)) {
    console.warn(`⚠️ Token is very long (${token.length} chars), may need chunking`)
    // Don't reject long tokens, but log the warning
  }
  
  // JWT format: header.payload.signature
  const parts = token.split('.')
  if (parts.length !== 3) return false
  
  // Check if each part is base64 encoded
  try {
    // Attempt to decode each part
    for (const part of parts) {
      // JWT uses base64url encoding
      const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
      const decoded = atob(base64)
      if (!decoded) return false
    }
    
    // Try to parse the payload
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    
    // Check for required JWT claims
    if (!payload.sub || !payload.exp) return false
    
    return true
  } catch (e) {
    return false
  }
}