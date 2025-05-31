"use client"

import { Star } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data for reviews
const mockReviewsReceived = [
  {
    id: 1,
    user: {
      name: "Michael Rodriguez",
      avatarSrc: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
    },
    rating: 5,
    date: "April 18, 2023",
    comment: "David's camera was in perfect condition and he was very helpful in explaining how to use some of the advanced features. Would definitely rent from him again!",
    product: "Professional DSLR Camera"
  },
  {
    id: 2,
    user: {
      name: "Sarah Johnson",
      avatarSrc: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
    },
    rating: 5,
    date: "March 5, 2023",
    comment: "Great experience! The tent was clean and exactly as described. David was punctual for both pickup and return. Highly recommended!",
    product: "Camping Tent - 4 Person"
  },
  {
    id: 3,
    user: {
      name: "Alex Thompson",
      avatarSrc: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg",
    },
    rating: 4,
    date: "February 22, 2023",
    comment: "The projector worked well for my presentation. David was responsive and accommodating with the pickup time. The only small issue was a slight discoloration on one corner of the projection.",
    product: "Portable Projector"
  },
];

const mockReviewsGiven = [
  {
    id: 1,
    user: {
      name: "Emily Wilson",
      avatarSrc: "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg",
    },
    rating: 5,
    date: "May 1, 2023",
    comment: "Emily took great care of my camera! Returned it in the same condition and was very communicative throughout the process.",
    product: "Professional DSLR Camera"
  },
  {
    id: 2,
    user: {
      name: "James Taylor",
      avatarSrc: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
    },
    rating: 5,
    date: "April 8, 2023",
    comment: "James was very respectful with the equipment and returned it on time. Would happily rent to him again.",
    product: "Electric Drill"
  },
];

export function ProfileReviews() {
  return (
    <Tabs defaultValue="received">
      <TabsList className="mb-4">
        <TabsTrigger value="received">Reviews Received ({mockReviewsReceived.length})</TabsTrigger>
        <TabsTrigger value="given">Reviews Given ({mockReviewsGiven.length})</TabsTrigger>
      </TabsList>
      
      <TabsContent value="received">
        <div className="space-y-6">
          {mockReviewsReceived.map((review, index) => (
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
                  <p className="text-sm text-muted-foreground mb-1">Product: {review.product}</p>
                  <p className="text-muted-foreground">{review.comment}</p>
                </div>
              </div>
              {index < mockReviewsReceived.length - 1 && <Separator className="my-6" />}
            </div>
          ))}
        </div>
      </TabsContent>
      
      <TabsContent value="given">
        <div className="space-y-6">
          {mockReviewsGiven.map((review, index) => (
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
                  <p className="text-sm text-muted-foreground mb-1">Product: {review.product}</p>
                  <p className="text-muted-foreground">{review.comment}</p>
                </div>
              </div>
              {index < mockReviewsGiven.length - 1 && <Separator className="my-6" />}
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}