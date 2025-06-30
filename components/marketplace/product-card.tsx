import Link from "next/link"
import { convertFromStorageAmount } from "@/lib/data"
import { MapPin, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ProductCardProps {
  id: string
  title: string
  category: string
  price: number
  period: "hour" | "day" | "week" | "month"
  location: string
  distance?: number
  rating: number
  reviews: number
  imageSrc: string
  isAvailable?: boolean
  className?: string
}

export function ProductCard({
  id,
  title,
  category,
  price,
  period,
  location,
  distance,
  rating,
  reviews,
  imageSrc,
  isAvailable = true,
  className,
}: ProductCardProps) {
  return (
    <Card className={cn("overflow-hidden h-full transition-all hover:shadow-md", className)}>
      <Link href={`/marketplace/${id}`} className="block">
        <div className="aspect-square relative overflow-hidden">
          <img 
            src={imageSrc}
            alt={title}
            className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
          />
          <Badge className="absolute top-3 left-3">{category}</Badge>
          {!isAvailable && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <Badge variant="destructive" className="text-sm py-1.5">Currently Unavailable</Badge>
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/marketplace/${id}`} className="block">
          <h3 className="font-medium text-lg line-clamp-1">{title}</h3>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{location}</span>
            {distance && (
              <span className="text-sm text-muted-foreground">
                ({distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-2">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="text-sm font-medium">{rating}</span>
            <span className="text-sm text-muted-foreground">({reviews} reviews)</span>
          </div>
        </Link>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div>
                    <span className="font-semibold text-lg">${convertFromStorageAmount(price)}</span>
          <span className="text-muted-foreground text-sm">/{period} (USDC)</span>
        </div>
        <Button size="sm" disabled={!isAvailable}>
          {isAvailable ? "Rent Now" : "Unavailable"}
        </Button>
      </CardFooter>
    </Card>
  )
}