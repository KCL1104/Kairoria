"use client"

import { useState } from "react"
import Link from "next/link"
import { Edit, MapPin, Star } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ProfileListings } from "@/components/profile/profile-listings"
import { ProfileRentals } from "@/components/profile/profile-rentals"
import { ProfileReviews } from "@/components/profile/profile-reviews"

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("listings")
  
  // Mock user data - in a real app, this would come from the authentication provider
  const user = {
    id: "user-1",
    name: "David Chen",
    location: "San Francisco, CA",
    bio: "Hi there! I'm a passionate photographer and gadget enthusiast. I love sharing my equipment with others who might need it for special occasions or trying before buying.",
    memberSince: "August 2022",
    avatarSrc: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg",
    rating: 4.8,
    reviews: 42,
    stats: {
      listings: 12,
      rentals: 8,
      completed: 37,
    },
    verified: {
      email: true,
      phone: true,
      id: true,
      facebook: true,
    },
  }
  
  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
        {/* Profile Sidebar */}
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center p-6 border rounded-lg">
            <div className="relative mb-4 group">
              <Avatar className="h-32 w-32">
                <AvatarImage src={user.avatarSrc} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <Button 
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit profile picture</span>
              </Button>
            </div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <div className="flex items-center gap-1 mt-1 justify-center">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{user.location}</span>
            </div>
            <div className="flex items-center gap-1 mt-2 justify-center">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="text-sm font-medium">{user.rating}</span>
              <span className="text-sm text-muted-foreground">({user.reviews} reviews)</span>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Member since {user.memberSince}
            </p>
            <Button className="w-full mt-4">Edit Profile</Button>
          </div>
          
          <div className="border rounded-lg p-6">
            <h2 className="font-semibold mb-4">Verification</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Address</span>
                <Badge variant={user.verified.email ? "default" : "outline"}>
                  {user.verified.email ? "Verified" : "Unverified"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Phone Number</span>
                <Badge variant={user.verified.phone ? "default" : "outline"}>
                  {user.verified.phone ? "Verified" : "Unverified"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Government ID</span>
                <Badge variant={user.verified.id ? "default" : "outline"}>
                  {user.verified.id ? "Verified" : "Unverified"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Facebook</span>
                <Badge variant={user.verified.facebook ? "default" : "outline"}>
                  {user.verified.facebook ? "Connected" : "Not Connected"}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-6">
            <h2 className="font-semibold mb-4">Bio</h2>
            <p className="text-sm text-muted-foreground">{user.bio}</p>
            <Button variant="ghost" size="sm" className="mt-2">
              <Edit className="h-3 w-3 mr-1" />
              Edit Bio
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 text-center">
              <h3 className="text-3xl font-bold">{user.stats.listings}</h3>
              <p className="text-sm text-muted-foreground">Active Listings</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <h3 className="text-3xl font-bold">{user.stats.rentals}</h3>
              <p className="text-sm text-muted-foreground">Current Rentals</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <h3 className="text-3xl font-bold">{user.stats.completed}</h3>
              <p className="text-sm text-muted-foreground">Completed Transactions</p>
            </div>
          </div>
          
          <Tabs defaultValue="listings" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="listings">My Listings</TabsTrigger>
              <TabsTrigger value="rentals">My Rentals</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <div className="mt-6">
              <TabsContent value="listings" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">My Listings</h2>
                  <Link href="/profile/listings/new">
                    <Button>
                      List a New Item
                    </Button>
                  </Link>
                </div>
                <Separator />
                <ProfileListings />
              </TabsContent>
              
              <TabsContent value="rentals" className="space-y-4">
                <h2 className="text-xl font-semibold">My Rentals</h2>
                <Separator />
                <ProfileRentals />
              </TabsContent>
              
              <TabsContent value="reviews" className="space-y-4">
                <h2 className="text-xl font-semibold">Reviews</h2>
                <Separator />
                <ProfileReviews />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}