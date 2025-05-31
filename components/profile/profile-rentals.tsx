"use client"

import { Calendar, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

// Mock data for user's rentals
const mockRentals = [
  {
    id: "r1",
    title: "Mountain Bike - Trek",
    owner: "James Taylor",
    location: "Boulder, CO",
    startDate: "May 5, 2023",
    endDate: "May 8, 2023",
    price: 75,
    total: 225,
    status: "active",
    imageSrc: "https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg"
  },
  {
    id: "r2",
    title: "Stand Mixer - KitchenAid",
    owner: "Emily Wilson",
    location: "Portland, OR",
    startDate: "May 15, 2023",
    endDate: "May 22, 2023",
    price: 20,
    total: 140,
    status: "upcoming",
    imageSrc: "https://images.pexels.com/photos/6996142/pexels-photo-6996142.jpeg"
  },
  {
    id: "r3",
    title: "Snowboard with Bindings",
    owner: "Alex Thompson",
    location: "Salt Lake City, UT",
    startDate: "April 10, 2023",
    endDate: "April 17, 2023",
    price: 30,
    total: 210,
    status: "completed",
    imageSrc: "https://images.pexels.com/photos/376697/pexels-photo-376697.jpeg"
  },
];

function RentalCard({ rental }: { rental: typeof mockRentals[0] }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <img
          src={rental.imageSrc}
          alt={rental.title}
          className="w-full h-48 object-cover"
        />
        <Badge 
          className="absolute top-2 right-2"
          variant={
            rental.status === "active" 
              ? "default" 
              : rental.status === "upcoming" 
              ? "secondary" 
              : "outline"
          }
        >
          {rental.status === "active" 
            ? "Active" 
            : rental.status === "upcoming" 
            ? "Upcoming"
            : "Completed"}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium truncate">{rental.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          From {rental.owner}
        </p>
        
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{rental.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{rental.startDate} - {rental.endDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>${rental.price}/day • ${rental.total} total</span>
          </div>
        </div>
        
        <div className="mt-4 flex gap-2">
          {rental.status === "active" && (
            <Button variant="outline" size="sm" className="w-full">Extend</Button>
          )}
          <Button size="sm" className="w-full">
            {rental.status === "completed" ? "Rate & Review" : "View Details"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProfileRentals() {
  return (
    <div>
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockRentals.map((rental) => (
              <RentalCard key={rental.id} rental={rental} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="active">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockRentals.filter(r => r.status === "active").map((rental) => (
              <RentalCard key={rental.id} rental={rental} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="upcoming">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockRentals.filter(r => r.status === "upcoming").map((rental) => (
              <RentalCard key={rental.id} rental={rental} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="completed">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockRentals.filter(r => r.status === "completed").map((rental) => (
              <RentalCard key={rental.id} rental={rental} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}