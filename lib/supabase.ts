import { createClient } from '@supabase/supabase-js'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Product, ProductImage, Category, Profile } from './data'

// Get Supabase URL - check both naming conventions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Client-side Supabase client
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Server-side Supabase client with service role (for admin operations)
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null

// Server component client (uses cookies for auth)
export const createServerSupabaseClient = () => {
  try {
    if (supabaseUrl && supabaseAnonKey) {
      return createServerComponentClient({ cookies })
    } else {
      console.warn('Supabase environment variables not configured')
      return null
    }
  } catch (error) {
    console.warn('Supabase environment variables not configured')
    return null
  }
}

// Database Types (you'll generate these from your Supabase schema)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          title: string
          description: string
          price: number
          period: string
          category: string
          location: string
          images: string[]
          owner_id: string
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          price: number
          period: string
          category: string
          location: string
          images?: string[]
          owner_id: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          price?: number
          period?: string
          category?: string
          location?: string
          images?: string[]
          owner_id?: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          product_id: string
          renter_id: string
          owner_id: string
          start_date: string
          end_date: string
          total_price: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          renter_id: string
          owner_id: string
          start_date: string
          end_date: string
          total_price: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          renter_id?: string
          owner_id?: string
          start_date?: string
          end_date?: string
          total_price?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

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

export async function createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'average_rating' | 'review_count'>) {
  if (!supabase) throw new Error('Supabase client not available')

  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select()
    .single()

  if (error) throw error
  return data as Product
}

export async function updateProduct(id: number, updates: Partial<Product>) {
  if (!supabase) throw new Error('Supabase client not available')

  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Product
}

export async function addProductImage(imageData: Omit<ProductImage, 'id'>) {
  if (!supabase) throw new Error('Supabase client not available')

  const { data, error } = await supabase
    .from('product_images')
    .insert([imageData])
    .select()
    .single()

  if (error) throw error
  return data as ProductImage
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

export async function deleteProductImage(imageId: number) {
  if (!supabase) throw new Error('Supabase client not available')

  const { error } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId)

  if (error) throw error
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