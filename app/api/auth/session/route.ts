import { NextRequest, NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

// Encryption key from environment - MUST be set in production
const ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error('SESSION_ENCRYPTION_KEY environment variable is required for security');
}

/**
 * Encrypts the API key using AES-256 encryption
 * @param apiKey - The API key to encrypt
 * @returns Encrypted API key string
 */
function encryptApiKey(apiKey: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('SESSION_ENCRYPTION_KEY environment variable is required');
  }
  return CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY).toString();
}

/**
 * Decrypts the encrypted API key
 * @param encryptedKey - The encrypted API key
 * @returns Decrypted API key string
 */
function decryptApiKey(encryptedKey: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('SESSION_ENCRYPTION_KEY environment variable is required');
  }
  const bytes = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * POST /api/auth/session
 * Creates a secure session with encrypted API key storage
 */
export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();
    
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return NextResponse.json(
        { error: 'Invalid API key provided' },
        { status: 400 }
      );
    }

    // Encrypt the API key
    const encryptedKey = encryptApiKey(apiKey.trim());
    
    // Create response with success status
    const response = NextResponse.json({ 
      success: true,
      message: 'Session created successfully'
    });
    
    // Set httpOnly cookie with encrypted API key
    response.cookies.set('deepseek-session', encryptedKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400, // 24 hours
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error('[Session API] Error creating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/session
 * Retrieves and validates the current session
 */
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('deepseek-session');
    
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { authenticated: false, message: 'No session found' },
        { status: 401 }
      );
    }

    try {
      // Attempt to decrypt the session
      const decryptedKey = decryptApiKey(sessionCookie.value);
      
      if (!decryptedKey) {
        return NextResponse.json(
          { authenticated: false, message: 'Invalid session' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        authenticated: true,
        hasApiKey: true,
        message: 'Session valid'
      });
    } catch (decryptError) {
      console.error('[Session API] Decryption error:', decryptError);
      return NextResponse.json(
        { authenticated: false, message: 'Session corrupted' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('[Session API] Error validating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/session
 * Destroys the current session
 */
export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Session destroyed'
    });
    
    // Clear the session cookie
    response.cookies.set('deepseek-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error('[Session API] Error destroying session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export the decryption function for use in other API routes
export { decryptApiKey };
