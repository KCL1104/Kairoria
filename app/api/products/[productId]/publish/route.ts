import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params
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

    // productId is already available from destructuring
    
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

    // DEMO MODE: Skip ownership and image checks for demo

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
      return NextResponse.json(
        { error: `Product update error: ${updateError.message}` },
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
    return NextResponse.json(
      { error: `Product publish error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}