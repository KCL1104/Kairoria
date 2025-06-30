import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function PATCH(request: NextRequest) {
  try {
    // Create Supabase admin client at runtime to avoid build-time errors
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, message: 'Database configuration not available' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createServerClient(supabaseUrl, supabaseServiceKey, {
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
    // Get the user from the session
    const cookieStore = await cookies()
    const supabase = createServerClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Server-side cookie setting will be handled by the response
        },
        remove(name: string, options: any) {
          // Server-side cookie removal will be handled by the response
        },
      },
    })
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse the request body
    const body = await request.json()
    const {
      full_name,
      bio,
      location,
      phone,
      avatar_url,
      solana_address,
      is_email_verified = false,
      is_phone_verified = false
    } = body

    // Validate required fields
    if (!full_name || !location || !phone) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate Solana address if provided
    if (solana_address && solana_address.trim()) {
      try {
        // Basic validation - ensure it's a valid base58 string of correct length
        const trimmedAddress = solana_address.trim()
        if (trimmedAddress.length < 32 || trimmedAddress.length > 44) {
          return NextResponse.json(
            { success: false, message: 'Invalid Solana address format' },
            { status: 400 }
          )
        }
      } catch (error) {
        return NextResponse.json(
          { success: false, message: 'Invalid Solana address' },
          { status: 400 }
        )
      }
    }

    // Update the profile
    const updateData: any = {
      full_name,
      bio: bio || null,
      location,
      phone,
      avatar_url: avatar_url || null,
      is_email_verified,
      is_phone_verified,
      updated_at: new Date().toISOString()
    }

    // Only update solana_address if it's provided
    if (solana_address !== undefined) {
      updateData.solana_address = solana_address || null
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()

    if (error) {
      return NextResponse.json(
        { success: false, message: `Error updating profile: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, message: `Profile update error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}