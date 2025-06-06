"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ProfileReviews() {
  return (
    <Tabs defaultValue="received">
      <TabsList className="mb-4">
        <TabsTrigger value="received">Reviews Received (0)</TabsTrigger>
        <TabsTrigger value="given">Reviews Given (0)</TabsTrigger>
      </TabsList>
      
      <TabsContent value="received">
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium mb-2">No reviews received yet</h3>
          <p className="text-muted-foreground mb-4">
            You haven't received any reviews yet. Start renting out your items to get your first review!
          </p>
          <Button>List Your First Item</Button>
        </Card>
      </TabsContent>
      
      <TabsContent value="given">
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium mb-2">No reviews given yet</h3>
          <p className="text-muted-foreground mb-4">
            You haven't left any reviews yet. Rent some items and share your experience!
          </p>
          <Button>Browse Marketplace</Button>
        </Card>
      </TabsContent>
    </Tabs>
  )
}