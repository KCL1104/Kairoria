"use client";

import { ArrowLeft, Heart, MessageSquare, Share2, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductReviews } from "@/components/marketplace/product-reviews";
import { OwnerCard } from "@/components/marketplace/owner-card";
import { ProductDatePicker } from "@/components/marketplace/product-date-picker";
import { RelatedProducts } from "@/components/marketplace/related-products";
import { Product, ProductImage, Profile, convertFromStorageAmount } from '@/lib/data';
import { MapPin } from "lucide-react";

type ProductWithRelations = Product & {
  categories: { id: number; name: string };
  owner: Profile;
  product_images: ProductImage[];
};

interface ProductDetailClientViewProps {
  product: ProductWithRelations;
}

export function ProductDetailClientView({ product }: ProductDetailClientViewProps) {
  const pricePerDay = convertFromStorageAmount(product.price_per_day);
  const pricePerHour = product.price_per_hour ? convertFromStorageAmount(product.price_per_hour) : null;
  const securityDeposit = convertFromStorageAmount(product.security_deposit);

  // Get images
  const coverImage = product.product_images.find(img => img.is_cover) || product.product_images[0];
  const otherImages = product.product_images.filter(img => !img.is_cover).slice(0, 2);

  // Enhanced product features (could be stored in DB or derived from description)
  const features = [
    "Premium quality construction",
    "Easy to use interface",
    "Includes full warranty",
    "Energy efficient operation",
    "Compact storage design",
    "Built-in safety features",
  ];

  const owner = {
    name: product.owner.full_name || "Anonymous",
    rating: 4.8, // Could be calculated from reviews
    reviews: 42, // Could be counted from reviews table
    responseRate: 98,
    responseTime: "within an hour",
    memberSince: "Aug 2022", // Could be derived from created_at
    avatarSrc: product.owner.avatar_url || "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=300",
  };

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
              {coverImage ? (
                <img
                  src={coverImage.image_url}
                  alt={product.title}
                  className="w-full h-[400px] object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">No image available</p>
                </div>
              )}
            </div>
            {/* Additional images */}
            {otherImages.map((image, index) => (
              <img
                key={image.id}
                src={image.image_url}
                alt={`${product.title} - view ${index + 2}`}
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
            {/* Fill remaining slots with placeholder if needed */}
            {Array.from({ length: Math.max(0, 2 - otherImages.length) }).map((_, index) => (
              <div
                key={`placeholder-${index}`}
                className="w-full h-48 bg-muted rounded-lg flex items-center justify-center"
              >
                <p className="text-muted-foreground text-sm">Additional image</p>
              </div>
            ))}
          </div>

          {/* Product Info */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <Badge className="mb-2">{product.categories.name}</Badge>
                <h1 className="text-3xl font-bold">{product.title}</h1>
                <div className="flex items-center gap-1 mt-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{product.location}</span>
                </div>
                {product.brand && (
                  <p className="text-muted-foreground mt-1">Brand: {product.brand}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="capitalize">{product.condition.replace('_', ' ')}</Badge>
                  <Badge variant="outline">{product.currency.toUpperCase()}</Badge>
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
              <span className="font-medium">{product.average_rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({product.review_count} reviews)</span>
            </div>

            <Separator className="my-6" />

            <Tabs defaultValue="description">
              <TabsList className="mb-4">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="text-muted-foreground">
                <p className="whitespace-pre-wrap">{product.description}</p>
              </TabsContent>
              <TabsContent value="features">
                <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                  {features.map((feature, index) => (
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
          <RelatedProducts category={product.categories.name} />
        </div>

        <div className="space-y-6">
          {/* Booking Card */}
          <div className="sticky top-20 border rounded-lg p-6">
            <div className="mb-4">
              <div className="space-y-2">
                <div>
                  <span className="text-2xl font-bold">${pricePerDay.toFixed(2)}</span>
                  <span className="text-muted-foreground">/day (USDC)</span>
                </div>
                {pricePerHour && (
                  <div>
                    <span className="text-lg font-semibold">${pricePerHour.toFixed(2)}</span>
                    <span className="text-muted-foreground">/hour (USDC)</span>
                  </div>
                )}
                {product.daily_cap_hours && (
                  <p className="text-sm text-muted-foreground">
                    Max {product.daily_cap_hours} hours per day
                  </p>
                )}
                {securityDeposit > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Security deposit: ${securityDeposit.toFixed(2)} (USDC)
                  </p>
                )}
              </div>
            </div>

            <ProductDatePicker />

            <Button className="w-full mt-4" size="lg" disabled={product.status !== 'listed'}>
              {product.status === 'listed' ? 'Request to Rent' : 'Currently Unavailable'}
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
          <OwnerCard owner={owner} />
        </div>
      </div>
    </div>
  );
}