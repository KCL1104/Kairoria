import { createClient } from '@supabase/supabase-js'
import { Product, Profile, ProductImage } from './data'

// Client-side Supabase client (no server imports)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug logging for environment variables
if (typeof window !== 'undefined') {
  console.log('Supabase Environment Check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlStart: supabaseUrl?.substring(0, 20),
    keyStart: supabaseAnonKey?.substring(0, 20)
  })
}

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Set session to persist for 1 month (30 days)
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? {
          getItem: (key: string) => {
            // Try to get from cookies first, then localStorage
            if (typeof document !== 'undefined') {
              const cookies = document.cookie.split(';')
              const cookie = cookies.find(c => c.trim().startsWith(`${key}=`))
              if (cookie) {
                return cookie.split('=')[1]
              }
            }
            return localStorage.getItem(key)
          },
          setItem: (key: string, value: string) => {
            // Set both in localStorage and cookies
            localStorage.setItem(key, value)
            if (typeof document !== 'undefined') {
              // Set cookie with proper attributes
              const maxAge = 30 * 24 * 60 * 60 // 30 days in seconds
              document.cookie = `${key}=${value}; path=/; max-age=${maxAge}; SameSite=Lax; Secure=${window.location.protocol === 'https:'}`
            }
          },
          removeItem: (key: string) => {
            localStorage.removeItem(key)
            if (typeof document !== 'undefined') {
              // Remove cookie by setting it to expire
              document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
            }
          }
        } : undefined
      }
    }) 
  : null

if (!supabase && typeof window !== 'undefined') {
  console.error('Supabase client could not be initialized. Check your environment variables.')
}

// Product-related functions
export async function fetchProducts(options?: {
  limit?: number
  offset?: number
  category?: string
  search?: string
}) {
  if (!supabase) {
    console.error('Supabase client not available')
    return []
  }

  console.log('Fetching products with options:', options)

  try {
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Product fetch timeout')), 10000)
    })

    let query = supabase
      .from('products')
      .select(`
        *,
        categories(id, name),
        owner:profiles!owner_id(id, full_name, avatar_url),
        product_images(id, image_url, display_order, is_cover)
      `)
      .eq('status', 'listed')
      .order('created_at', { ascending: false })

    if (options?.category) {
      query = query.eq('category', options.category)
    }

    if (options?.search) {
      query = query.or(`title.ilike.%${options.search}%, description.ilike.%${options.search}%`)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    console.log('Executing product query...')
    
    // Race between the query and timeout
    const { data, error } = await Promise.race([
      query,
      timeoutPromise
    ]) as any

    if (error) {
      console.error('Product query error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return []
    }
    
    console.log('Products fetched successfully:', data)
    return (data || []) as (Product & {
      categories: { id: number; name: string }
      owner: Profile
      product_images: ProductImage[]
    })[]
  } catch (error) {
    console.error('Unexpected error in fetchProducts:', error)
    return []
  }
}

export async function fetchProductById(id: string) {
  if (!supabase) throw new Error('Supabase client not available')

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories(id, name),
      owner:profiles!owner_id(id, full_name, avatar_url, location, is_email_verified, is_phone_verified),
      product_images(id, image_url, display_order, is_cover)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Product & {
    categories: { id: number; name: string }
    owner: Profile
    product_images: ProductImage[]
  }
}

export async function fetchUniqueCategories() {
  try {
    console.log('Fetching categories from API...')
    
    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout
    
    const response = await fetch('/api/categories', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('Categories API response not ok:', response.status, response.statusText)
      return [] // Return empty array instead of throwing
    }

    const data = await response.json()
    console.log('Categories API response:', data)
    
    // Extract category names from the response
    const categoryNames = (data.categories || []).map((cat: any) => cat.name)
    return categoryNames
  } catch (error) {
    console.error('Error fetching categories:', error)
    // Return empty array instead of throwing to prevent loading hang
    return []
  }
}

export async function uploadProductImage(
  file: File,
  productId: string,
  fileName: string
): Promise<string> {
  if (!supabase) throw new Error('Supabase client not available')

  const filePath = `${productId}/${fileName}`
  
  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, file)

  if (uploadError) throw uploadError

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath)

  return data.publicUrl
}

export async function fetchUserProducts(userId: string) {
  if (!supabase) throw new Error('Supabase client not available')

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Product[]
}