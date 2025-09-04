/**
 * Next.js Middleware
 * Handles CSRF protection and other security measures
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  validateCSRFToken, 
  requiresCSRFProtection, 
  isCSRFExemptPath,
  createCSRFTokenWithExpiry,
  CSRF_CONSTANTS
} from './lib/csrf';

/**
 * Middleware function to handle CSRF protection
 * @param request - NextRequest object
 * @returns NextResponse or modified response
 */
export function middleware(request: NextRequest) {
  const { method } = request;
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') && !pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  // Handle API routes
  if (pathname.startsWith('/api/')) {
    return handleAPIMiddleware(request);
  }

  // Handle page routes - ensure CSRF token is available
  return handlePageMiddleware(request);
}

/**
 * Handle middleware for API routes
 * @param request - NextRequest object
 * @returns NextResponse
 */
function handleAPIMiddleware(request: NextRequest): NextResponse {
  const { method } = request;
  const pathname = request.nextUrl.pathname;

  // Skip CSRF protection for exempt paths
  if (isCSRFExemptPath(pathname)) {
    return NextResponse.next();
  }

  // Skip CSRF protection for safe methods
  if (!requiresCSRFProtection(method)) {
    return NextResponse.next();
  }

  // Validate CSRF token for protected requests
  if (!validateCSRFToken(request)) {
    console.warn(`[CSRF] Invalid or missing CSRF token for ${method} ${pathname}`);
    return NextResponse.json(
      { 
        error: 'Invalid or missing CSRF token',
        code: 'CSRF_TOKEN_INVALID'
      },
      { status: 403 }
    );
  }

  // CSRF token is valid, proceed with request
  return NextResponse.next();
}

/**
 * Handle middleware for page routes
 * @param request - NextRequest object
 * @returns NextResponse
 */
function handlePageMiddleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();

  // Check if CSRF token exists in cookies
  const existingToken = request.cookies.get(CSRF_CONSTANTS.COOKIE_NAME);
  
  if (!existingToken) {
    // Generate new CSRF token for new sessions
    const { token, expires } = createCSRFTokenWithExpiry();
    const cookieValue = `${token}:${expires}`;
    
    response.cookies.set(CSRF_CONSTANTS.COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: CSRF_CONSTANTS.TOKEN_EXPIRY / 1000,
      path: '/',
    });
  } else {
    // Check if existing token has expired
    try {
      const [, expiresStr] = existingToken.value.split(':');
      const expires = parseInt(expiresStr || '0', 10);
      
      if (Date.now() > expires) {
        // Token expired, generate new one
        const { token, expires: newExpires } = createCSRFTokenWithExpiry();
        const cookieValue = `${token}:${newExpires}`;
        
        response.cookies.set(CSRF_CONSTANTS.COOKIE_NAME, cookieValue, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: CSRF_CONSTANTS.TOKEN_EXPIRY / 1000,
          path: '/',
        });
      }
    } catch (error) {
      // Invalid token format, generate new one
      const { token, expires } = createCSRFTokenWithExpiry();
      const cookieValue = `${token}:${expires}`;
      
      response.cookies.set(CSRF_CONSTANTS.COOKIE_NAME, cookieValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: CSRF_CONSTANTS.TOKEN_EXPIRY / 1000,
        path: '/',
      });
    }
  }

  // Add comprehensive security headers for OWASP compliance
  addSecurityHeaders(response);

  return response;
}

/**
 * Add comprehensive security headers for OWASP Top 10 2021 compliance
 * @param response - NextResponse object to add headers to
 */
function addSecurityHeaders(response: NextResponse): void {
  // Prevent clickjacking attacks (OWASP A05:2021 - Security Misconfiguration)
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing (OWASP A05:2021 - Security Misconfiguration)
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Control referrer information (Privacy & Security)
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Enable XSS protection (OWASP A03:2021 - Injection)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Strict Transport Security (OWASP A02:2021 - Cryptographic Failures)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Content Security Policy (OWASP A03:2021 - Injection)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Next.js
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.deepseek.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  response.headers.set('Content-Security-Policy', csp);

  // Permissions Policy (formerly Feature Policy)
  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', ');
  response.headers.set('Permissions-Policy', permissionsPolicy);

  // Cross-Origin Policies
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
}

/**
 * Middleware configuration
 * Specify which paths should be processed by middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public|sw.js|workbox-|manifest.json).*)',
  ],
};
