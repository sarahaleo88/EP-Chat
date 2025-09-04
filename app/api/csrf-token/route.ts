/**
 * CSRF Token Generation API
 * Provides CSRF tokens for client-side requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { createCSRFTokenWithExpiry, CSRF_CONSTANTS } from '@/lib/csrf';

/**
 * GET /api/csrf-token
 * Generate and return a new CSRF token
 */
export async function GET(request: NextRequest) {
  try {
    // Generate new CSRF token with expiry
    const { token, expires } = createCSRFTokenWithExpiry();
    
    // Create response with token in JSON
    const response = NextResponse.json({
      success: true,
      token,
      expires,
      message: 'CSRF token generated successfully'
    });

    // Set CSRF token in httpOnly cookie
    const cookieValue = `${token}:${expires}`;
    response.cookies.set(CSRF_CONSTANTS.COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: CSRF_CONSTANTS.TOKEN_EXPIRY / 1000, // Convert to seconds
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[CSRF Token API] Error generating token:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate CSRF token' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/csrf-token
 * Refresh existing CSRF token
 */
export async function POST(request: NextRequest) {
  try {
    // Generate new CSRF token with expiry
    const { token, expires } = createCSRFTokenWithExpiry();
    
    // Create response with new token
    const response = NextResponse.json({
      success: true,
      token,
      expires,
      message: 'CSRF token refreshed successfully'
    });

    // Update CSRF token in httpOnly cookie
    const cookieValue = `${token}:${expires}`;
    response.cookies.set(CSRF_CONSTANTS.COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: CSRF_CONSTANTS.TOKEN_EXPIRY / 1000,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[CSRF Token API] Error refreshing token:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to refresh CSRF token' 
      },
      { status: 500 }
    );
  }
}
