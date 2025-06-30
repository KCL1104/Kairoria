import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Get user's bookings (as renter and as owner)
export async function GET(request: NextRequest) {
  
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') // 'renter' or 'owner' or null (both)
    const status = searchParams.get('status') // booking status filter
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build base query
    let query = supabase
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
            avatar_url
          )
        ),
        renter_profile:profiles!bookings_renter_id_fkey(
          id,
          display_name,
          username,
          avatar_url
        )
      `)

    // Apply filters
    if (role === 'renter') {
      query = query.eq('renter_id', user.id)
    } else if (role === 'owner') {
      query = query.eq('owner_id', user.id)
    } else {
      // Get both renter and owner bookings
      query = query.or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Order by creation date (newest first) and apply pagination
    const { data: bookings, error: bookingsError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (bookingsError) {
      return NextResponse.json(
        { error: `Bookings fetch error: ${bookingsError.message}` },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })

    if (role === 'renter') {
      countQuery = countQuery.eq('renter_id', user.id)
    } else if (role === 'owner') {
      countQuery = countQuery.eq('owner_id', user.id)
    } else {
      countQuery = countQuery.or(`renter_id.eq.${user.id},owner_id.eq.${user.id}`)
    }

    if (status) {
      countQuery = countQuery.eq('status', status)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      // This error is not critical, so we can just ignore it
    }

    // Separate bookings by role for easier frontend handling
    const renterBookings = bookings?.filter(booking => booking.renter_id === user.id) || []
    const ownerBookings = bookings?.filter(booking => booking.owner_id === user.id) || []

    return NextResponse.json(
      {
        bookings: bookings || [],
        renter_bookings: renterBookings,
        owner_bookings: ownerBookings,
        total_count: count || 0,
        pagination: {
          limit,
          offset,
          has_more: (count || 0) > offset + limit
        }
      },
      { status: 200 }
    )

  } catch (error) {
    return NextResponse.json(
      { error: `User bookings fetch error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}