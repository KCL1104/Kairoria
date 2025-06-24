'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Wallet, 
  MessageCircle, 
  Download,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { supabase } from '@/lib/supabase-client'

interface BookingDetails {
  id: string
  product_id: number
  status: string
  start_date: string
  end_date: string
  total_price: number
  created_at: string
  confirmed_at: string
  payment_intent_id: string
  products: {
    title: string
    description: string
    location: string
    images?: string[]
    owner_profile: {
      display_name: string
      username: string
      avatar_url?: string
    }
  }
  renter_profile: {
    display_name: string
    username: string
    solana_address: string
  }
}

export default function BookingConfirmationPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { user } = useAuth()

  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const bookingId = params.bookingId as string

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    fetchBookingDetails()
  }, [user, bookingId])

  const fetchBookingDetails = async () => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized')
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`/api/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch booking details')
      }

      setBooking(data.booking)
    } catch (error) {
      console.error('Error fetching booking:', error)
      setError(error instanceof Error ? error.message : 'Failed to load booking details')
      toast({
        variant: "destructive",
        title: "Failed to load booking",
        description: error instanceof Error ? error.message : "Please try again later"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleContactOwner = () => {
    // Navigate to messages page with the owner
    router.push(`/messages?user=${booking?.products.owner_profile.username}`)
  }

  const handleViewBookings = () => {
    router.push('/profile/bookings')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
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

  const canCancel = () => {
    if (!booking || booking.status !== 'confirmed') return false
    
    const startDate = new Date(booking.start_date)
    const now = new Date()
    const oneDayBefore = new Date(startDate.getTime() - 24 * 60 * 60 * 1000)
    
    return now < oneDayBefore
  }

  const handleCancelBooking = async () => {
    if (!canCancel()) return

    try {
      if (!supabase) throw new Error('Supabase client not initialized')
      const { data: { session } } = await supabase.auth.getSession()
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

      // Refresh booking details
      fetchBookingDetails()
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast({
        variant: "destructive",
        title: "Failed to cancel booking",
        description: error instanceof Error ? error.message : "Please try again later"
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-4">
            {error || "The booking you're looking for doesn't exist or you don't have permission to view it."}
          </p>
          <Button onClick={() => router.push('/marketplace')}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">Your rental has been successfully booked and payment confirmed</p>
        </div>

        {/* Booking Status */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Booking #{booking.id.slice(-8).toUpperCase()}</h2>
                  <p className="text-gray-600">Confirmed on {formatDate(booking.confirmed_at)} at {formatTime(booking.confirmed_at)}</p>
                </div>
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rental Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{booking.products.title}</h3>
                  <p className="text-gray-600 mt-1">{booking.products.description}</p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm text-gray-600">{booking.products.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Rental Period</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Owner</p>
                      <p className="text-sm text-gray-600">{booking.products.owner_profile.display_name}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5" />
                  <span>Payment Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Amount</span>
                  <span className="font-semibold">{booking.total_price} USDC</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Payment Method</span>
                  <span className="text-sm">Solana Wallet</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Transaction ID</span>
                  <span className="text-xs font-mono">{booking.payment_intent_id}</span>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    💡 Your payment is held in escrow and will be released to the owner when the rental period ends.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
                <CardDescription>What you can do now</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleContactOwner}
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Owner
                </Button>

                <Button 
                  onClick={handleViewBookings}
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View All Bookings
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.print()}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>

                {canCancel() && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 text-sm">
                          You can cancel this booking up to 24 hours before the start date.
                        </p>
                      </div>
                      <Button 
                        onClick={handleCancelBooking}
                        variant="destructive" 
                        className="w-full"
                      >
                        Cancel Booking
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Important Information */}
            <Card>
              <CardHeader>
                <CardTitle>Important Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p>Please coordinate pickup/delivery details with the owner before the rental date.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p>Ensure you understand the item's condition and any usage restrictions.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p>Report any issues or damages immediately to avoid additional charges.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}