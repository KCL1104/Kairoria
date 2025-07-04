import { NextResponse } from 'next/server';

// Handler for GET requests to verify email with a token
export async function GET(request: Request) {
  try {
    // Get the token from URL parameters
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Verification token is required' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // In a real implementation, this would:
    // 1. Verify the token in the database
    // 2. Update the user's email verification status
    // 3. Redirect to a success page

    return NextResponse.json(
      { 
        success: true,
        message: 'Email verified successfully' 
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    // Log error in development only
    // No need to log here, as it's a client-side error
    return NextResponse.json(
      { success: false, message: 'Invalid or expired verification token' },
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}