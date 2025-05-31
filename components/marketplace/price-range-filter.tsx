"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"

export function PriceRangeFilter() {
  const [priceRange, setPriceRange] = useState([0, 100])
  
  return (
    <div>
      <h3 className="font-semibold mb-4">Price Range ($/day)</h3>
      <Slider
        defaultValue={priceRange}
        max={100}
        step={1}
        onValueChange={(value) => setPriceRange(value as [number, number])}
        className="mb-6"
      />
      <div className="flex items-center justify-between">
        <div className="border rounded-md p-2 w-20 text-center font-medium">
          ${priceRange[0]}
        </div>
        <div className="text-muted-foreground">to</div>
        <div className="border rounded-md p-2 w-20 text-center font-medium">
          ${priceRange[1]}
        </div>
      </div>
      <Separator className="my-4" />
    </div>
  )
}