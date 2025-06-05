"use client"

import { useState, useEffect } from 'react'
import { ProductCard } from "@/components/marketplace/product-card"
import { fetchProducts } from '@/lib/supabase-client'
import { Product, ProductImage, Category, Profile, convertFromStorageAmount } from '@/lib/data'
import { Loader2 } from 'lucide-react'

type ProductWithRelations = Product & {
  categories: Category
  profiles: Profile
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
        const data = await fetchProducts({ limit: 50 })
        setProducts(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching products:', err)
        setError('Failed to load products')
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          // Get the cover image or first image
          const coverImage = product.product_images.find(img => img.is_cover) || product.product_images[0]
          const pricePerDay = convertFromStorageAmount(product.price_per_day)
          
          return (
            <ProductCard 
              key={product.id}
              id={product.id.toString()}
              title={product.title}
              category={product.categories.name}
              price={pricePerDay}
              period="day"
              location={product.location}
              rating={product.average_rating}
              reviews={product.review_count}
              imageSrc={coverImage?.image_url || '/placeholder-image.jpg'}
              isAvailable={product.status === 'listed'}
            />
          )
        })}
      </div>
    </div>
  )
}