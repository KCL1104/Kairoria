"use client"

import { useState } from "react"
import { Send, Image, Smile, MoreHorizontal, Search, Phone, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConversationList } from "@/components/messages/conversation-list"
import { ChatMessage } from "@/components/messages/chat-message"

export default function MessagesPage() {
  const [messageText, setMessageText] = useState("")
  const [selectedConversation, setSelectedConversation] = useState<string | null>("1")
  
  const handleSendMessage = () => {
    if (!messageText.trim()) return
    
    // In a real app, this would send the message to the API
    console.log("Sending message:", messageText)
    setMessageText("")
  }
  
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Conversations Sidebar */}
        <div className="border rounded-lg overflow-hidden flex flex-col">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search conversations..."
                className="pl-9"
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <ConversationList 
              selectedConversation={selectedConversation} 
              onSelectConversation={setSelectedConversation} 
            />
          </ScrollArea>
        </div>
        
        {/* Chat Area */}
        {selectedConversation ? (
          <div className="border rounded-lg overflow-hidden flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <span className="font-semibold">D</span>
                </div>
                <div>
                  <h2 className="font-medium">David Chen</h2>
                  <p className="text-xs text-muted-foreground">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                    Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View profile</DropdownMenuItem>
                    <DropdownMenuItem>Block user</DropdownMenuItem>
                    <DropdownMenuItem>Report conversation</DropdownMenuItem>
                    <DropdownMenuItem>Delete conversation</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="flex flex-col gap-4">
                <ChatMessage
                  message="Hi, I'm interested in renting your DSLR camera. Is it still available next weekend?"
                  timestamp="10:34 AM"
                  isOwnMessage={false}
                  status="read"
                />
                <ChatMessage
                  message="Yes, it's available! I can rent it out from Friday to Monday. When would you like to pick it up?"
                  timestamp="10:36 AM"
                  isOwnMessage={true}
                  status="read"
                />
                <ChatMessage
                  message="That's perfect! I'd like to pick it up on Friday morning if possible. Around 10 AM?"
                  timestamp="10:38 AM"
                  isOwnMessage={false}
                  status="read"
                />
                <ChatMessage
                  message="10 AM works for me. I'll make sure the batteries are fully charged and include all the accessories mentioned in the listing."
                  timestamp="10:40 AM"
                  isOwnMessage={true}
                  status="read"
                />
                <ChatMessage
                  message="Great! Do I need to bring anything specific for verification when I pick it up?"
                  timestamp="10:42 AM"
                  isOwnMessage={false}
                  status="read"
                />
                <ChatMessage
                  message="Just bring your ID, and we'll complete the handover checklist together to make sure everything's in order."
                  timestamp="10:43 AM"
                  isOwnMessage={true}
                  status="delivered"
                />
              </div>
            </ScrollArea>
            
            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon">
                  <Image className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon">
                  <Smile className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg flex items-center justify-center">
            <div className="text-center p-6">
              <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
              <p className="text-muted-foreground">
                Choose a conversation from the list or start a new one
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}