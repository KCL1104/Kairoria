"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Edit, MapPin, Star } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ProfileListings } from "@/components/profile/profile-listings"
import { ProfileRentals } from "@/components/profile/profile-rentals"
import { ProfileReviews } from "@/components/profile/profile-reviews"
import { useProtectedRoute } from "@/hooks/use-protected-route"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"

interface UserProfile {
  id: string
  full_name?: string
  email: string
  bio?: string
  avatar_url?: string
  location?: string
  phone?: string
  is_verified: boolean
  updated_at: string
}

export default function ProfilePage() {
  // Protect this route - redirect to login if not authenticated
  const { isLoading: authLoading } = useProtectedRoute();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("listings")
  const { toast } = useToast();
  const router = useRouter();
  
  // Check for sign-out success message in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const signOutSuccess = urlParams.get('signout');
      
      if (signOutSuccess === 'success') {
        toast({
          variant: "success",
          title: "Successfully signed out",
          description: "You have been securely signed out of your account"
        });
        
        // Clean up the URL parameter
        const url = new URL(window.location.href);
        url.searchParams.delete('signout');
        window.history.replaceState({}, document.title, url);
      }
    }
  }, [toast]);

  // Fetch user profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        if (!supabase) {
          toast({
            variant: "destructive",
            title: "Configuration Error",
            description: "Database connection not available"
          });
          return;
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error getting user:', userError);
          return;
        }

        if (!user) {
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          toast({
            variant: "destructive",
            title: "Error loading profile",
            description: "Failed to load your profile data"
          });
          return;
        }

        setProfile(profileData);

        // Check if profile is incomplete and redirect to complete profile
        if (!profileData.phone || !profileData.location || !profileData.is_verified) {
          router.push('/complete-profile');
          return;
        }

      } catch (error) {
        console.error('Error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred"
        });
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchProfile();
    }
  }, [authLoading, toast, router]);
  
  // Show loading state while checking authentication or fetching data
  if (authLoading || loading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center min-h-[500px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading your profile...</p>
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
            <Button 
              onClick={() => router.push('/complete-profile')} 
              className="mt-4"
            >
              Complete Your Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
        {/* Profile Sidebar */}
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center p-6 border rounded-lg">
            <div className="relative mb-4 group">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name || "User"} />
                <AvatarFallback>
                  {profile.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <Button 
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => router.push('/complete-profile')}
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit profile picture</span>
              </Button>
            </div>
            <h1 className="text-2xl font-bold">{profile.full_name || "User"}</h1>
            {profile.location && (
              <div className="flex items-center gap-1 mt-1 justify-center">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{profile.location}</span>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-4">
              Member since {new Date(profile.updated_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
              })}
            </p>
            <Button 
              className="w-full mt-4"
              onClick={() => router.push('/complete-profile')}
            >
              Edit Profile
            </Button>
          </div>
          
          <div className="border rounded-lg p-6">
            <h2 className="font-semibold mb-4">Verification</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Address</span>
                <Badge variant="default">Verified</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Phone Number</span>
                <Badge variant={profile.is_verified ? "default" : "outline"}>
                  {profile.is_verified ? "Verified" : "Unverified"}
                </Badge>
              </div>
            </div>
          </div>
          
          {profile.bio && (
            <div className="border rounded-lg p-6">
              <h2 className="font-semibold mb-4">Bio</h2>
              <p className="text-sm text-muted-foreground">{profile.bio}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2"
                onClick={() => router.push('/complete-profile')}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit Bio
              </Button>
            </div>
          )}
        </div>
        
        {/* Main Content */}
        <div className="space-y-6">
          <Tabs defaultValue="listings" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="listings">My Listings</TabsTrigger>
              <TabsTrigger value="rentals">My Rentals</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <div className="mt-6">
              <TabsContent value="listings" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">My Listings</h2>
                  <Link href="/profile/listings/new">
                    <Button>
                      List a New Item
                    </Button>
                  </Link>
                </div>
                <Separator />
                <ProfileListings />
              </TabsContent>
              
              <TabsContent value="rentals" className="space-y-4">
                <h2 className="text-xl font-semibold">My Rentals</h2>
                <Separator />
                <ProfileRentals />
              </TabsContent>
              
              <TabsContent value="reviews" className="space-y-4">
                <h2 className="text-xl font-semibold">Reviews</h2>
                <Separator />
                <ProfileReviews />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}