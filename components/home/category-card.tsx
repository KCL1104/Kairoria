import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

interface CategoryCardProps {
  title: string
  imageSrc: string
  itemCount: number
  href: string
}

export function CategoryCard({ title, imageSrc, itemCount, href }: CategoryCardProps) {
  return (
    <Link href={href}>
      <Card className="overflow-hidden group h-full transition-all hover:shadow-md">
        <div className="relative aspect-video overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${imageSrc})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <CardContent className="relative -mt-8 bg-gradient-to-t from-background to-background/80 backdrop-blur-sm pt-4">
          <h3 className="font-medium text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{itemCount} items</p>
        </CardContent>
      </Card>
    </Link>
  )
}