"use client"

import { useState } from "react"
import { MapPin, Ruler } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"

export function LocationFilter() {
  const [location, setLocation] = useState("")
  const [radius, setRadius] = useState([10])
  
  return (
    <div>
      <h3 className="font-semibold mb-4">Location</h3>
      <div className="relative mb-4">
        <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Enter your location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="pl-8"
        />
      </div>
      <div className="mb-1 flex items-center justify-between">
        <h4 className="text-sm font-medium">Distance</h4>
        <span className="text-sm text-muted-foreground">{radius[0]} km</span>
      </div>
      <Slider
        defaultValue={radius}
        max={50}
        step={1}
        onValueChange={(value) => setRadius(value)}
      />
      <Separator className="my-4" />
    </div>
  )
}