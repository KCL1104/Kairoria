import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Get booking details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log('Booking details API called for booking:', id)
  
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

    // Get the booking with related data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        products!bookings_product_id_fkey(
          *,
          categories!products_category_id_fkey(name),
          owner_profile:profiles!products_owner_id_fkey(
            id,
            display_name,
            username,
            avatar_url,
            solana_address
          )
        ),
        renter_profile:profiles!bookings_renter_id_fkey(
          id,
          display_name,
          username,
          avatar_url,
          solana_address
        )
      `)
      .eq('id', id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this booking (either renter or owner)
    if (booking.renter_id !== user.id && booking.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to booking' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        booking,
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Booking details fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Cancel booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  console.log('Booking cancellation API called for booking:', id)
  
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

    // Get the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Verify user owns this booking (only renter can cancel)
    if (booking.renter_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the renter can cancel the booking' },
        { status: 403 }
      )
    }

    // Check if booking can be cancelled
    if (booking.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel completed booking' },
        { status: 400 }
      )
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      )
    }

    // Check cancellation time limit (24 hours before start date)
    const startDate = new Date(booking.start_date)
    const now = new Date()
    const oneDayBefore = new Date(startDate.getTime() - 24 * 60 * 60 * 1000)

    if (now >= oneDayBefore) {
      return NextResponse.json(
        { error: 'Cannot cancel booking less than 24 hours before start date' },
        { status: 400 }
      )
    }

    // If booking is confirmed (paid), we allow cancellation but note refund needed
    let cancellationNotes = null
    if (booking.status === 'confirmed') {
      cancellationNotes = 'Paid booking cancelled - refund required via smart contract'
      // TODO: Implement Solana refund logic
      // This would involve calling the smart contract's cancel_rental function
    }

    // Cancel the booking
    const updateData: any = {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    }

    if (cancellationNotes) {
      updateData.cancellation_notes = cancellationNotes
    }

    const { data: cancelledBooking, error: cancelError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (cancelError) {
      console.error('Booking cancellation error:', cancelError)
      return NextResponse.json(
        { error: 'Failed to cancel booking' },
        { status: 500 }
      )
    }

    console.log('Booking cancelled successfully:', id)
    return NextResponse.json(
      {
        message: 'Booking cancelled successfully',
        booking: cancelledBooking,
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Booking cancellation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}