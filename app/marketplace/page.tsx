import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/marketplace/product-card"
import { CategoryFilter } from "@/components/marketplace/category-filter"
import { PriceRangeFilter } from "@/components/marketplace/price-range-filter"
import { LocationFilter } from "@/components/marketplace/location-filter"
import { DateFilter } from "@/components/marketplace/date-filter"
import { SearchInput } from "@/components/marketplace/search-input"
import { MapButton } from "@/components/marketplace/map-button"
import { ProductGrid } from "@/components/marketplace/product-grid"

export default function MarketplacePage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Marketplace</h1>
      
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <SearchInput className="w-full md:max-w-md" placeholder="Search for products..." />
        <div className="flex items-center gap-2">
          <MapButton />
          <Button variant="outline" size="sm" className="hidden md:flex">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Sidebar Filters - Desktop */}
        <div className="hidden lg:block space-y-6">
          <CategoryFilter />
          <PriceRangeFilter />
          <LocationFilter />
          <DateFilter />
        </div>
        
        {/* Product Grid */}
        <div>
          {/* Mobile Filters */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Filter className="mr-2 h-4 w-4" />
              Categories
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Filter className="mr-2 h-4 w-4" />
              Price
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Filter className="mr-2 h-4 w-4" />
              Location
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Filter className="mr-2 h-4 w-4" />
              Dates
            </Button>
          </div>
          
          {/* Product Grid */}
          <ProductGrid />
        </div>
      </div>
    </div>
  )
}