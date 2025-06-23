import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function PUT(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
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

    const productId = params.productId // UUID - no need to parse
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
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
      .select('*')
      .eq('id', productId)
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
        { error: 'Unauthorized: You can only publish your own products' },
        { 
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    // Check if the product has at least one image
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .limit(1)

    if (imagesError) {
      return NextResponse.json(
        { error: 'Error checking product images' },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'Cannot publish product without at least one image' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }

    // Update the product status to 'listed'
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({ 
        status: 'listed',
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single()

    if (updateError) {
      console.error('Product update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to publish product' },
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
        message: 'Product published successfully',
        product: updatedProduct
      },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )

  } catch (error) {
    console.error('Product publish error:', error)
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