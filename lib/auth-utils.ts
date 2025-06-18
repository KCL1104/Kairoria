/**
 * Shared authentication utilities for Supabase Auth
 * Contains only client-safe code that doesn't use next/headers
 */

// Cookie configuration for secure token storage
export const AUTH_COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
}

/**
 * Log authentication events for security monitoring
 */
export function logAuthEvent(event: string, details: Record<string, any> = {}) {
  // In production, this could send to a logging service
  console.log(`🔐 AUTH EVENT [${new Date().toISOString()}]: ${event}`, {
    ...details,
    timestamp: Date.now(),
    environment: process.env.NODE_ENV
  })
}