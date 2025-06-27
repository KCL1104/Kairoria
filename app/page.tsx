import { Suspense } from 'react'
import Link from "next/link"
import { Search, Sliders, Map, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductCard } from "@/components/marketplace/product-card"
import { fetchProducts, fetchUniqueCategories } from '@/lib/supabase-client'
import { Product, Profile, getCategoryIcon, ProductImage, convertFromStorageAmount } from '@/lib/data'
import ClientHomePage from './ClientHomePage'

type ProductWithRelations = Product & {
  categories: { id: number; name: string }
  owner: Profile
  product_images: ProductImage[]
}

async function HomePageContent() {
  const [categoriesResult, productsResult] = await Promise.allSettled([
    fetchUniqueCategories(),
    fetchProducts({ limit: 12 })
  ]);

  const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
  const products = productsResult.status === 'fulfilled' ? productsResult.value : [];

  return (
    <ClientHomePage initialCategories={categories} initialProducts={products} />
  );
}

// Main HomePage component with Suspense boundary
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}