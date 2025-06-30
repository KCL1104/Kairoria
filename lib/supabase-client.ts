import { createBrowserClient } from '@supabase/ssr'
import { AuthDebugger } from './auth-debug'
import { getSupabaseCookieNames } from './supabase-cookies'
import { Product, Profile, ProductImage } from './data'

// Client-side Supabase client using @supabase/ssr
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug logging for environment variables
if (typeof window !== 'undefined') {
  console.log('🔧 Supabase Client Initialization')
  console.log('Supabase Environment Check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlStart: supabaseUrl?.substring(0, 20),
    keyStart: supabaseAnonKey?.substring(0, 20)
  })
  
  // Log initial auth state
  setTimeout(() => AuthDebugger.logAuthState('Client Initialization'), 1000)
}

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : null

if (!supabase && typeof window !== 'undefined') {
  console.error('Supabase client could not be initialized. Check your environment variables.')
}

// Product-related functions
export async function fetchProducts(options?: {
  limit?: number
  page?: number
  category?: string
  search?: string
}, retryCount = 0): Promise<{ products: (Product & {
  categories: { id: number; name: string }
  owner: Profile
  product_images: ProductImage[]
})[], count: number }> {
  if (!supabase) {
    console.error('Supabase client not available')
    return { products: [], count: 0 }
  }

  console.log('Fetching products with options:', options, `(attempt ${retryCount + 1})`)

  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('products')
      .select(`
        *,
        categories(id, name),
        owner:profiles!owner_id(id, full_name, avatar_url),
        product_images(id, image_url, display_order, is_cover)
      `, { count: 'exact' })
      .eq('status', 'listed')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (options?.category) {
      query = query.eq('category_id', options.category)
    }

    if (options?.search) {
      query = query.or(`title.ilike.%${options.search}%, description.ilike.%${options.search}%`)
    }

    console.log('Executing product query...')
    
    // Execute query with AbortController for better timeout handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 30000) // 30 second timeout
    
    // Apply abort signal to the query
    query = query.abortSignal(controller.signal)
    
    const { data, error, count } = await query
    clearTimeout(timeoutId)

    if (error) {
      console.error('Product query error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      
      // Retry logic for certain errors
      if (retryCount < 2 && (error.code === 'PGRST301' || error.message?.includes('timeout'))) {
        console.log(`Retrying product fetch... (attempt ${retryCount + 2})`)
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))) // Exponential backoff
        return fetchProducts(options, retryCount + 1)
      }
      
      throw new Error(`Failed to fetch products: ${error.message}`)
    }
    
    console.log('Products fetched successfully:', data?.length || 0, 'items')
    return {
      products: (data || []) as (Product & {
        categories: { id: number; name: string }
        owner: Profile
        product_images: ProductImage[]
      })[],
      count: count || 0
    }
  } catch (error: any) {
    console.error('Unexpected error in fetchProducts:', error)
    
    // Retry on network errors
    if (retryCount < 2 && (error.name === 'AbortError' || error.message?.includes('fetch'))) {
      console.log(`Retrying product fetch after error... (attempt ${retryCount + 2})`)
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
      return fetchProducts(options, retryCount + 1)
    }
    
    // Re-throw the error to be handled by the caller
    throw error
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
    
    // Determine the base URL for server-side rendering
    const baseUrl = typeof window === 'undefined' 
      ? process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      : ''
    
    const response = await fetch(`${baseUrl}/api/categories`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('Categories API response not ok:', response.status, response.statusText)
      // Throw an error with detailed response information
      throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Categories API response:', data)
    
    // Extract category names from the response
    const categoryNames = (data.categories || []).map((cat: any) => cat.name)
    return categoryNames
  } catch (error) {
    console.error('Error fetching categories:', error)
    // Re-throw the error so it can be caught by React Query or other data fetching libraries
    throw error
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