"use client";

import { useState } from "react"
import { Star } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

// Mock data for reviews
const mockReviews = [
  {
    id: 1,
    user: {
      name: "Michael Rodriguez",
      avatarSrc: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
    },
    rating: 5,
    date: "July 15, 2023",
    comment: "Excellent camera! The owner was very helpful and the equipment was in pristine condition. Definitely recommend renting this for professional shoots.",
  },
  {
    id: 2,
    user: {
      name: "Sarah Johnson",
      avatarSrc: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
    },
    rating: 5,
    date: "May 3, 2023",
    comment: "Great experience renting this camera. The quality is exceptional and it came with all the accessories mentioned. Owner was prompt and communicative.",
  },
  {
    id: 3,
    user: {
      name: "Alex Thompson",
      avatarSrc: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg",
    },
    rating: 4,
    date: "April 18, 2023",
    comment: "Very good camera, worked perfectly for my weekend photoshoot. The only reason for 4 stars is that one of the extra batteries wasn't fully charged.",
  },
];

// Rating distribution
const ratingDistribution = [
  { rating: 5, percentage: 75 },
  { rating: 4, percentage: 20 },
  { rating: 3, percentage: 5 },
  { rating: 2, percentage: 0 },
  { rating: 1, percentage: 0 },
];

export function ProductReviews({ productId }: { productId: string }) {
  const [showAllReviews, setShowAllReviews] = useState(false)
  
  const displayedReviews = showAllReviews ? mockReviews : mockReviews.slice(0, 2)
  const averageRating = 4.9
  
  return (
    <div>
      {/* Rating summary */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        <div className="text-center">
          <div className="text-4xl font-bold">{averageRating}</div>
          <div className="flex items-center justify-center my-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-primary text-primary" />
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            Based on {mockReviews.length} reviews
          </div>
        </div>
        
        <div className="space-y-2">
          {ratingDistribution.map((item) => (
            <div key={item.rating} className="flex items-center gap-3">
              <div className="w-8 text-sm text-right">{item.rating}★</div>
              <Progress value={item.percentage} className="h-2" />
              <div className="w-10 text-sm text-muted-foreground">{item.percentage}%</div>
            </div>
          ))}
        </div>
      </div>
      
      <Separator className="my-6" />
      
      {/* Reviews list */}
      <div className="space-y-6">
        {displayedReviews.map((review) => (
          <div key={review.id}>
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarImage src={review.user.avatarSrc} alt={review.user.name} />
                <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{review.user.name}</h4>
                  <span className="text-sm text-muted-foreground">{review.date}</span>
                </div>
                <div className="flex items-center my-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < review.rating ? 'fill-primary text-primary' : 'text-muted'}`} 
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mt-2">{review.comment}</p>
              </div>
            </div>
            {review.id < displayedReviews.length && <Separator className="my-6" />}
          </div>
        ))}
      </div>
      
      {mockReviews.length > 2 && !showAllReviews && (
        <Button 
          variant="outline" 
          className="mt-6"
          onClick={() => setShowAllReviews(true)}
        >
          Show all {mockReviews.length} reviews
        </Button>
      )}
    </div>
  )
}