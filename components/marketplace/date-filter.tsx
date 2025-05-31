"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"

export function DateFilter() {
  const [date, setDate] = useState<Date | undefined>(undefined)
  
  return (
    <div>
      <h3 className="font-semibold mb-4">Availability</h3>
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
      />
      <Separator className="my-4" />
    </div>
  )
}