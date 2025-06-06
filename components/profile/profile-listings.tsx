"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function ProfileListings() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          No listings found
        </div>
      </div>
      
      <Card className="p-8 text-center">
        <h3 className="text-lg font-medium mb-2">No listings yet</h3>
        <p className="text-muted-foreground mb-4">
          You haven't created any listings yet. Start by listing your first item!
        </p>
        <Button>Create Your First Listing</Button>
      </Card>
    </div>
  )
}