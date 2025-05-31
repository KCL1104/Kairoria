"use client"

import { Check, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: string
  timestamp: string
  isOwnMessage: boolean
  status?: "sent" | "delivered" | "read"
  imageSrc?: string
}

export function ChatMessage({
  message,
  timestamp,
  isOwnMessage,
  status = "sent",
  imageSrc,
}: ChatMessageProps) {
  return (
    <div className={cn(
      "flex",
      isOwnMessage ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[70%] rounded-lg p-3",
        isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        {imageSrc && (
          <img
            src={imageSrc}
            alt="Shared image"
            className="rounded-md mb-2 max-w-full"
          />
        )}
        <p>{message}</p>
        <div className={cn(
          "flex items-center justify-end gap-1 mt-1",
          isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          <span className="text-xs">{timestamp}</span>
          {isOwnMessage && (
            status === "sent" ? (
              <Clock className="h-3 w-3" />
            ) : status === "delivered" ? (
              <Check className="h-3 w-3" />
            ) : (
              <div className="flex">
                <Check className="h-3 w-3" />
                <Check className="h-3 w-3 -ml-1" />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}