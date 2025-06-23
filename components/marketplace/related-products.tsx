"use client";

import { useState, useEffect } from 'react'
import { ProductCard } from "@/components/marketplace/product-card"
import { fetchProducts } from '@/lib/supabase-client'
import { Product, ProductImage, Category, Profile, convertFromStorageAmount } from '@/lib/data'

type ProductWithRelations = Product & {
  categories: Category
  profiles: Profile
  product_images: ProductImage[]
}

export function RelatedProducts({ category }: { category: string }) {
  const [relatedProducts, setRelatedProducts] = useState<ProductWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadRelatedProducts = async () => {
      try {
        setIsLoading(true)
        // Fetch products from the same category (limit to 3 for related products)
        const data = await fetchProducts({ limit: 3 })
        // Category filtering not available with current schema
        setRelatedProducts([])
      } catch (error) {
        console.error('Error fetching related products:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadRelatedProducts()
  }, [category])

  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Similar Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-64 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (relatedProducts.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Similar Products</h2>
        <p className="text-muted-foreground">No similar products found in this category.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Similar Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatedProducts.map((product) => {
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