"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '../../../../contexts/SupabaseAuthContext'
import { supabase } from '../../../../lib/supabase-client'
import { getCategoryIcon } from '../../../../lib/data'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Textarea } from '../../../../components/ui/textarea'
import { Label } from '../../../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { useToast } from '../../../../hooks/use-toast'
import { ArrowLeft, Loader2, Upload, X, ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '../../../../components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { createClient } from '../../../../lib/supabase/client'
import { LocationAutocomplete } from '../../../../components/ui/location-autocomplete'
import { Loader } from '@googlemaps/js-api-loader'

// REASON: The product condition enum was updated to match the new API contract.
const PRODUCT_CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
] as const;

// REASON: The validation schema is updated to match the `ProductDataSchema` from the backend.
// This includes coercing string form inputs into numbers for numeric fields,
// updating enums, and changing currency validation to a 3-character string.
const productSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().min(1, 'Description is required'),
  category_id: z.coerce.number({ required_error: 'Category is required' }).int().positive('Category must be a valid selection'),
  brand: z.string().max(100, 'Brand must be less than 100 characters').optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor'], {
    required_error: 'Condition is required',
  }),
  location: z.string().min(1, 'Location is required').max(100, 'Location must be less than 100 characters'),
  currency: z.literal('usdc', { required_error: 'Currency must be USDC' }),
  price_per_day: z.coerce
    .number({ required_error: 'Price per day is required', invalid_type_error: 'Price must be a number' })
    .positive('Price per day must be a positive number'),
  price_per_hour: z.union([
    z.coerce.number().positive('Price per hour must be a positive number'),
    z.literal(''),
    z.nan()
  ]).optional().transform(val => (val === '' || isNaN(val as number)) ? undefined : val),
  daily_cap_hours: z.union([
    z.coerce.number().int('Daily cap hours must be an integer').positive(),
    z.literal(''),
    z.nan()
  ]).optional().transform(val => (val === '' || isNaN(val as number)) ? undefined : val),
  security_deposit: z.union([
    z.coerce.number().nonnegative('Security deposit must be a non-negative number'),
    z.literal(''),
    z.nan()
  ]).optional().transform(val => (val === '' || isNaN(val as number)) ? undefined : val),
});

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
  const { user, isLoading, session } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
    watch,
    // REASON: Added `setError` from react-hook-form to programmatically set field-specific errors
    // received from the backend API upon validation failure.
    setError: setFormError,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: '',
      description: '',
      brand: '',
      location: '',
      currency: 'usdc',
    }
  })

  // Watch the location field value
  const locationValue = watch('location')

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

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        console.warn('Google Maps API key not found')
        return
      }

      try {
        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['places']
        })
        
        await loader.load()
        setIsGoogleMapsLoaded(true)
      } catch (error) {
        console.error('Error loading Google Maps:', error)
      }
    }

    loadGoogleMaps()
  }, [])

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

  // REASON: The onSubmit function is refactored to handle the new API contract.
  // It uses the Zod-validated data, includes advanced error handling for backend
  // validation messages, and constructs the payload correctly.
  const onSubmit = async (validatedData: ProductFormData) => {
    setIsSubmitting(true)
    setError(null)

    if (!session) {
      setError("Authentication session not found. Please log in again.");
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'Your session is invalid. Please log out and log back in.',
      });
      setIsSubmitting(false);
      return;
    }

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


      const productId = crypto.randomUUID()

      // REASON: The `validatedData` object from react-hook-form now contains the
      // correctly typed values (e.g., numbers for prices) due to Zod's transformations.
      // We use this directly to build the final payload.
      const productData = {
        ...validatedData,
        id: productId,
      }

      // Create FormData to include both product data and images
      const formData = new FormData()
      
      // Add product data as JSON string
      formData.append('productData', JSON.stringify(productData))
      
      // Add images to FormData
      images.forEach((image, index) => {
        formData.append('images', image.file)
        if (image.isCover) {
          formData.append('coverImageIndex', index.toString())
        }
      })
      
      // Send FormData with both product data and images
      const { data: responseData, error: functionError } = await supabase.functions.invoke(
        'create-product',
        {
          body: formData,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      )

      // REASON: Advanced error handling to parse backend validation errors.
      // If the error response contains a `details` object, we use it to set
      // specific error messages on the corresponding form fields.
      if (functionError) {
        const context = (functionError as any).context;
        if (context && context.details && typeof context.details === 'object') {
          setError('Submission failed. Please check the fields below for errors.');
          Object.entries(context.details).forEach(([field, messages]) => {
            const fieldName = field as keyof ProductFormData;
            const message = Array.isArray(messages) ? messages.join(', ') : String(messages);
            setFormError(fieldName, { type: 'manual', message });
          });
        } else {
          const errorMessage = context?.error || functionError.message || 'An unknown error occurred.';
          setError(`Submission Failed: ${errorMessage}`);
        }
        toast({
          variant: 'destructive',
          title: 'Submission Failed',
          description: 'Please review the errors and try again.',
        });
        return; // Stop execution
      }

      toast({
        title: 'Published!',
        description: 'Your new listing is now live.',
      })
      router.push('/profile/listings')

    } catch (err: any) {
      // Catches network errors or other unexpected issues.
      const errorMessage = err.message || 'An unexpected error occurred.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: errorMessage,
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
                <Select onValueChange={(value: string) => setValue('category_id', parseInt(value, 10), { shouldValidate: true })} >
                  <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
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
                {/* REASON: The Select component is updated to use the new PRODUCT_CONDITIONS array. */}
                <Select onValueChange={(value: string) => setValue('condition', value as 'new' | 'like_new' | 'good' | 'fair' | 'poor', { shouldValidate: true })} >
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
                <LocationAutocomplete
                  value={locationValue || ''}
                  onChange={(value) => {
                    setValue('location', value, { shouldValidate: true })
                  }}
                  placeholder="e.g., San Francisco, CA"
                  error={errors.location?.message}
                  disabled={!isGoogleMapsLoaded}
                />
                {!isGoogleMapsLoaded && (
                  <p className="text-xs text-muted-foreground">Loading location services...</p>
                )}
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
                <Label htmlFor="price_per_day">Price Per Day (USD in USDC) *</Label>
                <Input id="price_per_day" type="number" step="0.01" {...register('price_per_day')} placeholder="e.g., 50.00" />
                {errors.price_per_day && <p className="text-sm text-destructive">{errors.price_per_day.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_per_hour">Price Per Hour (USD in USDC)</Label>
                <Input id="price_per_hour" type="number" step="0.01" {...register('price_per_hour')} placeholder="e.g., 10.00" />
                {errors.price_per_hour && <p className="text-sm text-destructive">{errors.price_per_hour.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="security_deposit">Security Deposit (USD in USDC)</Label>
                <Input id="security_deposit" type="number" step="0.01" {...register('security_deposit')} placeholder="e.g., 100.00" />
                {errors.security_deposit && <p className="text-sm text-destructive">{errors.security_deposit.message}</p>}
              </div>
              <div className="space-y-2">
                  <Label htmlFor="daily_cap_hours">Daily Cap Hours</Label>
                  <Input id="daily_cap_hours" type="number" step="1" {...register('daily_cap_hours')} placeholder="e.g., 4" />
                  {errors.daily_cap_hours && <p className="text-sm text-destructive">{errors.daily_cap_hours.message}</p>}
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
                  <Input id="image-upload" type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleImageSelect} />
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