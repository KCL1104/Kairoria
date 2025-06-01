import { ProductCard } from "@/components/marketplace/product-card"
import { mockProducts } from "@/lib/data"

export function ProductGrid() {
  return (
    <div>
      {/* Results count and sorting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <p className="text-muted-foreground mb-2 sm:mb-0">
          Showing <span className="font-medium text-foreground">{mockProducts.length}</span> results
        </p>
        <select className="p-2 text-sm border rounded-md">
          <option value="relevance">Sort by: Relevance</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
          <option value="distance">Nearest First</option>
        </select>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </div>
  )
}