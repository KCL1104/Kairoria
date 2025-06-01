import { type Metadata } from 'next'
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
import { mockProducts } from "../../page"

export function generateStaticParams() {
  return mockProducts.map((product) => ({
    productId: product.id,
  }))
}

export const metadata: Metadata = {
  title: 'Product Details | Kairoria',
  description: 'View product details and book your rental.',
}

export default function ProductPage({ params }: { params: { productId: string } }) {
  // Find the product with the matching ID from mockProducts
  const product = mockProducts.find((p) => p.id === params.productId) || {
    id: params.productId,
    title: "Professional DSLR Camera - Canon EOS 5D Mark IV",
    category: "Electronics",
    description: "High-end DSLR camera perfect for professional photography. Includes two lenses, a battery grip, and extra batteries. The Canon EOS 5D Mark IV is known for its exceptional image quality and versatility in various shooting conditions.",
    price: 35,
    period: "day",
    location: "San Francisco, CA",
    rating: 4.9,
    reviews: 28,
    imageSrc: "https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg",
    features: [
      "30.4 MP full-frame CMOS sensor",
      "ISO range 100-32000",
      "7 fps continuous shooting",
      "4K video recording",
      "3.2-inch touchscreen LCD",
      "Built-in Wi-Fi and GPS",
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
          {/* Product Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="md:col-span-2">
              <img 
                src={product.imageSrc} 
                alt={product.title} 
                className="w-full h-[400px] object-cover rounded-lg"
              />
            </div>
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
                  {'features' in product && product.features ? (
                    product.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))
                  ) : (
                    <li>High quality item available for rent</li>
                  )}
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
          {'owner' in product ? (
            <OwnerCard owner={product.owner} />
          ) : (
            <div className="border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Avatar>
                  <AvatarFallback>OW</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">Item Owner</h3>
                  <div className="flex items-center mt-1">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                    <span className="text-sm ml-1">4.8 • 32 reviews</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                Contact Owner
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}