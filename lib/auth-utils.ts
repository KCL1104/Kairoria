/**
 * Shared authentication utilities for Supabase Auth
 * Contains only client-safe code that doesn't use next/headers
 */

// Cookie configuration for secure token storage
export const AUTH_COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true, // Prevents JavaScript access
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days default
  partitioned: false,
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