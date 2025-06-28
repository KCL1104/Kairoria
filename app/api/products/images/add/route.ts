import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    // Get Supabase URL and keys
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
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

    // DEMO MODE: More flexible auth handling
    const authHeader = request.headers.get('Authorization')
    
    const supabaseConfig: any = {
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
    }

    if (authHeader) {
      supabaseConfig.global = {
        headers: {
          Authorization: authHeader,
        },
      }
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, supabaseConfig)

    // Get authenticated user
    let user: any = null
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      user = currentUser
      
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { 
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Authentication failed' },
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
    const { product_id, image_url, is_cover, display_order } = body

    // Validate required fields
    if (!product_id || !image_url) {
      return NextResponse.json(
        { error: 'Missing required fields: product_id and image_url' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    // DEMO MODE: Skip ownership verification for demo
    console.log('DEMO MODE: Skipping product ownership verification for product:', product_id)

    // If this is set as cover image, unset any existing cover images for this product
    if (is_cover) {
      await supabase
        .from('product_images')
        .update({ is_cover: false })
        .eq('product_id', product_id)
        .eq('is_cover', true)
    }

    // Get the next display order if not provided
    let finalDisplayOrder = display_order
    if (finalDisplayOrder === undefined || finalDisplayOrder === null) {
      const { data: existingImages } = await supabase
        .from('product_images')
        .select('display_order')
        .eq('product_id', product_id)
        .order('display_order', { ascending: false })
        .limit(1)

      finalDisplayOrder = existingImages && existingImages.length > 0 
        ? existingImages[0].display_order + 1 
        : 0
    }

    // Insert the image record
    const imageData = {
      product_id: product_id, // UUID - no need to parse
      image_url,
      display_order: finalDisplayOrder,
      is_cover: is_cover || false,
    }

    const { data: productImage, error: insertError } = await supabase
      .from('product_images')
      .insert([imageData])
      .select()
      .single()

    if (insertError) {
      console.error('Product image creation error:', insertError)
      return NextResponse.json(
        { error: 'Failed to add product image' },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    return NextResponse.json(
      { 
        message: 'Product image added successfully',
        image: productImage
      },
      { 
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )

  } catch (error) {
    console.error('Product image creation error:', error)
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