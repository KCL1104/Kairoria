"use client"

import { Clock, MessageSquare, Shield, Star } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface OwnerProps {
  name: string
  rating: number
  reviews: number
  responseRate: number
  responseTime: string
  memberSince: string
  avatarSrc: string
}

export function OwnerCard({ owner }: { owner: OwnerProps }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={owner.avatarSrc} alt={owner.name} />
            <AvatarFallback>{owner.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">Owned by {owner.name}</h3>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="text-sm">{owner.rating} • {owner.reviews} reviews</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Member since {owner.memberSince}
            </p>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-3">
          <div className="flex gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Response rate: {owner.responseRate}%</p>
              <p className="text-xs text-muted-foreground">
                Usually responds {owner.responseTime}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Verified owner</p>
              <p className="text-xs text-muted-foreground">
                Identity and contact information verified
              </p>
            </div>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full mt-6"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Contact {owner.name}
        </Button>
      </CardContent>
    </Card>
  )
}