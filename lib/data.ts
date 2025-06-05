// Product types based on database schema
export interface Product {
  id: number
  owner_id: string
  category_id: number
  title: string
  description: string
  brand?: string
  condition: 'new' | 'like_new' | 'good' | 'used'
  location: string
  currency: 'usdc' | 'usdt'
  price_per_hour?: number
  price_per_day: number
  daily_cap_hours?: number
  security_deposit: number
  status: 'pending' | 'listed' | 'unlisted' | 'rented'
  average_rating: number
  review_count: number
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: number
  product_id: number
  image_url: string
  display_order: number
  is_cover: boolean
}

export interface Category {
  id: number
  name: string
  parent_id?: number
}

export interface Profile {
  id: string
  username: string
  display_name: string
  bio?: string
  profile_image_url?: string
  location?: string
  phone_number?: string
  email_verified: boolean
  phone_verified: boolean
  identity_status: 'unverified' | 'pending' | 'verified'
  updated_at: string
}

// Currency conversion utilities
export const CURRENCY_DECIMALS = 6 // USDC/USDT have 6 decimal places

export function convertToStorageAmount(decimalAmount: number): number {
  return Math.round(decimalAmount * Math.pow(10, CURRENCY_DECIMALS))
}

export function convertFromStorageAmount(storageAmount: number): number {
  return storageAmount / Math.pow(10, CURRENCY_DECIMALS)
}

// Product conditions
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

// Product status options
export const PRODUCT_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'listed', label: 'Listed' },
  { value: 'unlisted', label: 'Unlisted' },
  { value: 'rented', label: 'Rented' },
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