"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { supabase } from '@/lib/supabase-client'
import { PRODUCT_CONDITIONS, SUPPORTED_CURRENCIES, convertToStorageAmount, getCategoryIcon } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

// Validation schema
const productSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().min(1, 'Description is required'),
  category_id: z.string().min(1, 'Category is required'),
  brand: z.string().max(100, 'Brand must be less than 100 characters').optional(),
  condition: z.enum(['new', 'like_new', 'good', 'used'], {
    required_error: 'Condition is required',
  }),
  location: z.string().min(1, 'Location is required').max(100, 'Location must be less than 100 characters'),
  currency: z.enum(['usdc', 'usdt'], {
    required_error: 'Currency is required',
  }),
  price_per_hour: z.string().optional().refine(
    (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) > 0 && parseFloat(val) <= 9999999999.99),
    'Price per hour must be a positive number not exceeding 9,999,999,999.99'
  ),
  price_per_day: z.string().min(1, 'Price per day is required').refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0 && parseFloat(val) <= 9999999999.99,
    'Price per day must be a positive number not exceeding 9,999,999,999.99'
  ),
  daily_cap_hours: z.string().optional().refine(
    (val) => !val || (!isNaN(parseInt(val)) && parseInt(val) > 0),
    'Daily cap hours must be a positive integer'
  ),
  security_deposit: z.string().optional().refine(
    (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 9999999999.99),
    'Security deposit must be a non-negative number not exceeding 9,999,999,999.99'
  ),
})

type ProductFormData = z.infer<typeof productSchema>

interface Category {
  id: number
  name: string
  parent_id?: number
}

// Basic categories as fallback if API fails
const BASIC_CATEGORIES: Category[] = [
  { id: 1, name: 'Electronics' },
  { id: 2, name: 'Tools' },
  { id: 3, name: 'Outdoor Gear' },
  { id: 4, name: 'Home Goods' },
  { id: 5, name: 'Sports' },
  { id: 6, name: 'Vehicles' },
  { id: 7, name: 'Clothing' },
  { id: 8, name: 'Musical Instruments' },
  { id: 9, name: 'Garden' },
  { id: 10, name: 'Photography' },
  { id: 11, name: 'Books' },
  { id: 12, name: 'Toys & Games' },
  { id: 13, name: 'Art & Crafts' },
  { id: 14, name: 'Kitchen' },
  { id: 15, name: 'Fitness' },
  { id: 16, name: 'Party & Celebration' },
]

// DEMO MODE: Removed image handling interfaces

