import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js'
import { getKairoriaProgram, createRentalTransactionInstruction } from '@/lib/solana-booking'
import { AnchorProvider } from '@coral-xyz/anchor'

export async function POST(request: NextRequest) {
  console.log('Booking create API called')
  
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

    // Get user's profile with Solana address
    const { data: renterProfile, error: renterProfileError } = await supabase
      .from('profiles')
      .select('solana_address')
      .eq('id', user.id)
      .single()

    if (renterProfileError || !renterProfile?.solana_address) {
      return NextResponse.json(
        { error: 'Renter Solana address not configured' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      product_id,
      start_date,
      end_date,
      total_price,
      renter_wallet_address,
    } = body

    // Validate required fields
    if (!product_id || !start_date || !end_date || !total_price || !renter_wallet_address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate dates
    const startDate = new Date(start_date)
    const endDate = new Date(end_date)
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Invalid date range' },
        { status: 400 }
      )
    }

    // Get product details and owner's Solana address
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        profiles!products_owner_id_fkey(solana_address)
      `)
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    if (!product.profiles?.solana_address) {
      return NextResponse.json(
        { error: 'Product owner Solana address not configured' },
        { status: 400 }
      )
    }

    // Check for booking conflicts
    const { data: existingBookings, error: bookingCheckError } = await supabase
      .from('bookings')
      .select('*')
      .eq('product_id', product_id)
      .in('status', ['pending', 'confirmed'])
      .or(`start_date.lte.${end_date},end_date.gte.${start_date}`)

    if (bookingCheckError) {
      return NextResponse.json(
        { error: 'Failed to check booking conflicts' },
        { status: 500 }
      )
    }

    if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json(
        { error: 'Product is not available for the selected dates' },
        { status: 409 }
      )
    }

    // Create booking record
    const bookingData = {
      product_id: parseInt(product_id),
      renter_id: user.id,
      owner_id: product.owner_id,
      start_date,
      end_date,
      total_price: parseFloat(total_price),
      status: 'pending',
      payment_intent_id: null, // Will be updated when Solana transaction is created
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single()

    if (bookingError) {
      console.error('Booking creation error:', bookingError)
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    // We can't create the full instruction here because we don't have the user's wallet provider.
    // Instead, we'll return the necessary data for the frontend to construct the transaction.
    const instructionData = {
      booking_id: booking.id,
      product_id: parseInt(product_id),
      owner_wallet: product.profiles.solana_address,
      total_amount_usdc: Math.floor(parseFloat(total_price) * 1000000), // Convert to USDC minor units (6 decimals)
      rental_start: Math.floor(startDate.getTime() / 1000), // Unix timestamp
      rental_end: Math.floor(endDate.getTime() / 1000), // Unix timestamp
    }

    console.log('Booking created successfully:', booking.id)
    return NextResponse.json(
      {
        message: 'Booking created successfully',
        booking,
        instructionData,
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Booking creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}