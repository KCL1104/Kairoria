import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('Booking payment confirmation API called for booking:', params.id)
  
  try {
    // Get Supabase configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    // Create Supabase client
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header missing' },
        { status: 401 }
      )
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.headers.get('cookie')?.split(`${name}=`)[1]?.split(';')[0]
        },
        set(name: string, value: string, options: any) {},
        remove(name: string, options: any) {},
      },
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { transaction_signature, solana_transaction_data } = body

    if (!transaction_signature) {
      return NextResponse.json(
        { error: 'Transaction signature is required' },
        { status: 400 }
      )
    }

    // Get the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', params.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Verify user owns this booking
    if (booking.renter_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to booking' },
        { status: 403 }
      )
    }

    // Check if booking is in correct status
    if (booking.status !== 'pending') {
      return NextResponse.json(
        { error: 'Booking is not in pending status' },
        { status: 400 }
      )
    }

    // TODO: Verify the Solana transaction on-chain
    // This would involve:
    // 1. Connecting to Solana RPC
    // 2. Fetching the transaction by signature
    // 3. Verifying the transaction details match the booking
    // 4. Confirming the transaction was successful
    
    // For now, we'll update the booking with the transaction signature
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_intent_id: transaction_signature,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Booking update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to confirm booking payment' },
        { status: 500 }
      )
    }

    console.log('Booking payment confirmed successfully:', params.id)
    return NextResponse.json(
      {
        message: 'Booking payment confirmed successfully',
        booking: updatedBooking,
        transaction_signature,
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Booking payment confirmation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}