import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    // Create Supabase client with the user's session
    const authHeader = request.headers.get('Authorization')
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

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

    // Verify that the user owns the product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('owner_id')
      .eq('id', product_id)
      .single()

    if (productError) {
      return NextResponse.json(
        { error: 'Product not found' },
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    if (product.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only add images to your own products' },
        { 
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

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
      product_id: parseInt(product_id),
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