"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { supabase } from '@/lib/supabase-client'
import { PRODUCT_CONDITIONS, SUPPORTED_CURRENCIES, convertToStorageAmount } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Upload, X, ImageIcon, Loader2 } from 'lucide-react'
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
    (val) => !val || !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Price per hour must be a positive number'
  ),
  price_per_day: z.string().min(1, 'Price per day is required').refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Price per day must be a positive number'
  ),
  daily_cap_hours: z.string().optional().refine(
    (val) => !val || (!isNaN(parseInt(val)) && parseInt(val) > 0),
    'Daily cap hours must be a positive integer'
  ),
  security_deposit: z.string().optional().refine(
    (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
    'Security deposit must be a non-negative number'
  ),
})

type ProductFormData = z.infer<typeof productSchema>

interface Category {
  id: number
  name: string
  parent_id?: number
}

interface UploadedImage {
  file: File
  preview: string
  uploaded: boolean
  url?: string
  isCover?: boolean
}

export default function NewListingPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [productId, setProductId] = useState<number | null>(null)
  const [step, setStep] = useState<'form' | 'images' | 'publish'>('form')

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

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isLoading, isAuthenticated, router])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()
        if (response.ok) {
          setCategories(data.categories)
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load categories'
          })
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load categories'
        })
      }
    }

    fetchCategories()
  }, [toast])

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploaded: false
    }))
    setImages(prev => [...prev, ...newImages])
  }

  // Remove image
  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev]
      if (newImages[index].preview) {
        URL.revokeObjectURL(newImages[index].preview)
      }
      newImages.splice(index, 1)
      return newImages
    })
  }

  // Set as cover image
  const setCoverImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev]
      // Mark all as non-cover first
      newImages.forEach(img => img.isCover = false)
      // Mark selected as cover
      newImages[index].isCover = true
      return newImages
    })
  }

  // Upload images to Supabase Storage
  const uploadImages = async (productId: number) => {
    const uploadPromises = images.map(async (image, index) => {
      if (image.uploaded) return image

      const fileName = `${Date.now()}-${index}-${image.file.name}`
      const filePath = `${productId}/${fileName}`

      if (!supabase) throw new Error('Supabase client not available')

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, image.file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      // Add to database
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/products/images/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          product_id: productId,
          image_url: data.publicUrl,
          is_cover: image.isCover || index === 0, // First image is cover by default
          display_order: index,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add image to database')
      }

      return { ...image, uploaded: true, url: data.publicUrl }
    })

    const uploadedImages = await Promise.all(uploadPromises)
    setImages(uploadedImages)
  }

  // Submit form
  const onSubmit = async (data: ProductFormData) => {
    if (!user || !supabase) return

    setIsSubmitting(true)
    try {
      // Get session for auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      // Create product
      const response = await fetch('/api/products/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create product')
      }

      setProductId(result.product_id)
      setStep('images')

      toast({
        title: 'Success',
        description: 'Product created! Now add some images.',
      })

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create product',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Upload images step
  const handleImageUpload = async () => {
    if (!productId || images.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please add at least one image',
      })
      return
    }

    setIsSubmitting(true)
    try {
      await uploadImages(productId)
      setStep('publish')
      toast({
        title: 'Success',
        description: 'Images uploaded successfully!',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to upload images',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Publish product
  const handlePublish = async () => {
    if (!productId || !user || !supabase) return

    setIsSubmitting(true)
    try {
      // Get session for auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch(`/api/products/${productId}/publish`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to publish product')
      }

      toast({
        title: 'Success',
        description: 'Product published successfully!',
      })

      router.push('/profile/listings')

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to publish product',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-2xl py-10">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect
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

      {/* Progress indicators */}
      <div className="flex items-center space-x-4 mb-8">
        <div className={`flex items-center space-x-2 ${step === 'form' ? 'text-primary' : step === 'images' || step === 'publish' ? 'text-green-600' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'form' ? 'bg-primary text-primary-foreground' : step === 'images' || step === 'publish' ? 'bg-green-600 text-white' : 'bg-muted'}`}>
            1
          </div>
          <span className="text-sm font-medium">Product Details</span>
        </div>
        <div className={`flex items-center space-x-2 ${step === 'images' ? 'text-primary' : step === 'publish' ? 'text-green-600' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'images' ? 'bg-primary text-primary-foreground' : step === 'publish' ? 'bg-green-600 text-white' : 'bg-muted'}`}>
            2
          </div>
          <span className="text-sm font-medium">Add Images</span>
        </div>
        <div className={`flex items-center space-x-2 ${step === 'publish' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'publish' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            3
          </div>
          <span className="text-sm font-medium">Publish</span>
        </div>
      </div>

      {/* Step 1: Product Form */}
      {step === 'form' && (
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="Enter product title"
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
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
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
                    Creating Product...
                  </>
                ) : (
                  'Continue to Images'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Image Upload */}
      {step === 'images' && (
        <Card>
          <CardHeader>
            <CardTitle>Add Product Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Upload Area */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <div className="space-y-2">
                <Label htmlFor="images" className="text-lg font-medium cursor-pointer">
                  Upload Product Images
                </Label>
                <p className="text-sm text-muted-foreground">
                  Add multiple images to showcase your product
                </p>
              </div>
              <Input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button 
                type="button" 
                variant="outline" 
                className="mt-4"
                onClick={() => document.getElementById('images')?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose Images
              </Button>
            </div>

            {/* Image Preview Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setCoverImage(index)}
                      >
                        {image.isCover ? 'Cover' : 'Set Cover'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {image.isCover && (
                      <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                        Cover
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep('form')}
              >
                Back
              </Button>
              <Button 
                onClick={handleImageUpload} 
                disabled={isSubmitting || images.length === 0}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading Images...
                  </>
                ) : (
                  'Upload Images & Continue'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Publish */}
      {step === 'publish' && (
        <Card>
          <CardHeader>
            <CardTitle>Ready to Publish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Your product is ready!
                </h3>
                <p className="text-green-700">
                  Review everything looks good and publish your product to make it available for rent.
                </p>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep('images')}
              >
                Back
              </Button>
              <Button 
                onClick={handlePublish} 
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  'Publish Product'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}