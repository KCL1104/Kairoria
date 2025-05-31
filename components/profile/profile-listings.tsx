"use client"

import { useState } from "react"
import Link from "next/link"
import { Edit, MoreHorizontal, PauseCircle, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Mock data for user's listings
const mockListings = [
  {
    id: "1",
    title: "Professional DSLR Camera",
    category: "Electronics",
    price: 35,
    period: "day",
    status: "active",
    views: 124,
    requests: 3,
    imageSrc: "https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg"
  },
  {
    id: "2",
    title: "Electric Drill",
    category: "Tools",
    price: 10,
    period: "day",
    status: "rented",
    rentedUntil: "May 12, 2023",
    views: 87,
    requests: 2,
    imageSrc: "https://images.pexels.com/photos/957065/pexels-photo-957065.jpeg"
  },
  {
    id: "3",
    title: "Camping Tent - 4 Person",
    category: "Outdoor",
    price: 28,
    period: "day",
    status: "active",
    views: 56,
    requests: 1,
    imageSrc: "https://images.pexels.com/photos/2582818/pexels-photo-2582818.jpeg"
  },
  {
    id: "4",
    title: "Portable Projector",
    category: "Electronics",
    price: 15,
    period: "day",
    status: "paused",
    views: 32,
    requests: 0,
    imageSrc: "https://images.pexels.com/photos/1117132/pexels-photo-1117132.jpeg"
  },
];

export function ProfileListings() {
  const [viewType, setViewType] = useState<"grid" | "list">("grid")
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button 
            variant={viewType === "grid" ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewType("grid")}
          >
            Grid
          </Button>
          <Button 
            variant={viewType === "list" ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewType("list")}
          >
            List
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {mockListings.length} listings
        </div>
      </div>
      
      {viewType === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockListings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden">
              <div className="relative">
                <img
                  src={listing.imageSrc}
                  alt={listing.title}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute top-0 right-0 p-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Listing
                      </DropdownMenuItem>
                      {listing.status === "active" ? (
                        <DropdownMenuItem>
                          <PauseCircle className="mr-2 h-4 w-4" />
                          Pause Listing
                        </DropdownMenuItem>
                      ) : listing.status === "paused" ? (
                        <DropdownMenuItem>
                          <PauseCircle className="mr-2 h-4 w-4" />
                          Activate Listing
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem className="text-destructive">
                        <Trash className="mr-2 h-4 w-4" />
                        Delete Listing
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Badge 
                  className="absolute bottom-2 left-2"
                  variant={
                    listing.status === "active" 
                      ? "default" 
                      : listing.status === "rented" 
                      ? "secondary" 
                      : "outline"
                  }
                >
                  {listing.status === "active" 
                    ? "Active" 
                    : listing.status === "rented" 
                    ? `Rented until ${listing.rentedUntil}`
                    : "Paused"}
                </Badge>
              </div>
              <div className="p-4">
                <h3 className="font-medium truncate">{listing.title}</h3>
                <div className="flex items-center justify-between mt-1">
                  <Badge variant="outline">{listing.category}</Badge>
                  <span className="font-semibold">${listing.price}/{listing.period}</span>
                </div>
                <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                  <span>{listing.views} views</span>
                  <span>{listing.requests} requests</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Requests</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockListings.map((listing) => (
              <TableRow key={listing.id}>
                <TableCell className="font-medium flex items-center gap-3">
                  <div className="w-10 h-10 rounded overflow-hidden">
                    <img
                      src={listing.imageSrc}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="truncate">{listing.title}</span>
                </TableCell>
                <TableCell>{listing.category}</TableCell>
                <TableCell>${listing.price}/{listing.period}</TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      listing.status === "active" 
                        ? "default" 
                        : listing.status === "rented" 
                        ? "secondary" 
                        : "outline"
                    }
                  >
                    {listing.status === "active" 
                      ? "Active" 
                      : listing.status === "rented" 
                      ? "Rented"
                      : "Paused"}
                  </Badge>
                </TableCell>
                <TableCell>{listing.views}</TableCell>
                <TableCell>{listing.requests}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Listing
                      </DropdownMenuItem>
                      {listing.status === "active" ? (
                        <DropdownMenuItem>
                          <PauseCircle className="mr-2 h-4 w-4" />
                          Pause Listing
                        </DropdownMenuItem>
                      ) : listing.status === "paused" ? (
                        <DropdownMenuItem>
                          <PauseCircle className="mr-2 h-4 w-4" />
                          Activate Listing
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem className="text-destructive">
                        <Trash className="mr-2 h-4 w-4" />
                        Delete Listing
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}