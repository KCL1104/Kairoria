// Product types based on database schema
export interface Product {
  id: number // Changed from string to number to match database
  title: string
  description: string
  price_per_day: number // Changed from string to number for DECIMAL fields
  price_per_hour?: number // Changed from string to number for DECIMAL fields
  daily_cap_hours?: number // INTEGER, nullable
  security_deposit: number // Changed from string to number for DECIMAL fields
  category_id: number
  brand?: string
  condition: 'new' | 'like_new' | 'good' | 'used'
  location: string
  currency: 'usdc' | 'usdt'
  owner_id: string // UUID
  status: 'pending' | 'listed' | 'unlisted'
  average_rating: number // DECIMAL(3,2)
  review_count: number
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string // UUID
  product_id: number // Changed to match Product.id type
  image_url: string
  display_order: number
  is_cover: boolean
  created_at: string
}

export interface Category {
  id: number
  name: string
  parent_id?: number
  icon?: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string // UUID - references auth.users(id)
  full_name?: string
  username?: string
  display_name?: string
  email: string
  avatar_url?: string
  profile_image_url?: string
  phone?: string
  bio?: string
  location?: string
  is_email_verified: boolean
  is_phone_verified: boolean
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string // UUID
  product_id: number // Changed to match Product.id type
  renter_id: string // UUID
  owner_id: string // UUID
  start_date: string // TIMESTAMP WITH TIME ZONE
  end_date: string // TIMESTAMP WITH TIME ZONE
  total_price: number // DECIMAL(12,2)
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  payment_intent_id?: string
  created_at: string
  updated_at: string
}

export interface Review {
  id: string // UUID
  product_id: number // Changed to match Product.id type
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
  product_id?: number // Changed to match Product.id type
  content: string
  is_read: boolean
  created_at: string
}

export interface Conversation {
  id: string // UUID
  participant_1: string // UUID
  participant_2: string // UUID
  product_id?: number // Changed to match Product.id type
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

// Product condition options
export const PRODUCT_CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'used', label: 'Used' },
] as const

// Supported currencies
export const SUPPORTED_CURRENCIES = [
  { value: 'usdc', label: 'USDC' },
  { value: 'usdt', label: 'USDT' },
] as const

// Storage amount conversion functions (for handling decimal to bigint conversion)
// Note: These are kept for backward compatibility but may not be needed with DECIMAL fields
const STORAGE_DECIMALS = 6 // 6 decimal places

export function convertToStorageAmount(decimalAmount: number): string {
  return Math.floor(decimalAmount * Math.pow(10, STORAGE_DECIMALS)).toString()
}

export function convertFromStorageAmount(storageAmount: string | number): number {
  const amount = typeof storageAmount === 'string' ? parseInt(storageAmount) : storageAmount
  return amount / Math.pow(10, STORAGE_DECIMALS)
}

// Categories for filtering
export const categories = [
  { id: "all", name: "All Categories", icon: "🏷️" },
  { id: "electronics", name: "Electronics", icon: "📱" },
  { id: "tools", name: "Tools", icon: "🔧" },
  { id: "outdoor", name: "Outdoor Gear", icon: "⛺" },
  { id: "home", name: "Home Goods", icon: "🪑" },
  { id: "sports", name: "Sports", icon: "⚽" },
  { id: "vehicles", name: "Vehicles", icon: "🚗" },
  { id: "clothing", name: "Clothing", icon: "👕" },
  { id: "music", name: "Musical Instruments", icon: "🎸" },
  { id: "garden", name: "Garden", icon: "🌷" },
  { id: "photography", name: "Photography", icon: "📷" },
  { id: "events", name: "Events", icon: "🎭" },
  { id: "books", name: "Books", icon: "📚" },
  { id: "toys", name: "Toys & Games", icon: "🎮" },
  { id: "art", name: "Art & Crafts", icon: "🎨" },
  { id: "kitchen", name: "Kitchen", icon: "🍳" },
  { id: "fitness", name: "Fitness", icon: "💪" },
  { id: "party", name: "Party & Celebration", icon: "🎉" },
]