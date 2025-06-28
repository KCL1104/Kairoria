'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from "next/link"
import { Search, Sliders, Map, ArrowRight, Loader2, CheckCircle, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { ProductCard } from "@/components/marketplace/product-card"
import { Product, Profile, getCategoryIcon, ProductImage, convertFromStorageAmount } from '@/lib/data'

type ProductWithRelations = Product & {
  categories: { id: number; name: string }
  owner: Profile
  product_images: ProductImage[]
}

interface ClientHomePageProps {
  initialProducts: ProductWithRelations[];
  initialCategories: string[];
}

export default function ClientHomePage({ initialProducts, initialCategories }: ClientHomePageProps) {
  const [products, setProducts] = useState<ProductWithRelations[]>(initialProducts)
  const [categories, setCategories] = useState<string[]>(initialCategories)
  const [isLoading, setIsLoading] = useState(false) // Data is initially loaded by server
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const { toast } = useToast()
  const searchParams = useSearchParams()

  // Check for sign-out success message
  const checkSignOutSuccess = useCallback(() => {
    const signout = searchParams.get('signout')
    if (signout === 'success') {
      toast({
        title: "Successfully signed out",
        description: "You have been securely signed out of your account",
        variant: "success"
      })
      
      // Remove the query parameter from URL
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('signout')
        window.history.replaceState({}, document.title, url.toString())
      }
    }
  }, [searchParams, toast])

  // Check for sign-out success on mount
  useEffect(() => {
    checkSignOutSuccess()
  }, [checkSignOutSuccess])

  // Filter products by category
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.categories?.name === selectedCategory)

  return (
    <div className="relative">
      {/* Hero Section with Search */}
      <section className="relative border-b">
        <div className="container py-8">
          {/* Search Bar */}
          <div className="mx-auto max-w-4xl rounded-full border bg-background shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto]">
              {/* Location Search */}
              <div className="relative flex items-center p-4">
                <Search className="absolute left-6 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="border-none pl-10 shadow-none focus-visible:ring-0" 
                  placeholder="What are you looking to rent?" 
                />
              </div>
              
              {/* Date Selection */}
              <div className="hidden border-l md:flex items-center p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                <div>
                  <p className="text-sm font-medium">Dates</p>
                  <p className="text-xs text-muted-foreground">Add dates</p>
                </div>
              </div>
              
              {/* Location Filter */}
              <div className="hidden border-l md:flex items-center p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-xs text-muted-foreground">Add location</p>
                </div>
              </div>
              
              {/* Search Button */}
              <div className="border-l flex items-center p-4">
                <Button size="sm" className="rounded-full px-4">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Category Filters */}
      <section className="py-6 border-b overflow-x-auto">
        <div className="container">
          <div className="flex items-center gap-1 mb-2">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <TabsList className="h-auto w-full justify-start bg-transparent p-0">
                <div className="flex gap-6 overflow-x-auto pb-2">
                  <TabsTrigger 
                    value="all"
                    className="flex flex-col items-center justify-center rounded-lg px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <span className="text-2xl">🏠</span>
                    <span className="mt-1 text-xs font-medium">All Categories</span>
                  </TabsTrigger>
                  {categories.map((category) => (
                    <TabsTrigger 
                      key={category}
                      value={category}
                      className="flex flex-col items-center justify-center rounded-lg px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <span className="text-2xl">{getCategoryIcon(category)}</span>
                      <span className="mt-1 text-xs font-medium">{category}</span>
                    </TabsTrigger>
                  ))}
                </div>
              </TabsList>
            </Tabs>
            
            <div className="ml-auto flex-shrink-0">
              <Button variant="outline" size="sm" className="flex items-center">
                <Sliders className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Map Toggle */}
      <div className="fixed bottom-6 z-10 w-full">
        <div className="container flex justify-center">
          <Button className="rounded-full shadow-lg">
            <Map className="mr-2 h-4 w-4" />
            Show Map
          </Button>
        </div>
      </div>
      
      {/* Main Content - Product Listings */}
      <section className="py-8">
        <div className="container">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Available Items</h1>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline">Sort: Recommended</Badge>
            </div>
          </div>
          
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            </div>
          )}

          {/* No Products State */}
          {!isLoading && filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">
                {selectedCategory === 'all' ? 'No products available' : 'No products in this category'}
              </h3>
              <p className="text-muted-foreground mb-6">
                Be the first to list an item in this category!
              </p>
              <Link href="/profile/listings/new">
                <Button>List Your First Item</Button>
              </Link>
            </div>
          )}
          
          {/* Product Grid */}
          {!isLoading && filteredProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.slice(0, 12).map((product) => {
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
          )}
          
          {/* Load More Button */}
          {!isLoading && filteredProducts.length > 0 && (
            <div className="mt-10 text-center">
              <Link href="/marketplace">
                <Button variant="outline" size="lg">
                  View All Products
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
      
      {/* Promo Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">List Your Items and Earn</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Turn your unused items into income. Join thousands of owners already sharing their belongings on Kairoria.
              </p>
              <ul className="space-y-2 mb-8">
                <li className="flex items-center gap-2">
                  <Badge className="h-2 w-2 rounded-full p-0" />
                  Simple listing process
                </li>
                <li className="flex items-center gap-2">
                  <Badge className="h-2 w-2 rounded-full p-0" />
                  Control your availability and pricing
                </li>
                <li className="flex items-center gap-2">
                  <Badge className="h-2 w-2 rounded-full p-0" />
                  Rental protection and insurance options
                </li>
              </ul>
              <Link href="/profile/listings/new">
                <Button size="lg">
                  Start Listing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="relative rounded-lg overflow-hidden">
              <img 
                src="https://images.pexels.com/photos/6146929/pexels-photo-6146929.jpeg"
                alt="Person listing items on Kairoria"
                className="w-full h-auto object-cover aspect-video"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Bolt.new Badge */}
      <div className="fixed bottom-4 right-4 z-10">
        <a 
          href="https://bolt.new" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full bg-black px-3 py-1 text-sm text-white hover:bg-gray-800 transition-colors"
        >
          <Zap className="h-3.5 w-3.5 mr-1" />
          Built with Bolt.new
        </a>
      </div>
    </div>
  )
}