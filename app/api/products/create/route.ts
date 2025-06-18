import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { convertToStorageAmount } from '@/lib/data'

export async function POST(request: NextRequest) {
  console.log('Product create API called')
  console.log('Request headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    // Get Supabase URL and keys
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('Environment check:', { 
      hasSupabaseUrl: !!supabaseUrl, 
      hasAnonKey: !!supabaseAnonKey 
    })
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    // Create Supabase client with the user's session
    const authHeader = request.headers.get('Authorization')
    console.log('Auth header:', authHeader ? 'Present' : 'Missing')
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header missing' },
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.headers.get('cookie')?.split(`${name}=`)[1]?.split(';')[0]
        },
        set(name: string, value: string, options: any) {
          // Server-side cookie setting will be handled by the response
        },
        remove(name: string, options: any) {
          // Server-side cookie removal will be handled by the response
        },
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
      console.log('User authentication error:', userError)
      return NextResponse.json(
        { error: 'User not authenticated' },
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    // Parse the request body
    const body = await request.json()
    console.log('Request body:', body)
    
    const {
      title,
      description,
      category_id,
      brand,
      condition,
      location,
      currency,
      price_per_hour,
      price_per_day,
      daily_cap_hours,
      security_deposit
    } = body

    // Validate required fields
    if (!title || !description || !category_id || !condition || !location || !currency || !price_per_day) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    // Validate condition enum
    const validConditions = ['new', 'like_new', 'good', 'used']
    if (!validConditions.includes(condition)) {
      return NextResponse.json(
        { error: 'Invalid condition value' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    // Validate currency enum
    const validCurrencies = ['usdc', 'usdt']
    if (!validCurrencies.includes(currency)) {
      return NextResponse.json(
        { error: 'Invalid currency value' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    // Convert decimal prices to storage amounts (BIGINT)
    const pricePerDayStorage = convertToStorageAmount(parseFloat(price_per_day))
    const pricePerHourStorage = price_per_hour ? convertToStorageAmount(parseFloat(price_per_hour)) : null
    const securityDepositStorage = security_deposit ? convertToStorageAmount(parseFloat(security_deposit)) : 0

    // Prepare product data
    const productData = {
      owner_id: user.id,
      category_id: parseInt(category_id),
      title: title.trim(),
      description: description.trim(),
      brand: brand?.trim() || null,
      condition,
      location: location.trim(),
      currency,
      price_per_hour: pricePerHourStorage,
      price_per_day: pricePerDayStorage,
      daily_cap_hours: daily_cap_hours ? parseInt(daily_cap_hours) : null,
      security_deposit: securityDepositStorage,
      status: 'pending' as const,
      average_rating: 0,
      review_count: 0,
    }

    // Insert the product into the database
    const { data: product, error: insertError } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single()

    if (insertError) {
      console.error('Product creation error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create product' },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    console.log('Product created successfully:', product.id)
    return NextResponse.json(
      { 
        message: 'Product created successfully',
        product_id: product.id,
        product
      },
      { 
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )

  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}