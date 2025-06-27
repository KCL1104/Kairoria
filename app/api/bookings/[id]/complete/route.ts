import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(
  request: NextRequest,
  { params }: any
) {
  console.log('Booking completion API called for booking:', params.id)
  
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

    // Get the booking with product and profile details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        products!bookings_product_id_fkey(
          *,
          profiles!products_owner_id_fkey(solana_address)
        ),
        renter_profile:profiles!bookings_renter_id_fkey(solana_address)
      `)
      .eq('id', params.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Verify user is the renter
    if (booking.renter_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to booking' },
        { status: 403 }
      )
    }

    // Check if booking is in correct status
    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Booking is not in confirmed status' },
        { status: 400 }
      )
    }

    // Generate Solana transaction instructions for completion
    const solanaInstructions = {
      booking_id: booking.id,
      product_id: booking.product_id,
      owner_wallet: booking.products.profiles.solana_address,
      renter_wallet: booking.renter_profile.solana_address,
      program_id: process.env.NEXT_PUBLIC_KAIRORIA_PROGRAM_ID || 'HczADmDQ7CSAQCjLnixgXHiJWg31ToAMKnyzamaadkbY',
      instructions: {
        complete_rental: {
          accounts: {
            rental_transaction: null, // Will be derived PDA
            escrow_token_account: null, // Will be derived PDA
            owner_token_account: null, // Associated token account
            admin_token_account: null, // Associated token account
            global_state: null, // Will be derived PDA
            usdc_mint: process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet' 
              ? process.env.NEXT_PUBLIC_USDC_MINT_MAINNET || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
              : process.env.NEXT_PUBLIC_USDC_MINT_DEVNET || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
            signer: booking.renter_profile.solana_address,
            token_program: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          },
          data: {
            product_id: booking.product_id,
            renter: booking.renter_profile.solana_address,
          }
        }
      }
    }

    console.log('Booking completion instructions generated:', booking.id)
    return NextResponse.json(
      {
        message: 'Booking completion instructions generated',
        booking,
        solana_instructions: solanaInstructions,
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Booking completion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update booking status after successful Solana transaction
export async function PATCH(
  request: NextRequest,
  { params }: any
) {
  console.log('Booking completion confirmation API called for booking:', params.id)
  
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
    const { completion_transaction_signature } = body

    if (!completion_transaction_signature) {
      return NextResponse.json(
        { error: 'Completion transaction signature is required' },
        { status: 400 }
      )
    }

    // Update booking status to completed
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('renter_id', user.id) // Ensure user owns the booking
      .select()
      .single()

    if (updateError) {
      console.error('Booking completion update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to complete booking' },
        { status: 500 }
      )
    }

    console.log('Booking completed successfully:', params.id)
    return NextResponse.json(
      {
        message: 'Booking completed successfully',
        booking: updatedBooking,
        completion_transaction_signature,
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Booking completion confirmation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}