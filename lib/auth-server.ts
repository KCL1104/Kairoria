/**
 * Server-side authentication utilities for Supabase Auth
 * This file uses next/headers and should only be imported in Server Components
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_OPTIONS } from './auth-utils'

/**
 * Create a Supabase server client with secure cookie handling
 */
export function createSecureServerClient() {
  const cookieStore = cookies()
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Enhance cookie security options
            const enhancedOptions = {
              ...options,
              ...AUTH_COOKIE_OPTIONS,
              // Set appropriate max age based on token type
              maxAge: name.includes('refresh') 
                ? 60 * 60 * 24 * 30 // 30 days for refresh token
                : 60 * 60 * 24      // 24 hours for access token
            }
            
            cookieStore.set(name, value, enhancedOptions)
          })
        },
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    }
  )
}

/**
 * Create a Supabase server client for middleware with secure cookie handling
 */
export function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Enhance cookie security options
            const enhancedOptions = {
              ...options,
              ...AUTH_COOKIE_OPTIONS,
              // Set appropriate max age based on token type
              maxAge: name.includes('refresh') 
                ? 60 * 60 * 24 * 30 // 30 days for refresh token
                : 60 * 60 * 24      // 24 hours for access token
            }
            
            request.cookies.set(name, value)
            response.cookies.set(name, value, enhancedOptions)
          })
        },
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    }
  )
}

/**
 * Validate authentication token and get user
 * @returns User object if authenticated, null otherwise
 */
export async function validateAuthToken() {
  try {
    const supabase = createSecureServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.error('Auth validation error:', error?.message || 'No user found')
      return null
    }
    
    return user
  } catch (error) {
    console.error('Token validation error:', error)
    return null
  }
}