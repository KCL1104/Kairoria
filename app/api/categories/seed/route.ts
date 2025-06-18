import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const BASIC_CATEGORIES = [
  'Electronics',
  'Tools', 
  'Outdoor Gear',
  'Home Goods',
  'Sports',
  'Vehicles',
  'Clothing',
  'Musical Instruments',
  'Garden',
  'Photography',
  'Books',
  'Toys & Games',
  'Art & Crafts',
  'Kitchen',
  'Fitness',
  'Party & Celebration',
]

export async function POST(request: NextRequest) {
  try {
    // Get Supabase URL and keys
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    // Use service role key for admin operations
    const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
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
    })

    // Check if categories already exist
    const { data: existingCategories, error: fetchError } = await supabase
      .from('categories')
      .select('id')
      .limit(1)

    if (fetchError) {
      console.error('Error checking categories:', fetchError)
      return NextResponse.json(
        { error: 'Failed to check existing categories' },
        { status: 500 }
      )
    }

    if (existingCategories && existingCategories.length > 0) {
      return NextResponse.json({
        message: 'Categories already exist',
        count: existingCategories.length
      })
    }

    // Insert basic categories
    const categoriesToInsert = BASIC_CATEGORIES.map(name => ({ name }))
    
    const { data: insertedCategories, error: insertError } = await supabase
      .from('categories')
      .insert(categoriesToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting categories:', insertError)
      return NextResponse.json(
        { error: 'Failed to insert categories' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Categories seeded successfully',
      categories: insertedCategories,
      count: insertedCategories?.length || 0
    })

  } catch (error) {
    console.error('Categories seed error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}