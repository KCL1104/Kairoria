import { ArrowLeft, Calendar, Heart, MapPin, MessageSquare, Share2, Star } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductReviews } from "@/components/marketplace/product-reviews"
import { OwnerCard } from "@/components/marketplace/owner-card"
import { ProductDatePicker } from "@/components/marketplace/product-date-picker"
import { RelatedProducts } from "@/components/marketplace/related-products"
import { Metadata } from "next"
import { notFound } from "next/navigation"

// Import mockProducts from the product-grid component where they are defined
import { mockProducts } from "@/components/marketplace/product-grid"

// Function to generate static paths for all products during build time
export function generateStaticParams() {
  return mockProducts.map((product) => ({
    productId: product.id,
  }))
}

// Generate metadata for SEO
export function generateMetadata({ params }: { params: { productId: string } }): Metadata {
  const product = mockProducts.find((p) => p.id === params.productId)
  
  if (!product) {
    return {
      title: "Product Not Found",
      description: "The requested product could not be found.",
    }
  }
  
  return {
    title: `${product.title} | Kairoria Marketplace`,
    description: `Rent ${product.title} in ${product.location}. Rating: ${product.rating}/5 from ${product.reviews} reviews.`,
    openGraph: {
      images: [{ url: product.imageSrc }],
    },
  }
}

export default function ProductPage({ params }: { params: { productId: string } }) {
  // Find the product from our mock data
  const productFromMock = mockProducts.find((product) => product.id === params.productId)
  
  // If product not found, use a fallback or show 404
  if (!productFromMock) {
    notFound()
  }
  
  // For this example, we'll enhance the mock product with additional details
  const product = {
    ...productFromMock,
    description: "High-end item perfect for professional use. Includes all necessary accessories and is in excellent condition. This product is known for its exceptional quality and versatility in various conditions.",
    features: [
      "Premium quality construction",
      "Easy to use interface",
      "Includes full warranty",
      "Energy efficient operation",
      "Compact storage design",
      "Built-in safety features",
    ],
    owner: {
      name: "David Chen",
      rating: 4.8,
      reviews: 42,
      responseRate: 98,
      responseTime: "within an hour",
      memberSince: "Aug 2022",
      avatarSrc: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=300",
    }
  }
  
  return (
    <div className="container py-8">
      {/* Back Button */}
      <Link href="/marketplace" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Marketplace
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        <div>
          {/* Product Gallery - Using imageSrc instead of images array */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="md:col-span-2">
              <img 
                src={product.imageSrc} 
                alt={product.title} 
                className="w-full h-[400px] object-cover rounded-lg"
              />
            </div>
            {/* Use placeholder images for additional views */}
            <img 
              src="https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg" 
              alt={`${product.title} - view 2`} 
              className="w-full h-48 object-cover rounded-lg"
            />
            <img 
              src="https://images.pexels.com/photos/1787235/pexels-photo-1787235.jpeg" 
              alt={`${product.title} - view 3`} 
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
          
          {/* Product Info */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <Badge className="mb-2">{product.category}</Badge>
                <h1 className="text-3xl font-bold">{product.title}</h1>
                <div className="flex items-center gap-1 mt-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{product.location}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-1 mt-3">
              <Star className="h-5 w-5 fill-primary text-primary" />
              <span className="font-medium">{product.rating}</span>
              <span className="text-muted-foreground">({product.reviews} reviews)</span>
            </div>
            
            <Separator className="my-6" />
            
            <Tabs defaultValue="description">
              <TabsList className="mb-4">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="text-muted-foreground">
                <p>{product.description}</p>
              </TabsContent>
              <TabsContent value="features">
                <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                  {product.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </TabsContent>
              <TabsContent value="reviews">
                <ProductReviews productId={product.id} />
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Related Products */}
          <RelatedProducts category={product.category} />
        </div>
        
        <div className="space-y-6">
          {/* Booking Card */}
          <div className="sticky top-20 border rounded-lg p-6">
            <div className="mb-4">
              <span className="text-2xl font-bold">${product.price}</span>
              <span className="text-muted-foreground">/{product.period}</span>
            </div>
            
            <ProductDatePicker />
            
            <Button className="w-full mt-4" size="lg">
              Request to Rent
            </Button>
            
            <Button variant="outline" className="w-full mt-3">
              <MessageSquare className="mr-2 h-4 w-4" />
              Contact Owner
            </Button>
            
            <div className="mt-4 text-sm text-muted-foreground text-center">
              <p>You won't be charged yet</p>
            </div>
          </div>
          
          {/* Owner Card */}
          <OwnerCard owner={product.owner} />
        </div>
      </div>
    </div>
  )
}