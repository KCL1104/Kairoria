"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { supabase } from '@/lib/supabase-client'
import { PRODUCT_CONDITIONS, SUPPORTED_CURRENCIES, getCategoryIcon } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Loader2, Upload, X, ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

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
}

interface UploadedImage {
  file: File
  preview: string
  isCover?: boolean
}

export default function NewListingPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  })

  // Authentication check
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in to create a listing.',
      })
      router.push('/auth/login')
    }
  }, [isLoading, user, toast, router])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        if (!response.ok) throw new Error('Failed to fetch categories')
        const data = await response.json()
        if (data.categories?.length > 0) {
          setCategories(data.categories)
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load categories. Please try again later.',
        })
      }
    }
    fetchCategories()
  }, [toast])

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (images.length + files.length > 10) {
      toast({
        variant: 'destructive',
        title: 'Too many images',
        description: 'You can upload a maximum of 10 images.',
      })
      return
    }
    const newImages = files.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      isCover: images.length === 0 && index === 0, // Make first image the cover
    }))
    setImages(prev => [...prev, ...newImages])
  }

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev]
      URL.revokeObjectURL(newImages[index].preview)
      const wasCover = newImages[index].isCover
      newImages.splice(index, 1)
      // If the removed image was the cover, make the new first image the cover
      if (wasCover && newImages.length > 0) {
        newImages[0].isCover = true
      }
      return newImages
    })
  }

  const setCoverImage = (index: number) => {
    setImages(currentImages => {
      if (index < 0 || index >= currentImages.length) {
        return currentImages;
      }
      // Move the selected image to the front of the array to mark it as the cover.
      // The backend expects the first image in the FormData to be the cover.
      const newImages = [...currentImages];
      const [selectedImage] = newImages.splice(index, 1);
      newImages.unshift(selectedImage);
      // Update the isCover flag for all images for consistent UI state.
      return newImages.map((image, i) => ({ ...image, isCover: i === 0 }));
    });
  }

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true)
    setError(null)

    if (!supabase) {
      const errorMessage = "Supabase client is not initialized."
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `${errorMessage} Please try again later.`,
      });
      setIsSubmitting(false);
      return;
    }
    
    if (images.length === 0) {
      setError("At least one image is required.");
      toast({
        variant: 'destructive',
        title: 'Missing Image',
        description: 'Please upload at least one image for the listing.',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      toast({ title: 'Submitting...', description: 'Your new listing is being created.' })

      // Use a UUID for the new product. This is generated client-side
      // so the Edge Function knows the ID before inserting the product.
      const productId = crypto.randomUUID()

      // Prepare the form data to send to the Edge Function.
      const formData = new FormData()
      formData.append('productData', JSON.stringify({ ...data, id: productId }))
      images.forEach(image => {
        formData.append('images', image.file, image.file.name)
      })

      // Invoke the 'create-product' Edge Function.
      const { data: responseData, error: functionError } = await supabase.functions.invoke(
        'create-product',
        { body: formData }
      )

      if (functionError) {
        throw new Error(functionError.message)
      }

      toast({
        title: 'Published!',
        description: 'Your new listing is now live.',
      })
      router.push('/profile/listings')

    } catch (err: any) {
      setError(err.message)
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: err.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <Link href="/profile/listings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Listings
        </Link>
        <h1 className="text-3xl font-bold">List New Item</h1>
        <p className="text-muted-foreground mt-2">
          Fill out the details below to share your item with the community.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Product Name *</Label>
              <Input id="title" {...register('title')} placeholder="e.g., Professional DSLR Camera" />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" rows={5} {...register('description')} placeholder="Describe your item, its features, and any accessories included." />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select onValueChange={(value) => setValue('category_id', value)} {...register('category_id')}>
                  <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCategoryIcon(cat.name)}</span>
                          <span>{cat.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category_id && <p className="text-sm text-destructive">{errors.category_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" {...register('brand')} placeholder="e.g., Canon, Sony" />
                {errors.brand && <p className="text-sm text-destructive">{errors.brand.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Condition *</Label>
                <Select onValueChange={(value) => setValue('condition', value as any)} {...register('condition')}>
                  <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CONDITIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.condition && <p className="text-sm text-destructive">{errors.condition.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input id="location" {...register('location')} placeholder="e.g., San Francisco, CA" />
                {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Pricing Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Currency *</Label>
                <Select onValueChange={(value) => setValue('currency', value as any)} {...register('currency')}>
                  <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currency && <p className="text-sm text-destructive">{errors.currency.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_per_day">Price Per Day *</Label>
                <Input id="price_per_day" type="number" step="0.01" {...register('price_per_day')} placeholder="e.g., 50.00" />
                {errors.price_per_day && <p className="text-sm text-destructive">{errors.price_per_day.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price_per_hour">Price Per Hour</Label>
                <Input id="price_per_hour" type="number" step="0.01" {...register('price_per_hour')} placeholder="e.g., 10.00" />
                {errors.price_per_hour && <p className="text-sm text-destructive">{errors.price_per_hour.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="security_deposit">Security Deposit</Label>
                <Input id="security_deposit" type="number" step="0.01" {...register('security_deposit')} placeholder="e.g., 100.00" />
                {errors.security_deposit && <p className="text-sm text-destructive">{errors.security_deposit.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Upload Images</CardTitle>
            <p className="text-sm text-muted-foreground">Add up to 10 high-quality images. The first image will be the cover.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group aspect-square">
                  <img src={image.preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                    <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setCoverImage(index)}>
                      <ImageIcon className={`h-4 w-4 ${image.isCover ? 'text-yellow-400' : ''}`} />
                    </Button>
                    <Button type="button" variant="destructive" size="icon" className="h-8 w-8" onClick={() => removeImage(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {image.isCover && (
                    <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">Cover</div>
                  )}
                </div>
              ))}
              {images.length < 10 && (
                <Label htmlFor="image-upload" className="cursor-pointer aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-lg hover:bg-muted">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="mt-2 text-sm text-muted-foreground">Upload</span>
                  <Input id="image-upload" type="file" multiple accept="image/*" className="sr-only" onChange={handleImageSelect} />
                </Label>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto ml-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Create & Publish Listing'
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}