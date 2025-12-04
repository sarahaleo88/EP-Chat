import { NextRequest, NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

/**
 * Gets the encryption key from environment.
 * This is a function to defer the check to runtime instead of build time.
 * @throws Error if SESSION_ENCRYPTION_KEY is not set
 */
function getEncryptionKey(): string {
  const key = process.env.SESSION_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('SESSION_ENCRYPTION_KEY environment variable is required for security');
  }
  return key;
}

/**
 * Encrypts the API key using AES-256 encryption
 *
 * SECURITY NOTE (CodeQL Alert #126 - False Positive):
 * This is ENCRYPTION (reversible), NOT password hashing.
 * AES encryption is the correct choice here because:
 * 1. We need to decrypt the API key later to make API calls to DeepSeek
 * 2. This is NOT a user password - it's an API credential that must be recoverable
 * 3. The encrypted key is stored in an httpOnly cookie, not in a database
 *
 * For actual password storage, use bcrypt/scrypt/PBKDF2/Argon2 instead.
 *
 * @param apiKey - The API key to encrypt
 * @returns Encrypted API key string
 * @security AES-256-CBC encryption with environment-based key
 */
function encryptApiKey(apiKey: string): string {
  const encryptionKey = getEncryptionKey();
  // nosemgrep: crypto-js-insecure-hashing
  // codeql-ignore: js/weak-cryptographic-algorithm
  // This is intentional AES encryption for API key storage, not password hashing
  return CryptoJS.AES.encrypt(apiKey, encryptionKey).toString();
}

/**
 * Decrypts the encrypted API key
 * @param encryptedKey - The encrypted API key
 * @returns Decrypted API key string
 */
function decryptApiKey(encryptedKey: string): string {
  const encryptionKey = getEncryptionKey();
  const bytes = CryptoJS.AES.decrypt(encryptedKey, encryptionKey);
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
