import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/supabase/auth'
import { createClient } from '../../../../lib/supabase/server'
import { z } from 'zod'
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js'
import { getKairoriaProgram, createRentalTransactionInstruction } from '../../../../lib/solana-booking'
import { AnchorProvider } from '@coral-xyz/anchor'

const createBookingSchema = z.object({
  product_id: z.number().int().positive(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  total_price: z.number().positive(),
  renter_wallet_address: z.string().min(32).max(44),
}).refine((data) => new Date(data.start_date) < new Date(data.end_date), {
  message: "End date must be after start date",
  path: ["end_date"],
});

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireAuth()

  if (authError) {
    return authError
  }
  if (!user) {
    return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabase = await createClient()
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

    // Parse and validate request body
    const body = await request.json()
    const validationResult = createBookingSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const {
      product_id,
      start_date,
      end_date,
      total_price,
      renter_wallet_address,
    } = validationResult.data

    // Dates are already validated to be in correct format and range by Zod
    const startDate = new Date(start_date)
    const endDate = new Date(end_date)

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
      .or(`start_date.lte.${endDate.toISOString()},end_date.gte.${startDate.toISOString()}`)

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
      product_id,
      renter_id: user.id,
      owner_id: product.owner_id,
      start_date,
      end_date,
      total_price,
      status: 'pending' as const,
      payment_intent_id: null, // Will be updated when Solana transaction is created
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single()

    if (bookingError) {
      return NextResponse.json(
        { error: `Booking creation error: ${bookingError.message}` },
        { status: 500 }
      )
    }

    // We can't create the full instruction here because we don't have the user's wallet provider.
    // Instead, we'll return the necessary data for the frontend to construct the transaction.
    const instructionData = {
      booking_id: booking.id,
      product_id: product_id,
      owner_wallet: product.profiles.solana_address,
      total_amount_usdc: Math.floor(total_price), // total_price is already in USDC storage units
      rental_start: Math.floor(startDate.getTime() / 1000), // Unix timestamp
      rental_end: Math.floor(endDate.getTime() / 1000), // Unix timestamp
    }

    return NextResponse.json(
      {
        message: 'Booking created successfully',
        booking,
        instructionData,
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: `Booking creation error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}