export default function NewListingPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [productId, setProductId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  })

  // DEMO MODE: Simplified auth check
  useEffect(() => {
    if (!isLoading && !user) {
      console.log('DEMO MODE: No user found, but allowing access for demo')
      // In demo mode, we'll allow access even without proper auth
    }
  }, [isLoading, user])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
              const response = await fetch('/api/categories', {
        headers: {
          'Accept': 'application/json',
        },
      })
      const data = await response.json()
        if (response.ok && data.categories && data.categories.length > 0) {
          setCategories(data.categories)
        } else {
          // Use basic categories as fallback
          setCategories(BASIC_CATEGORIES)
          console.log('Using fallback categories')
        }
      } catch (error) {
        // Use basic categories as fallback
        setCategories(BASIC_CATEGORIES)
        console.log('Error fetching categories, using fallback:', error)
      }
    }

    fetchCategories()
  }, [toast])

  // DEMO MODE: Removed image handling functions

  // Submit form
  const onSubmit = async (data: ProductFormData) => {
    console.log('Form submission started with data:', data)
    setIsSubmitting(true)
    try {
      // DEMO MODE: More flexible session handling
      let session: any = null
      if (supabase) {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        session = currentSession
      }
      console.log('Session check:', { hasSession: !!session, hasAccessToken: !!session?.access_token })

      console.log('Making API request to /api/products/create')
      // Create product with flexible auth headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const response = await fetch('/api/products/create', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })

      console.log('API response status:', response.status)
      console.log('API response headers:', Object.fromEntries(response.headers.entries()))
      
      const result = await response.json()
      console.log('API response data:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create product')
      }

      setProductId(result.product_id)
      
      // DEMO MODE: Skip to publish step immediately for smoother demo experience
      toast({
        title: 'Success',
        description: 'Product created! Let\'s publish it.',
      })
      
      // Auto-publish for demo
      setTimeout(async () => {
        try {
          // Publish the product immediately
          const publishHeaders: Record<string, string> = {
            'Accept': 'application/json',
          }
          
          if (session?.access_token) {
            publishHeaders['Authorization'] = `Bearer ${session.access_token}`
          }
          
          const publishResponse = await fetch(`/api/products/${result.product_id}/publish`, {
            method: 'PUT',
            headers: publishHeaders,
          })

          if (publishResponse.ok) {
            toast({
              title: 'Success!',
              description: 'Product published successfully!',
            })
            router.push('/profile/listings')
          } else {
            // If publish fails, still show success and redirect
            toast({
              title: 'Product Created',
              description: 'Product created successfully! You can publish it later.',
            })
            router.push('/profile/listings')
          }
        } catch (error) {
          console.error('Auto-publish failed:', error)
          toast({
            title: 'Product Created',
            description: 'Product created successfully! You can publish it later.',
          })
          router.push('/profile/listings')
        }
      }, 1000)  // 1 second delay for better UX

    } catch (error) {
      console.error('Form submission error:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create product',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // DEMO MODE: Removed separate image upload and publish functions

  // DEMO MODE: Show loading only briefly, then allow access
  if (isLoading && !user) {
    return (
      <div className="container max-w-2xl py-10">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-10">
      {/* Header */}
      <div className="mb-8">
        <Link href="/profile/listings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Listings
        </Link>
        <h1 className="text-3xl font-bold">List New Item</h1>
        <p className="text-muted-foreground mt-2">
          Share your items with the community and earn passive income
        </p>
      </div>

      {/* DEMO MODE: Simplified progress - just show single step */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-2 text-primary">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
            1
          </div>
          <span className="text-sm font-medium">Create & Publish Product</span>
        </div>
      </div>

      {/* DEMO MODE: Always show the form, remove step conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
          <p className="text-sm text-muted-foreground">Fill out the details and we'll publish your item automatically!</p>
        </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Product Name */}
              <div className="space-y-2">
                <Label htmlFor="title">Product Name *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="Enter your product name"
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  rows={4}
                  {...register('description')}
                  placeholder="Describe your product in detail"
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              {/* Category and Brand */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category_id">Category *</Label>
                  <Select onValueChange={(value) => setValue('category_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getCategoryIcon(category.name)}</span>
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category_id && (
                    <p className="text-sm text-destructive">{errors.category_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    {...register('brand')}
                    placeholder="Enter brand name"
                  />
                  {errors.brand && (
                    <p className="text-sm text-destructive">{errors.brand.message}</p>
                  )}
                </div>
              </div>

              {/* Condition and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition *</Label>
                  <Select onValueChange={(value) => setValue('condition', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CONDITIONS.map((condition) => (
                        <SelectItem key={condition.value} value={condition.value}>
                          {condition.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.condition && (
                    <p className="text-sm text-destructive">{errors.condition.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    {...register('location')}
                    placeholder="Enter location"
                  />
                  {errors.location && (
                    <p className="text-sm text-destructive">{errors.location.message}</p>
                  )}
                </div>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select onValueChange={(value) => setValue('currency', value as any)}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currency && (
                  <p className="text-sm text-destructive">{errors.currency.message}</p>
                )}
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_per_day">Price per Day *</Label>
                  <Input
                    id="price_per_day"
                    type="number"
                    step="0.01"
                    min="0"
                    max="9999999999.99"
                    {...register('price_per_day')}
                    placeholder="0.00"
                  />
                  {errors.price_per_day && (
                    <p className="text-sm text-destructive">{errors.price_per_day.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price_per_hour">Price per Hour</Label>
                  <Input
                    id="price_per_hour"
                    type="number"
                    step="0.01"
                    min="0"
                    max="9999999999.99"
                    {...register('price_per_hour')}
                    placeholder="0.00"
                  />
                  {errors.price_per_hour && (
                    <p className="text-sm text-destructive">{errors.price_per_hour.message}</p>
                  )}
                </div>
              </div>

              {/* Additional Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="security_deposit">Security Deposit</Label>
                  <Input
                    id="security_deposit"
                    type="number"
                    step="0.01"
                    min="0"
                    max="9999999999.99"
                    {...register('security_deposit')}
                    placeholder="0.00"
                  />
                  {errors.security_deposit && (
                    <p className="text-sm text-destructive">{errors.security_deposit.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="daily_cap_hours">Daily Cap (Hours)</Label>
                  <Input
                    id="daily_cap_hours"
                    type="number"
                    min="1"
                    {...register('daily_cap_hours')}
                    placeholder="24"
                  />
                  {errors.daily_cap_hours && (
                    <p className="text-sm text-destructive">{errors.daily_cap_hours.message}</p>
                  )}
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating & Publishing...
                  </>
                ) : (
                  'Create & Publish Product'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
    </div>
  )
}