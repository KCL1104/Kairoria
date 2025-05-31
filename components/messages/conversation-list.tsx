"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

// Mock data for conversations
const mockConversations = [
  {
    id: "1",
    user: {
      name: "David Chen",
      avatarSrc: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg",
    },
    lastMessage: "Just bring your ID, and we'll complete the handover checklist together to make sure everything's in order.",
    timestamp: "10:43 AM",
    unread: false,
    product: {
      name: "Professional DSLR Camera",
      imageSrc: "https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg"
    }
  },
  {
    id: "2",
    user: {
      name: "Sarah Johnson",
      avatarSrc: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
    },
    lastMessage: "I can meet you at the coffee shop on Main St to exchange the projector.",
    timestamp: "Yesterday",
    unread: true,
    product: {
      name: "Portable Projector",
      imageSrc: "https://images.pexels.com/photos/1117132/pexels-photo-1117132.jpeg"
    }
  },
  {
    id: "3",
    user: {
      name: "Michael Rodriguez",
      avatarSrc: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
    },
    lastMessage: "Thanks for the quick response! I'd like to rent it for two weeks starting next Monday.",
    timestamp: "Yesterday",
    unread: false,
    product: {
      name: "Mountain Bike",
      imageSrc: "https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg"
    }
  },
  {
    id: "4",
    user: {
      name: "Emily Wilson",
      avatarSrc: "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg",
    },
    lastMessage: "Is the stand mixer still available for this weekend?",
    timestamp: "Tuesday",
    unread: false,
    product: {
      name: "Stand Mixer",
      imageSrc: "https://images.pexels.com/photos/6996142/pexels-photo-6996142.jpeg"
    }
  },
  {
    id: "5",
    user: {
      name: "James Taylor",
      avatarSrc: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
    },
    lastMessage: "Perfect! I'll see you on Friday at 3pm to pick up the lawn mower.",
    timestamp: "Monday",
    unread: false,
    product: {
      name: "Lawn Mower",
      imageSrc: "https://images.pexels.com/photos/589/garden-gardening-grass-lawn.jpg"
    }
  },
];

interface ConversationListProps {
  selectedConversation: string | null
  onSelectConversation: (id: string) => void
}

export function ConversationList({ selectedConversation, onSelectConversation }: ConversationListProps) {
  return (
    <div>
      {mockConversations.map((conversation) => (
        <div 
          key={conversation.id}
          className={cn(
            "p-3 hover:bg-muted cursor-pointer transition-colors",
            selectedConversation === conversation.id && "bg-muted"
          )}
          onClick={() => onSelectConversation(conversation.id)}
        >
          <div className="flex gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img 
                  src={conversation.user.avatarSrc}
                  alt={conversation.user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {conversation.unread && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className={cn(
                  "font-medium truncate",
                  conversation.unread && "font-semibold"
                )}>
                  {conversation.user.name}
                </h3>
                <span className={cn(
                  "text-xs text-muted-foreground shrink-0 ml-2",
                  conversation.unread && "text-primary font-medium"
                )}>
                  {conversation.timestamp}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-4 h-4 rounded-full overflow-hidden shrink-0">
                  <img 
                    src={conversation.product.imageSrc}
                    alt={conversation.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {conversation.product.name}
                </p>
              </div>
              <p className={cn(
                "text-sm text-muted-foreground truncate mt-0.5",
                conversation.unread && "text-foreground font-medium"
              )}>
                {conversation.lastMessage}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}