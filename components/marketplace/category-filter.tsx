"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const categories = [
  { id: "all", name: "All Categories", count: 832 },
  { id: "electronics", name: "Electronics", count: 235 },
  { id: "tools", name: "Tools", count: 312 },
  { id: "outdoor", name: "Outdoor Gear", count: 174 },
  { id: "home", name: "Home Goods", count: 189 },
  { id: "sports", name: "Sports Equipment", count: 95 },
  { id: "vehicles", name: "Vehicles", count: 42 },
  { id: "clothing", name: "Clothing", count: 78 },
  { id: "other", name: "Other", count: 29 },
]

export function CategoryFilter() {
  const [selectedCategory, setSelectedCategory] = useState("all")

  return (
    <div>
      <h3 className="font-semibold mb-4">Categories</h3>
      <ul className="space-y-1">
        {categories.map((category) => (
          <li key={category.id}>
            <button
              className={cn(
                "w-full flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted text-left",
                selectedCategory === category.id && "bg-muted"
              )}
              onClick={() => setSelectedCategory(category.id)}
            >
              <div className="flex items-center">
                {selectedCategory === category.id && (
                  <Check className="mr-2 h-4 w-4 text-primary" />
                )}
                <span className={selectedCategory === category.id ? "font-medium" : ""}>
                  {category.name}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {category.count}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Separator className="my-4" />
    </div>
  )
}