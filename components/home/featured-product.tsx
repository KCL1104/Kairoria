import Image from "next/image"
import Link from "next/link"
import { MapPin, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface FeaturedProductProps {
  title: string
  category: string
  price: number
  period: "hour" | "day" | "week" | "month"
  location: string
  rating: number
  reviews: number
  imageSrc: string
  className?: string
}

export function FeaturedProduct({
  title,
  category,
  price,
  period,
  location,
  rating,
  reviews,
  imageSrc,
  className,
}: FeaturedProductProps) {
  return (
    <Link href="/marketplace/product-1">
      <Card className={cn("overflow-hidden h-full transition-all hover:shadow-md", className)}>
        <div className="aspect-square relative overflow-hidden">
          <img 
            src={imageSrc}
            alt={title}
            className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
          />
          <Badge className="absolute top-3 left-3">{category}</Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-medium text-lg line-clamp-1">{title}</h3>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{location}</span>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="text-sm font-medium">{rating}</span>
            <span className="text-sm text-muted-foreground">({reviews} reviews)</span>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <div>
            <span className="font-semibold text-lg">${price}</span>
            <span className="text-muted-foreground text-sm">/{period}</span>
          </div>
          <Badge variant="outline" className="text-xs">Available Now</Badge>
        </CardFooter>
      </Card>
    </Link>
  )
}