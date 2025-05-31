"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, ImagePlus, Plus, Trash, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function NewListingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState<string[]>([
    "https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg",
  ])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // In a real application, this would submit the form data to an API
    setTimeout(() => {
      setIsLoading(false)
      window.location.href = "/profile?tab=listings"
    }, 1500)
  }
  
  const handleAddImage = () => {
    // In a real app, this would open a file picker
    const placeholderImages = [
      "https://images.pexels.com/photos/243757/pexels-photo-243757.jpeg",
      "https://images.pexels.com/photos/1787235/pexels-photo-1787235.jpeg",
    ]
    
    if (images.length < 5) {
      setImages([...images, placeholderImages[images.length - 1]])
    }
  }
  
  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }
  
  return (
    <div className="container py-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/profile" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-2">List a New Item</h1>
      <p className="text-muted-foreground mb-8">
        Share your items with others and earn while contributing to a more sustainable future.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-8">
          {/* Item Details */}
          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
              <CardDescription>
                Provide accurate details about your item to help others find it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Professional DSLR Camera - Canon EOS 5D Mark IV"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="tools">Tools</SelectItem>
                      <SelectItem value="outdoor">Outdoor Gear</SelectItem>
                      <SelectItem value="home">Home Goods</SelectItem>
                      <SelectItem value="sports">Sports Equipment</SelectItem>
                      <SelectItem value="vehicles">Vehicles</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select>
                    <SelectTrigger id="condition">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Like New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="worn">Worn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your item in detail, including any special features, accessories, or known issues."
                  rows={5}
                  required
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>
                Add up to 5 high-quality photos of your item.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                    <img
                      src={image}
                      alt={`Item image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => handleRemoveImage(index)}
                      type="button"
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                {images.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center p-4 hover:border-primary transition-colors"
                  >
                    <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Add Photo</span>
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Pricing & Availability */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Availability</CardTitle>
              <CardDescription>
                Set your rental rates and availability.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="daily-rate">Daily Rate ($)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-80">
                            Set a competitive daily rate based on your item's value and condition.
                            The platform fee (10%) will be deducted from your earnings.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="daily-rate"
                    type="number"
                    min="1"
                    placeholder="25"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weekly-rate">Weekly Rate ($)</Label>
                  <Input
                    id="weekly-rate"
                    type="number"
                    min="1"
                    placeholder="150"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="monthly-rate">Monthly Rate ($)</Label>
                  <Input
                    id="monthly-rate"
                    type="number"
                    min="1"
                    placeholder="500"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="security-deposit">Security Deposit ($)</Label>
                <Input
                  id="security-deposit"
                  type="number"
                  min="0"
                  placeholder="100"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional but recommended. This amount will be held and returned after the item is safely returned.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Availability</Label>
                <div className="text-sm text-muted-foreground mb-2">
                  By default, your item will be shown as available. You can manage your calendar after creating the listing.
                </div>
                <div className="p-4 bg-muted/30 rounded-md">
                  <p className="text-sm">
                    Your listing's calendar will be open by default. You can block specific dates or set recurring unavailability after creating the listing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Item Location</CardTitle>
              <CardDescription>
                Specify where renters can pick up and return your item.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Enter your address"
                  required
                />
              </div>
              <div className="p-4 border rounded-md">
                <p className="text-sm text-muted-foreground">
                  For privacy reasons, only your general area will be shown to others until you confirm a rental.
                  The exact address will only be shared with approved renters.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Separator />
          
          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button variant="outline" asChild>
              <Link href="/profile">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating Listing..." : "Create Listing"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}