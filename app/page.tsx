import { type Metadata } from 'next'
import Link from "next/link"
import { Search, Sliders, Map, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductCard } from "@/components/marketplace/product-card"
import { mockProducts, categories } from "@/lib/data"

export const metadata: Metadata = {
  title: 'Kairoria | Marketplace',
  description: 'Find high-quality products to rent or list your own items to earn passive income.',
}

export default function MarketplacePage() {
  return (
    <div>
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
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="h-auto w-full justify-start bg-transparent p-0">
                <div className="flex gap-6 overflow-x-auto pb-2">
                  {categories.map((category) => (
                    <TabsTrigger 
                      key={category.id}
                      value={category.id}
                      className="flex flex-col items-center justify-center rounded-lg px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <span className="text-2xl">{category.icon}</span>
                      <span className="mt-1 text-xs font-medium">{category.name}</span>
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
          
          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {mockProducts.map((product) => (
              <ProductCard 
                key={product.id}
                id={product.id}
                title={product.title}
                category={product.category}
                price={product.price}
                period={product.period as "hour" | "day" | "week" | "month"}
                location={product.location}
                distance={product.distance}
                rating={product.rating}
                reviews={product.reviews}
                imageSrc={product.imageSrc}
                isAvailable={product.isAvailable}
              />
            ))}
          </div>
          
          {/* Load More Button */}
          <div className="mt-10 text-center">
            <Button variant="outline" size="lg">
              Load More
            </Button>
          </div>
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
    </div>
  )
}