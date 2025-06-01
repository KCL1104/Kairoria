import { type Metadata } from 'next'
import Link from "next/link"
import { ChevronLeft, Heart, MapPin, Share2, Star } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { mockProducts } from "../../page"

// Expanded mock data for product details
const extendedProducts = [
  ...mockProducts,
  {
    id: "product-1-extended",
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
    description: "High-quality professional DSLR camera perfect for photography enthusiasts and professionals. Includes multiple lenses and accessories.",
    features: [
      "24.2MP full-frame CMOS sensor",
      "4K video recording",
      "ISO range of 100-51,200 (expandable to 204,800)",
      "Continuous shooting at up to 10 fps",
      "3.2-inch tilting touchscreen LCD",
      "Built-in Wi-Fi and Bluetooth",
    ],
    policies: {
      cancellation: "Free cancellation up to 24 hours before pickup",
      damage: "Security deposit required",
      insurance: "Optional insurance available",
    },
    owner: {
      name: "Michael Chen",
      rating: 4.9,
      reviews: 124,
      responseTime: "Usually responds within 30 minutes",
      memberSince: "January 2022",
      image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
    },
  },
];

export async function generateMetadata({
  params,
}: {
  params: { productId: string }
}): Promise<Metadata> {
  // Find the product with the matching ID
  const product = extendedProducts.find(p => p.id === params.productId || p.id === `${params.productId}-extended`);
  
  if (!product) {
    return {
      title: "Product Not Found | Kairoria",
      description: "The requested product could not be found.",
    }
  }
  
  return {
    title: `${product.title} | Kairoria Marketplace`,
    description: `Rent ${product.title} in ${product.location} for $${product.price}/${product.period}. ${product.description || ""}`,
  }
}

export default function ProductPage({ params }: { params: { productId: string } }) {
  // Find the product with the matching ID
  const product = extendedProducts.find(p => p.id === params.productId || p.id === `${params.productId}-extended`);
  
  if (!product) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="mb-8">The product you're looking for doesn't exist or has been removed.</p>
        <Link href="/marketplace">
          <Button>Browse Marketplace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center mb-8">
        <Link href="/marketplace" className="text-muted-foreground hover:text-foreground flex items-center">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Marketplace
        </Link>
      </div>
      
      {/* Product Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Product Image */}
        <div className="md:col-span-2">
          <img 
            src={product.imageSrc}
            alt={product.title} 
            className="w-full h-[400px] object-cover rounded-lg"
          />
          
          {/* Additional Images (in a real app) */}
          <div className="grid grid-cols-4 gap-2 mt-2">
            {'description' in product && (
              <>
                <img 
                  src="https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg" 
                  alt="Camera view 2"
                  className="w-full h-24 object-cover rounded-lg cursor-pointer" 
                />
                <img 
                  src="https://images.pexels.com/photos/1787235/pexels-photo-1787235.jpeg" 
                  alt="Camera view 3"
                  className="w-full h-24 object-cover rounded-lg cursor-pointer" 
                />
                <img 
                  src="https://images.pexels.com/photos/274973/pexels-photo-274973.jpeg" 
                  alt="Camera view 4"
                  className="w-full h-24 object-cover rounded-lg cursor-pointer" 
                />
                <img 
                  src="https://images.pexels.com/photos/1203803/pexels-photo-1203803.jpeg" 
                  alt="Camera view 5"
                  className="w-full h-24 object-cover rounded-lg cursor-pointer" 
                />
              </>
            )}
          </div>
        </div>
        
        {/* Product Details and Booking */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{product.title}</CardTitle>
                  <CardDescription className="mt-1">
                    <div className="flex items-center gap-1 mb-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{product.location}</span>
                      {product.distance && (
                        <span className="text-sm">
                          ({product.distance < 1 ? `${(product.distance * 1000).toFixed(0)}m` : `${product.distance.toFixed(1)}km`})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-medium">{product.rating}</span>
                      <span className="text-muted-foreground">({product.reviews} reviews)</span>
                    </div>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="rounded-full">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border-t border-b py-4">
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">${product.price}</span>
                  <span className="text-muted-foreground ml-1">/{product.period}</span>
                </div>
                
                {'description' in product && product.policies && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                      {product.policies.cancellation}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="py-4">
                <p className="font-medium mb-2">Select Dates</p>
                <div className="border rounded-lg p-4">
                  <Calendar mode="range" className="mx-auto" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button className="w-full">Rent Now</Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                You won't be charged yet
              </p>
            </CardFooter>
          </Card>
          
          {/* Owner Information */}
          {'owner' in product && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">About the Owner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={product.owner.image} alt={product.owner.name} />
                    <AvatarFallback>{product.owner.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{product.owner.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      <span className="text-sm font-medium">{product.owner.rating}</span>
                      <span className="text-xs text-muted-foreground">({product.owner.reviews} reviews)</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Member since {product.owner.memberSince}</p>
                  </div>
                </div>
                <p className="text-sm mt-4">{product.owner.responseTime}</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Contact Owner</Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
      
      {/* Product Description & Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold mb-4">About this item</h2>
          {'description' in product ? (
            <div className="space-y-4">
              <p>{product.description}</p>
              
              <h3 className="text-lg font-semibold mt-6">Features</h3>
              <ul className="list-disc list-inside space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
              
              <h3 className="text-lg font-semibold mt-6">Rental Policies</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Cancellation:</span> {product.policies.cancellation}</p>
                <p><span className="font-medium">Damage Protection:</span> {product.policies.damage}</p>
                <p><span className="font-medium">Insurance:</span> {product.policies.insurance}</p>
              </div>
            </div>
          ) : (
            <p>This premium rental item is available for daily rental. Perfect for your needs!</p>
          )}
          
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Reviews</h2>
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 fill-primary text-primary" />
              <span className="text-lg font-semibold">{product.rating}</span>
              <span className="text-muted-foreground">({product.reviews} reviews)</span>
            </div>
            
            {/* Sample Review */}
            <div className="border-t py-4">
              <div className="flex items-center gap-4 mb-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg" alt="Sarah" />
                  <AvatarFallback>SJ</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Sarah J.</p>
                  <p className="text-xs text-muted-foreground">June 2023</p>
                </div>
              </div>
              <div className="flex mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p>Excellent product! It was in great condition and worked perfectly for my weekend project. The owner was very responsive and helpful with setup instructions. Would definitely rent again.</p>
            </div>
            
            <div className="mt-4">
              <Link href="#reviews">
                <Button variant="outline">View All Reviews</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Location Map Placeholder */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Location</h2>
        <div className="bg-muted h-[300px] rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Map view of {product.location}</p>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Exact location provided after booking
        </p>
      </div>
      
      {/* Related Products */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-6">Similar Items</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mockProducts.filter(p => p.id !== params.productId).slice(0, 4).map((relatedProduct) => (
            <div key={relatedProduct.id} className="border rounded-lg overflow-hidden">
              <Link href={`/marketplace/${relatedProduct.id}`}>
                <div className="aspect-square relative">
                  <img 
                    src={relatedProduct.imageSrc}
                    alt={relatedProduct.title}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium line-clamp-1">{relatedProduct.title}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="text-sm">{relatedProduct.rating}</span>
                    <span className="text-xs text-muted-foreground">({relatedProduct.reviews})</span>
                  </div>
                  <div className="mt-2">
                    <span className="font-semibold">${relatedProduct.price}</span>
                    <span className="text-muted-foreground text-sm">/{relatedProduct.period}</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}