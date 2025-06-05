// Product types based on database schema
export interface Product {
  id: string // UUID
  title: string
  description: string
  price: number // DECIMAL(10,2)
  period: 'hour' | 'day' | 'week' | 'month'
  category: string
  location: string
  images: string[] // TEXT[]
  owner_id: string // UUID
  is_available: boolean
  rating: number // DECIMAL(3,2)
  review_count: number
  features: string[] // TEXT[]
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string // UUID - references auth.users(id)
  full_name?: string
  email: string
  avatar_url?: string
  phone?: string
  bio?: string
  location?: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string // UUID
  product_id: string // UUID
  renter_id: string // UUID
  owner_id: string // UUID
  start_date: string // TIMESTAMP WITH TIME ZONE
  end_date: string // TIMESTAMP WITH TIME ZONE
  total_price: number // DECIMAL(10,2)
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  payment_intent_id?: string
  created_at: string
  updated_at: string
}

export interface Review {
  id: string // UUID
  product_id: string // UUID
  booking_id: string // UUID
  reviewer_id: string // UUID
  rating: number // INTEGER 1-5
  comment?: string
  created_at: string
}

export interface Message {
  id: string // UUID
  conversation_id: string // UUID
  sender_id: string // UUID
  recipient_id: string // UUID
  product_id?: string // UUID (nullable)
  content: string
  is_read: boolean
  created_at: string
}

export interface Conversation {
  id: string // UUID
  participant_1: string // UUID
  participant_2: string // UUID
  product_id?: string // UUID (nullable)
  last_message_at: string
  created_at: string
}

// Product period options
export const PRODUCT_PERIODS = [
  { value: 'hour', label: 'Hour' },
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
] as const

// Booking status options
export const BOOKING_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

// Default categories with icons for UI display
export const DEFAULT_CATEGORY_ICONS: Record<string, string> = {
  'Electronics': '📱',
  'Tools': '🔧',
  'Outdoor Gear': '⛺',
  'Home Goods': '🪑',
  'Sports': '⚽',
  'Vehicles': '🚗',
  'Clothing': '👕',
  'Musical Instruments': '🎸',
  'Garden': '🌷',
  'Photography': '📷',
  'Events': '🎭',
  'Books': '📚',
  'Toys & Games': '🎮',
  'Art & Crafts': '🎨',
  'Kitchen': '🍳',
  'Fitness': '💪',
  'Party & Celebration': '🎉',
}

// Helper function to get category icon
export function getCategoryIcon(categoryName: string): string {
  return DEFAULT_CATEGORY_ICONS[categoryName] || '📦'
}