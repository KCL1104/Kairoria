/**
 * Server-side authentication utilities for Supabase Auth
 * This file uses next/headers and should only be imported in Server Components
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_OPTIONS, isTokenTooLong, isValidJWT } from './auth-utils'

/**
 * Create a Supabase server client with secure cookie handling
 * @param response Optional NextResponse object for API routes to set cookies
 */
export function createSecureServerClient(response?: any) {
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
              domain: undefined, // Remove domain to ensure cookies work on all environments
              // Set 1-hour session for access token, keep refresh token longer
              maxAge: name.includes('refresh') 
                ? 60 * 60 * 24 * 30 // 30 days for refresh token
                : 60 * 60           // 1 hour for access token
            }
            
            // Check token length and split if necessary (cookie size limit ~4KB)
            const MAX_COOKIE_SIZE = 3800 // Leave some buffer for cookie metadata
            
            if (value && value.length > MAX_COOKIE_SIZE && name.includes('auth-token')) {
              console.log(`🍪 Token too long (${value.length} chars), splitting into chunks for ${name}`)
              
              // Split the token into chunks
              const chunks = []
              for (let i = 0; i < value.length; i += MAX_COOKIE_SIZE) {
                chunks.push(value.substring(i, i + MAX_COOKIE_SIZE))
              }
              
              // Set each chunk as a separate cookie
              chunks.forEach((chunk, index) => {
                const chunkName = `${name}.${index}`
                cookieStore.set(chunkName, chunk, enhancedOptions)
                
                if (response && response.cookies) {
                  response.cookies.set(chunkName, chunk, enhancedOptions)
                }
              })
              
              console.log(`🍪 Split ${name} into ${chunks.length} chunks`)
            } else {
              // Normal cookie setting for tokens under size limit
              cookieStore.set(name, value, enhancedOptions)
              
              // Also set on response object if provided (for API routes)
              if (response && response.cookies) {
                response.cookies.set(name, value, enhancedOptions)
              }
            }
          })
        },
      },
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
              domain: undefined, // Remove domain to ensure cookies work on all environments
              // Set 1-hour session for access token, keep refresh token longer
              maxAge: name.includes('refresh') 
                ? 60 * 60 * 24 * 30 // 30 days for refresh token
                : 60 * 60           // 1 hour for access token
            }
            
            // Check token length and split if necessary (cookie size limit ~4KB)
            const MAX_COOKIE_SIZE = 3800 // Leave some buffer for cookie metadata
            
            if (value && value.length > MAX_COOKIE_SIZE && name.includes('auth-token')) {
              console.log(`🍪 Token too long (${value.length} chars), splitting into chunks for ${name}`)
              
              // Split the token into chunks
              const chunks = []
              for (let i = 0; i < value.length; i += MAX_COOKIE_SIZE) {
                chunks.push(value.substring(i, i + MAX_COOKIE_SIZE))
              }
              
              // Set each chunk as a separate cookie
              chunks.forEach((chunk, index) => {
                const chunkName = `${name}.${index}`
                request.cookies.set(chunkName, chunk)
                response.cookies.set(chunkName, chunk, enhancedOptions)
              })
              
              console.log(`🍪 Split ${name} into ${chunks.length} chunks`)
            } else {
              // Normal cookie setting for tokens under size limit
              request.cookies.set(name, value)
              response.cookies.set(name, value, enhancedOptions)
            }
          })
        },
      },
    }
  )
}

/**
 * Validate authentication token and get user
 * @returns User object if authenticated, null otherwise
 */
export async function validateAuthToken() {
  try {
    // Pre-check: Get access token from cookies to validate length and format
    const cookieStore = cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value
    
    if (accessToken) {
      // Check token length first
      if (isTokenTooLong(accessToken)) {
        console.log(`🔍 Access token is long (${accessToken.length} chars), checking if chunked...`)
      }
      
      // Validate JWT format
      if (!isValidJWT(accessToken)) {
        console.warn('⚠️ Invalid JWT format detected, token may be corrupted or chunked')
        // Continue with Supabase validation as it might handle chunked tokens
      } else {
        console.log('✅ Token format validation passed')
      }
    }
    
    const supabase = createSecureServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.error('Auth validation error:', error?.message || 'No user found')
      return null
    }
    
    console.log('✅ Token validation successful for user:', user.id)
    return user
  } catch (error) {
    console.error('Token validation error:', error)
    return null
  }
}