import { createClient } from '@supabase/supabase-js'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Client-side Supabase client
export const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  : null

// Server-side Supabase client with service role (for admin operations)
export const supabaseAdmin = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
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
    return createServerComponentClient({ cookies })
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