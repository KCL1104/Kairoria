import { createClient } from '@supabase/supabase-js'
import { Product, Profile, ProductImage } from './data'

// Check if environment variables are available - handle both naming conventions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

// Product-related functions
export async function fetchProducts(options?: {
  limit?: number
  offset?: number
  category?: string
  search?: string
}) {
  if (!supabase) throw new Error('Supabase client not available')

  let query = supabase
    .from('products')
    .select(`
      *,
      profiles(id, full_name, avatar_url)
    `)
    .eq('is_available', true)
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

  const { data, error } = await query

  if (error) throw error
  return data as (Product & {
    profiles: Profile
  })[]
}

export async function fetchProductById(id: string) {
  if (!supabase) throw new Error('Supabase client not available')

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories(id, name),
      profiles(id, full_name, username, display_name, avatar_url, profile_image_url, location, is_verified),
      product_images(id, image_url, display_order, is_cover)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Product & {
    categories: { id: number; name: string }
    profiles: Profile
    product_images: ProductImage[]
  }
}

export async function fetchUniqueCategories() {
  if (!supabase) throw new Error('Supabase client not available')

  const { data, error } = await supabase
    .from('products')
    .select('category')
    .eq('is_available', true)

  if (error) throw error
  
  // Get unique categories
  const categorySet = new Set(data.map(item => item.category))
  const uniqueCategories = Array.from(categorySet)
  return uniqueCategories.filter(Boolean) // Remove any null/undefined values
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