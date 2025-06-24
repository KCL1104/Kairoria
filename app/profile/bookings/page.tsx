'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Eye, 
  MessageCircle, 
  XCircle,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Package
} from 'lucide-react'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { supabase } from '@/lib/supabase-client'

interface Booking {
  id: string
  product_id: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  start_date: string
  end_date: string
  total_price: number
  created_at: string
  confirmed_at?: string
  completed_at?: string
  cancelled_at?: string
  products: {
    title: string
    location: string
    owner_profile: {
      display_name: string
      username: string
    }
  }
}

interface BookingsResponse {
  renter_bookings: Booking[]
  owner_bookings: Booking[]
  total_count: number
}

export default function UserBookingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const [bookings, setBookings] = useState<BookingsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('renter')
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    fetchBookings()
  }, [user])

  const fetchBookings = async () => {
    try {
      const { data: { session } } = await supabase!.auth.getSession()
      
      const response = await fetch('/api/bookings/user', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bookings')
      }

      setBookings(data)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast({
        variant: "destructive",
        title: "Failed to load bookings",
        description: error instanceof Error ? error.message : "Please try again later"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { data: { session } } = await supabase!.auth.getSession()
      
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel booking')
      }

      toast({
        title: "Booking cancelled",
        description: "Your booking has been successfully cancelled"
      })

      // Refresh bookings
      fetchBookings()
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast({
        variant: "destructive",
        title: "Failed to cancel booking",
        description: error instanceof Error ? error.message : "Please try again later"
      })
    }
  }

  const canCancelBooking = (booking: Booking) => {
    if (booking.status !== 'confirmed') return false
    
    const startDate = new Date(booking.start_date)
    const now = new Date()
    const oneDayBefore = new Date(startDate.getTime() - 24 * 60 * 60 * 1000)
    
    return now < oneDayBefore
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'completed':
        return <Package className="w-4 h-4" />
      case 'cancelled':
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const filterBookings = (bookingsList: Booking[]) => {
    if (filter === 'all') return bookingsList
    return bookingsList.filter(booking => booking.status === filter)
  }

  const renderBookingCard = (booking: Booking, isOwner: boolean = false) => (
    <Card key={booking.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{booking.products.title}</h3>
            <p className="text-gray-600 text-sm flex items-center">
              <User className="w-4 h-4 mr-1" />
              {isOwner ? 'Rented by' : 'Owned by'} {booking.products.owner_profile.display_name}
            </p>
          </div>
          <Badge className={getStatusColor(booking.status)}>
            {getStatusIcon(booking.status)}
            <span className="ml-1">{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
          </Badge>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            {booking.products.location}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
          </div>
          <div className="flex items-center text-sm font-medium">
            <span>Total: {booking.total_price} USDC</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/booking/confirmation/${booking.id}`)}
          >
            <Eye className="w-4 h-4 mr-1" />
            View Details
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/messages?user=${booking.products.owner_profile.username}`)}
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Contact
          </Button>

          {!isOwner && canCancelBooking(booking) && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleCancelBooking(booking.id)}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading your bookings...</p>
        </div>
      </div>
    )
  }

  if (!bookings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p>Failed to load bookings</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">Manage your rental bookings and items you're renting out</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="renter">My Rentals ({bookings.renter_bookings.length})</TabsTrigger>
            <TabsTrigger value="owner">My Listings ({bookings.owner_bookings.length})</TabsTrigger>
          </TabsList>

          {/* Filter Buttons */}
          <div className="flex space-x-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              Pending
            </Button>
            <Button
              variant={filter === 'confirmed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('confirmed')}
            >
              Confirmed
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('completed')}
            >
              Completed
            </Button>
            <Button
              variant={filter === 'cancelled' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('cancelled')}
            >
              Cancelled
            </Button>
          </div>

          <TabsContent value="renter" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Items You're Renting</CardTitle>
                <CardDescription>
                  Bookings where you are the renter
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filterBookings(bookings.renter_bookings).length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                    <p className="text-gray-600 mb-4">
                      {filter === 'all' 
                        ? "You haven't made any bookings yet." 
                        : `No ${filter} bookings found.`}
                    </p>
                    <Button onClick={() => router.push('/marketplace')}>
                      Browse Marketplace
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filterBookings(bookings.renter_bookings).map(booking => 
                      renderBookingCard(booking, false)
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="owner" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Listed Items</CardTitle>
                <CardDescription>
                  Bookings for items you own
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filterBookings(bookings.owner_bookings).length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                    <p className="text-gray-600 mb-4">
                      {filter === 'all'
                        ? "No one has booked your items yet."
                        : `No ${filter} bookings found.`}
                    </p>
                    <Button onClick={() => router.push('/profile/listings/new')}>
                      List an Item
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filterBookings(bookings.owner_bookings).map(booking => 
                      renderBookingCard(booking, true)
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}