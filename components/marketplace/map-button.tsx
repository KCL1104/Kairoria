"use client"

import { useState } from "react"
import { Map } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MapView } from "@/components/marketplace/map-view"

export function MapButton() {
  const [open, setOpen] = useState(false)
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Map className="mr-2 h-4 w-4" />
          View Map
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Explore Available Items</DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-2">
          <MapView />
        </div>
      </DialogContent>
    </Dialog>
  )
}