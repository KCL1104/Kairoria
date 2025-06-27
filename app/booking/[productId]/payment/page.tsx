'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Calendar, Clock, MapPin, User, Wallet, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import WalletConnectButton from '@/components/wallet/WalletConnectButton'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { supabase } from '@/lib/supabase-client'
import { 
  getKairoriaProgram,
  createRentalTransactionInstruction,
  createPaymentInstruction,
} from '@/lib/solana-booking'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Transaction, PublicKey } from '@solana/web3.js'

interface BookingData {
  product_id: number
  product_title: string
  product_image?: string
  owner_name: string
  start_date: string
  end_date: string
  total_price: number
  currency: string
}

export default function BookingPaymentPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user } = useAuth()
  const { connected, publicKey: walletAddress, sendTransaction } = useWallet()
  const { connection } = useConnection()

  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(600) // 10 minutes in seconds
  const [expired, setExpired] = useState(false)

  const productId = params.productId as string

  // Get booking data from URL parameters
  useEffect(() => {
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const totalPrice = searchParams.get('total_price')
    const productTitle = searchParams.get('product_title')
    const ownerName = searchParams.get('owner_name')
    const currency = searchParams.get('currency')

    if (!startDate || !endDate || !totalPrice || !productTitle) {
      toast({
        variant: "destructive",
        title: "Missing booking information",
        description: "Please start the booking process again"
      })
      router.push(`/marketplace/${productId}`)
      return
    }

    setBookingData({
      product_id: parseInt(productId),
      product_title: productTitle,
      owner_name: ownerName || 'Unknown',
      start_date: startDate,
      end_date: endDate,
      total_price: parseFloat(totalPrice),
      currency: currency || 'USDC'
    })
    setLoading(false)
  }, [productId, searchParams, router, toast])

  // Countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) {
      setExpired(true)
      return
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining])

  // Create initial booking
  const createBooking = async () => {
    if (!bookingData || !walletAddress) return null

    try {
      const { data: { session } } = await supabase?.auth.getSession() ?? { data: { session: null } }
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          product_id: bookingData.product_id,
          start_date: bookingData.start_date,
          end_date: bookingData.end_date,
          total_price: bookingData.total_price,
          renter_wallet_address: walletAddress,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking')
      }

      return data
    } catch (error) {
      console.error('Booking creation error:', error)
      throw error
    }
  }

  // Handle payment process
  const handlePayment = async () => {
    if (!connected || !walletAddress) {
      toast({
        variant: "destructive",
        title: "Wallet not connected",
        description: "Please connect your Solana wallet to proceed with payment"
      })
      return
    }

    if (expired) {
      toast({
        variant: "destructive",
        title: "Booking expired",
        description: "This booking has expired. Please start a new booking."
      })
      return
    }

    try {
      setProcessing(true)

      // Step 1: Create booking
      const bookingResponse = await createBooking()
      if (!bookingResponse) {
        throw new Error('Failed to create booking')
      }

      setBookingId(bookingResponse.booking_id)

      // Step 2: Execute Solana transaction
      const { instructionData } = bookingResponse

      if (!walletAddress) {
        throw new Error('Wallet not connected.')
      }

      const provider = new AnchorProvider(connection, window.solana, AnchorProvider.defaultOptions())
      const program = getKairoriaProgram(provider)

      const createIx = await createRentalTransactionInstruction(
        program,
        instructionData.product_id,
        new PublicKey(instructionData.owner_wallet),
        instructionData.total_amount_usdc,
        instructionData.rental_start,
        instructionData.rental_end,
        instructionData.booking_id.toString()
      )

      const paymentIx = await createPaymentInstruction(
        program,
        instructionData.product_id,
        instructionData.total_amount_usdc
      )

      const transaction = new Transaction().add(createIx).add(paymentIx)

      toast({
        title: "Processing payment...",
        description: "Please approve the transaction in your wallet"
      })

      const signature = await sendTransaction(transaction, connection)

      await connection.confirmTransaction(signature, 'processed')

      // Step 3: Confirm payment
      const { data: { session } } = await supabase?.auth.getSession() ?? { data: { session: null } }
      const confirmResponse = await fetch(`/api/bookings/${bookingResponse.booking.id}/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          transaction_signature: signature,
        }),
      })

      const confirmData = await confirmResponse.json()

      if (!confirmResponse.ok) {
        throw new Error(confirmData.error || 'Failed to confirm payment')
      }

      toast({
        title: "Payment successful!",
        description: "Your booking has been confirmed"
      })

      // Redirect to booking confirmation page
      router.push(`/booking/confirmation/${bookingResponse.booking.id}`)

    } catch (error) {
      console.error('Payment error:', error)
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Failed to process payment"
      })
    } finally {
      setProcessing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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

  if (!bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p>Invalid booking data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Booking</h1>
          <p className="text-gray-600 mt-2">Secure payment via Solana blockchain</p>
        </div>

        {/* Timer */}
        <div className="mb-6">
          <Card className={`border-2 ${expired ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-center space-x-2">
                <Clock className={`w-5 h-5 ${expired ? 'text-red-600' : 'text-orange-600'}`} />
                <span className={`font-medium ${expired ? 'text-red-600' : 'text-orange-600'}`}>
                  {expired ? 'Booking Expired' : `Time remaining: ${formatTime(timeRemaining)}`}
                </span>
              </div>
              {expired && (
                <p className="text-center text-red-600 text-sm mt-2">
                  This booking has expired. Please start a new booking.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
              <CardDescription>Review your rental information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{bookingData.product_title}</h3>
                <p className="text-gray-600 flex items-center mt-1">
                  <User className="w-4 h-4 mr-1" />
                  Owned by {bookingData.owner_name}
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Rental Period</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(bookingData.start_date)} - {formatDate(bookingData.end_date)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Rental Cost</span>
                  <span className="font-medium">{bookingData.total_price} {bookingData.currency}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Platform Fee</span>
                  <span className="font-medium">Included</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span>{bookingData.total_price} {bookingData.currency}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="w-5 h-5" />
                <span>Payment Method</span>
              </CardTitle>
              <CardDescription>Pay securely with your Solana wallet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!connected ? (
                <div className="text-center space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      Connect your Solana wallet to proceed with secure payment
                    </p>
                  </div>
                  <WalletConnectButton size="lg" className="w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-green-800 font-medium">Wallet Connected</span>
                    </div>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {walletAddress?.toString().slice(0, 4)}...{walletAddress?.toString().slice(-4)}
                    </Badge>
                  </div>

                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="font-medium mb-2">Payment Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-medium">{bookingData.total_price} {bookingData.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Network:</span>
                        <span className="font-medium">Solana {process.env.NEXT_PUBLIC_SOLANA_NETWORK}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Escrow:</span>
                        <span className="font-medium">Smart Contract Protected</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handlePayment}
                    disabled={processing || expired || !connected}
                    size="lg"
                    className="w-full"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing Payment...
                      </>
                    ) : expired ? (
                      'Booking Expired'
                    ) : (
                      `Pay ${bookingData.total_price} ${bookingData.currency}`
                    )}
                  </Button>

                  {!expired && (
                    <p className="text-xs text-gray-500 text-center">
                      Your payment will be held in escrow until the rental period ends
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}