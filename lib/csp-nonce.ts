/**
 * CSP Nonce Generation and Management
 * Provides secure nonce generation for Content Security Policy
 */

/**
 * Generate a cryptographically secure nonce for CSP
 * Compatible with Edge Runtime
 * @returns Base64 encoded nonce string
 */
export function generateCSPNonce(): string {
  // Use Web Crypto API for Edge Runtime compatibility
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  // Fallback for Node.js environments
  try {
    const { randomBytes } = require('crypto');
    return randomBytes(16).toString('base64');
  } catch (error) {
    // Final fallback using Math.random (not cryptographically secure)
    console.warn('[CSP] Using fallback random generation - NOT FOR PRODUCTION');
    const array = new Uint8Array(16);
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return btoa(String.fromCharCode(...array));
  }
}

/**
 * Create CSP header with nonce
 * @param nonce - The nonce to include in the CSP
 * @returns CSP header string
 */
export function createCSPWithNonce(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.deepseek.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
    "block-all-mixed-content"
  ].join('; ');
}

/**
 * CSP nonce context for React components
 */
export interface CSPNonceContext {
  nonce: string;
}

/**
 * Get nonce from request headers (set by middleware)
 * @param headers - Request headers
 * @returns Nonce string or null if not found
 */
export function getNonceFromHeaders(headers: Headers): string | null {
  return headers.get('x-csp-nonce');
}
