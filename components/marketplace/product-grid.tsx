"use client"

import { ProductCard } from "@/components/marketplace/product-card"
import { Product, ProductImage, Category, Profile, convertFromStorageAmount } from '@/lib/data'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname, useSearchParams } from 'next/navigation'

type ProductWithRelations = Product & {
  categories: { id: number; name: string }
  owner: Profile
  product_images: ProductImage[]
}

interface ProductGridProps {
  products: ProductWithRelations[]
  count: number
  page: number
  limit: number
}

export function ProductGrid({ products, count, page, limit }: ProductGridProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(count / limit)

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">No products found</h3>
        <p className="text-muted-foreground">Try adjusting your filters or be the first to list an item!</p>
      </div>
    )
  }

  return (
    <div>
      {/* Results count and sorting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <p className="text-muted-foreground mb-2 sm:mb-0">
          Showing <span className="font-medium text-foreground">{products.length}</span> of <span className="font-medium text-foreground">{count}</span> results
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
              id={product.id}
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

      {/* Pagination */}
      <div className="flex justify-center items-center space-x-4 mt-8">
        <Button asChild variant="outline" disabled={page <= 1}>
          <Link href={createPageURL(page - 1)}>Previous</Link>
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button asChild variant="outline" disabled={page >= totalPages}>
          <Link href={createPageURL(page + 1)}>Next</Link>
        </Button>
      </div>
    </div>
  )
}