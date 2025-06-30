"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useProtectedRoute } from "@/hooks/use-protected-route"
import { useAuth } from "@/contexts/SupabaseAuthContext"
import { fetchUserProducts } from "@/lib/supabase-client"
import { Product, convertFromStorageAmount } from "@/lib/data"
import { useToast } from "@/hooks/use-toast"

export default function ProfileListingsPage() {
  const { isLoading: authLoading } = useProtectedRoute();
  const { profile, isProfileLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadUserProducts = async () => {
      if (!profile?.id) return;
      
      try {
        setIsLoading(true);
        const userProducts = await fetchUserProducts(profile.id);
        setProducts(userProducts);
      } catch (error) {
        console.error('Error fetching user products:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your listings"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (profile?.id && !authLoading && !isProfileLoading) {
      loadUserProducts();
    }
  }, [profile?.id, authLoading, isProfileLoading, toast]);

  // Show loading state while checking authentication or fetching data
  if (authLoading || isProfileLoading) {
    return (
      <div className="container max-w-4xl py-10">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center min-h-[500px]">
          <div className="text-center">
            <p className="text-muted-foreground">Profile not found</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'listed':
        return <Badge variant="default">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'unlisted':
        return <Badge variant="outline">Unlisted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Listings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your listed items and track their performance
            </p>
          </div>
          <Link href="/profile/listings/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              List New Item
            </Button>
          </Link>
        </div>

        <Separator className="mb-8" />

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading your listings...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
              <p className="text-muted-foreground mb-6">
                Start earning by listing your first item for rent
              </p>
              <Link href="/profile/listings/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Listing
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold">{products.length}</div>
                  <p className="text-xs text-muted-foreground">Total Listings</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-green-600">
                    {products.filter(p => p.status === 'listed').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Active</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-orange-600">
                    {products.filter(p => p.status === 'pending').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-gray-600">
                    {products.filter(p => p.status === 'unlisted').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Unlisted</p>
                </CardContent>
              </Card>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
                      {getStatusBadge(product.status)}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="pb-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Price per day:</span>
                        <span className="font-medium">
                          ${convertFromStorageAmount(product.price_per_day)}/day (USDC)
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium">{product.location}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Created:</span>
                        <span className="font-medium">
                          {new Date(product.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0">
                    <div className="flex gap-2 w-full">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/marketplace/${product.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        {product.status === 'listed' ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}