"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ProfileRentals() {
  return (
    <div>
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <Card className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No rentals yet</h3>
            <p className="text-muted-foreground mb-4">
              You haven't rented any items yet. Browse the marketplace to find items to rent!
            </p>
            <Button>Browse Marketplace</Button>
          </Card>
        </TabsContent>
        
        <TabsContent value="active">
          <Card className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No active rentals</h3>
            <p className="text-muted-foreground">
              You don't have any active rentals at the moment.
            </p>
          </Card>
        </TabsContent>
        
        <TabsContent value="upcoming">
          <Card className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No upcoming rentals</h3>
            <p className="text-muted-foreground">
              You don't have any upcoming rentals scheduled.
            </p>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed">
          <Card className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No completed rentals</h3>
            <p className="text-muted-foreground">
              You haven't completed any rentals yet.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}