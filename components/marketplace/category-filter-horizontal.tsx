"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  icon?: string
}

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory?: string
  onSelectCategory?: (id: string) => void
  className?: string
}

export function CategoryFilter({
  categories,
  selectedCategory = "all",
  onSelectCategory,
  className
}: CategoryFilterProps) {
  const [selected, setSelected] = useState(selectedCategory)
  
  const handleSelect = (id: string) => {
    setSelected(id)
    if (onSelectCategory) onSelectCategory(id)
  }
  
  return (
    <div className={cn("flex overflow-x-auto pb-3 no-scrollbar", className)}>
      <div className="flex gap-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleSelect(category.id)}
            className={cn(
              "flex flex-col items-center justify-center min-w-[80px] py-2 px-4 rounded-lg transition-colors",
              selected === category.id 
                ? "bg-background border border-border shadow-sm" 
                : "hover:bg-muted"
            )}
          >
            {category.icon && (
              <span className="text-2xl mb-1">{category.icon}</span>
            )}
            <span className={cn(
              "text-xs whitespace-nowrap",
              selected === category.id ? "font-medium" : "text-muted-foreground"
            )}>
              {category.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}