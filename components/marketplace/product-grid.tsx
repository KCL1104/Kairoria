import { ProductCard } from "@/components/marketplace/product-card"

// Mock data for products - in a real app, this would come from an API
export const mockProducts = [
  {
    id: "product-1",
    title: "Professional DSLR Camera",
    category: "Electronics",
    price: 35,
    period: "day",
    location: "San Francisco",
    distance: 2.4,
    rating: 4.9,
    reviews: 28,
    imageSrc: "https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg",
    isAvailable: true,
  },
  {
    id: "product-2",
    title: "Mountain Bike - Trek",
    category: "Outdoor",
    price: 25,
    period: "day",
    location: "Boulder",
    distance: 1.8,
    rating: 4.7,
    reviews: 43,
    imageSrc: "https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg",
    isAvailable: true,
  },
  {
    id: "product-3",
    title: "Portable Projector",
    category: "Electronics",
    price: 15,
    period: "day",
    location: "New York",
    distance: 0.5,
    rating: 4.8,
    reviews: 19,
    imageSrc: "https://images.pexels.com/photos/1117132/pexels-photo-1117132.jpeg",
    isAvailable: false,
  },
  {
    id: "product-4",
    title: "Electric Drill",
    category: "Tools",
    price: 10,
    period: "day",
    location: "Chicago",
    distance: 3.2,
    rating: 4.6,
    reviews: 37,
    imageSrc: "https://images.pexels.com/photos/957065/pexels-photo-957065.jpeg",
    isAvailable: true,
  },
  {
    id: "product-5",
    title: "Stand Mixer - KitchenAid",
    category: "Home",
    price: 20,
    period: "day",
    location: "Portland",
    distance: 1.3,
    rating: 4.9,
    reviews: 52,
    imageSrc: "https://images.pexels.com/photos/6996142/pexels-photo-6996142.jpeg",
    isAvailable: true,
  },
  {
    id: "product-6",
    title: "Camping Tent - 4 Person",
    category: "Outdoor",
    price: 28,
    period: "day",
    location: "Denver",
    distance: 4.7,
    rating: 4.5,
    reviews: 31,
    imageSrc: "https://images.pexels.com/photos/2582818/pexels-photo-2582818.jpeg",
    isAvailable: true,
  },
  {
    id: "product-7",
    title: "Lawn Mower",
    category: "Tools",
    price: 18,
    period: "day",
    location: "Austin",
    distance: 2.9,
    rating: 4.3,
    reviews: 15,
    imageSrc: "https://images.pexels.com/photos/589/garden-gardening-grass-lawn.jpg",
    isAvailable: true,
  },
  {
    id: "product-8",
    title: "Snowboard with Bindings",
    category: "Outdoor",
    price: 30,
    period: "day",
    location: "Salt Lake City",
    distance: 5.1,
    rating: 4.8,
    reviews: 27,
    imageSrc: "https://images.pexels.com/photos/376697/pexels-photo-376697.jpeg",
    isAvailable: true,
  },
  {
    id: "product-9",
    title: "Professional Microphone",
    category: "Electronics",
    price: 22,
    period: "day",
    location: "Nashville",
    distance: 1.6,
    rating: 4.9,
    reviews: 38,
    imageSrc: "https://images.pexels.com/photos/164873/pexels-photo-164873.jpeg",
    isAvailable: true,
  },
];

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