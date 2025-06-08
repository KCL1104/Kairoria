"use client"

import { useState, useEffect } from 'react'
import { ProductCard } from "@/components/marketplace/product-card"
import { fetchProducts } from '@/lib/supabase-client'
import { Product, ProductImage, Category, Profile, convertFromStorageAmount } from '@/lib/data'
import { Loader2 } from 'lucide-react'

type ProductWithRelations = Product & {
  categories: { id: number; name: string }
  owner: Profile
  product_images: ProductImage[]
}

export function ProductGrid() {
  const [products, setProducts] = useState<ProductWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true)
        console.log('ProductGrid: Loading products...')
        
        // Set timeout to prevent infinite loading
        const timeout = setTimeout(() => {
          console.warn('ProductGrid: Loading timeout reached')
          setIsLoading(false)
          setError('Loading timeout - please try again')
        }, 12000) // 12 seconds timeout
        
        const data = await fetchProducts({ limit: 50 })
        clearTimeout(timeout)
        
        console.log('ProductGrid: Products loaded:', data)
        setProducts(data || [])
        setError(null)
      } catch (err) {
        console.error('ProductGrid: Error fetching products:', err)
        setError('Failed to load products')
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">No products found</h3>
        <p className="text-muted-foreground">Be the first to list an item!</p>
      </div>
    )
  }

  return (
    <div>
      {/* Results count and sorting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <p className="text-muted-foreground mb-2 sm:mb-0">
          Showing <span className="font-medium text-foreground">{products.length}</span> results
        </p>
        <select className="p-2 text-sm border rounded-md">
          <option value="relevance">Sort by: Relevance</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
          <option value="newest">Newest First</option>
        </select>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => {
          const coverImage = product.product_images?.find(img => img.is_cover) || product.product_images?.[0]
          
          return (
            <ProductCard 
              key={product.id}
              id={product.id.toString()}
              title={product.title}
              category={product.categories?.name || 'Unknown'}
              price={convertFromStorageAmount(product.price_per_day)}
              period="day"
              location={product.location}
              rating={product.average_rating || 0}
              reviews={product.review_count || 0}
              imageSrc={coverImage?.image_url || "https://images.pexels.com/photos/276517/pexels-photo-276517.jpeg?auto=compress&cs=tinysrgb&w=800"}
              isAvailable={product.status === 'listed'}
            />
          )
        })}
      </div>
    </div>
  )
}