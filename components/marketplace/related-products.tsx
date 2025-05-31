import { ProductCard } from "@/components/marketplace/product-card"

// Mock related products data
const relatedProducts = [
  {
    id: "related-1",
    title: "Mirrorless Camera - Sony A7 III",
    category: "Electronics",
    price: 40,
    period: "day",
    location: "San Francisco",
    rating: 4.8,
    reviews: 19,
    imageSrc: "https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg",
  },
  {
    id: "related-2",
    title: "Camera Lens Kit - Canon 24-70mm",
    category: "Electronics",
    price: 25,
    period: "day",
    location: "Oakland",
    rating: 4.7,
    reviews: 12,
    imageSrc: "https://images.pexels.com/photos/249597/pexels-photo-249597.jpeg",
  },
  {
    id: "related-3",
    title: "Photography Lighting Kit",
    category: "Electronics",
    price: 20,
    period: "day",
    location: "San Jose",
    rating: 4.6,
    reviews: 8,
    imageSrc: "https://images.pexels.com/photos/3648850/pexels-photo-3648850.jpeg",
  },
];

export function RelatedProducts({ category }: { category: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Similar Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatedProducts.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            title={product.title}
            category={product.category}
            price={product.price}
            period="day"
            location={product.location}
            rating={product.rating}
            reviews={product.reviews}
            imageSrc={product.imageSrc}
          />
        ))}
      </div>
    </div>
  )
}