import { NextRequest } from 'next/server';
import CryptoJS from 'crypto-js';

// Encryption key from environment - MUST be set
const ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY;

// Cache for randomly generated dev key (per-process)
let _randomDevKey: string | null = null;

/**
 * Generate a cryptographically random key for development/test environments.
 * This key is regenerated each time the process restarts.
 */
function generateRandomDevKey(): string {
  if (_randomDevKey) {
    return _randomDevKey;
  }
  // Generate 32 random bytes and convert to hex (64 chars)
  const randomBytes = CryptoJS.lib.WordArray.random(32);
  _randomDevKey = randomBytes.toString(CryptoJS.enc.Hex).slice(0, 32);
  return _randomDevKey;
}

/**
 * Get the encryption key, with clear error handling for missing configuration.
 * In development mode, provides a clear warning and generates a random per-process key.
 * In production mode, throws an error if key is not configured.
 */
function getEncryptionKey(): string {
  if (ENCRYPTION_KEY) {
    return ENCRYPTION_KEY;
  }

  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';

  if (isDevelopment || isTest) {
    // Only log warning once per session
    if (typeof globalThis !== 'undefined' && !(globalThis as any).__EP_SESSION_KEY_WARNING__) {
      console.warn(
        '\n⚠️  [Session Manager] SESSION_ENCRYPTION_KEY is not set.\n' +
        '   For development, add to your .env.local file:\n' +
        '   SESSION_ENCRYPTION_KEY=your-32-char-secret-key-here!!\n' +
        '   Using randomly generated temporary key for this session.\n' +
        '   Note: Sessions will not persist across server restarts.\n'
      );
      (globalThis as any).__EP_SESSION_KEY_WARNING__ = true;
    }
    // Generate a random key for this process (not persisted)
    // This ensures development works without explicit configuration
    // but does not use a predictable/fixed key
    return generateRandomDevKey();
  }

  // Production environment - must have key configured
  throw new Error(
    '[Session Manager] SECURITY ERROR: SESSION_ENCRYPTION_KEY environment variable is required.\n' +
    'Please set this in your production environment configuration.'
  );
}

// Lazy initialization of encryption key
let _encryptionKey: string | null = null;
function getActualEncryptionKey(): string {
  if (_encryptionKey === null) {
    _encryptionKey = getEncryptionKey();
  }
  return _encryptionKey;
}

/**
 * Decrypts the encrypted API key
 * @param encryptedKey - The encrypted API key
 * @returns Decrypted API key string or null if invalid
 */
export function decryptApiKey(encryptedKey: string): string | null {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedKey, getActualEncryptionKey());
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || null;
  } catch (error) {
    console.error('[Session Manager] Decryption error:', error);
    return null;
  }
}

/**
 * Extracts and decrypts API key from request cookies
 * @param request - NextRequest object
 * @returns Decrypted API key or null if not found/invalid
 */
export function getApiKeyFromSession(request: NextRequest): string | null {
  try {
    const sessionCookie = request.cookies.get('deepseek-session');
    
    if (!sessionCookie?.value) {
      return null;
    }

    return decryptApiKey(sessionCookie.value);
  } catch (error) {
    console.error('[Session Manager] Error extracting API key:', error);
    return null;
  }
}

/**
 * Validates if a session exists and is valid
 * @param request - NextRequest object
 * @returns Boolean indicating session validity
 */
export function isValidSession(request: NextRequest): boolean {
  const apiKey = getApiKeyFromSession(request);
  return apiKey !== null && apiKey.length > 0;
}

/**
 * Session management utilities for client-side operations
 */
export const SessionManager = {
  /**
   * Creates a new session with the provided API key
   * @param apiKey - The API key to store securely
   * @returns Promise resolving to success status
   */
  async createSession(apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to create session' };
      }

      return { success: true };
    } catch (error) {
      console.error('[Session Manager] Create session error:', error);
      return { success: false, error: 'Network error' };
    }
  },

  /**
   * Validates the current session
   * @returns Promise resolving to session status
   */
  async validateSession(): Promise<{ authenticated: boolean; hasApiKey: boolean }> {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
      });

      if (!response.ok) {
        return { authenticated: false, hasApiKey: false };
      }

      const data = await response.json();
      return {
        authenticated: data.authenticated || false,
        hasApiKey: data.hasApiKey || false,
      };
    } catch (error) {
      console.error('[Session Manager] Validate session error:', error);
      return { authenticated: false, hasApiKey: false };
    }
  },

  /**
   * Destroys the current session
   * @returns Promise resolving to success status
   */
  async destroySession(): Promise<{ success: boolean }> {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'DELETE',
      });

      return { success: response.ok };
    } catch (error) {
      console.error('[Session Manager] Destroy session error:', error);
      return { success: false };
    }
  },

  /**
   * Migrates existing localStorage API key to secure session
   * @returns Promise resolving to migration status
   */
  async migrateFromLocalStorage(): Promise<{ success: boolean; migrated: boolean }> {
    try {
      // Check if there's an existing API key in localStorage
      const existingKey = localStorage.getItem('deepseek-api-key');
      
      if (!existingKey) {
        return { success: true, migrated: false };
      }

      // Create session with existing key
      const result = await this.createSession(existingKey);
      
      if (result.success) {
        // Remove from localStorage after successful migration
        localStorage.removeItem('deepseek-api-key');
        return { success: true, migrated: true };
      }

      return { success: false, migrated: false };
    } catch (error) {
      console.error('[Session Manager] Migration error:', error);
      return { success: false, migrated: false };
    }
  }
};
