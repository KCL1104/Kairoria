import { createClient } from '@supabase/supabase-js'
import { Product, ProductImage, Category, Profile } from './data'

// Check if environment variables are available - handle both naming conventions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

// Product-related functions
export async function fetchProducts(options?: {
  limit?: number
  offset?: number
  category_id?: number
  status?: string
  search?: string
}) {
  if (!supabase) throw new Error('Supabase client not available')

  let query = supabase
    .from('products')
    .select(`
      *,
      categories(id, name),
      profiles(id, username, display_name),
      product_images(id, image_url, display_order, is_cover)
    `)
    .eq('status', 'listed')
    .order('created_at', { ascending: false })

  if (options?.category_id) {
    query = query.eq('category_id', options.category_id)
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
    categories: Category
    profiles: Profile
    product_images: ProductImage[]
  })[]
}

export async function fetchProductById(id: number) {
  if (!supabase) throw new Error('Supabase client not available')

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories(id, name),
      profiles(id, username, display_name, profile_image_url),
      product_images(id, image_url, display_order, is_cover)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Product & {
    categories: Category
    profiles: Profile
    product_images: ProductImage[]
  }
}

export async function fetchCategories() {
  if (!supabase) throw new Error('Supabase client not available')

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw error
  return data as Category[]
}

export async function uploadProductImage(
  file: File,
  productId: number,
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
    .select(`
      *,
      categories(id, name),
      product_images(id, image_url, display_order, is_cover)
    `)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as (Product & {
    categories: Category
    product_images: ProductImage[]
  })[]
} 