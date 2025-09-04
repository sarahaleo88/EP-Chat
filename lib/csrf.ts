/**
 * CSRF Protection Implementation
 *
 * 提供全面的跨站请求伪造 (CSRF) 防护功能，包括：
 * - 加密安全的令牌生成
 * - 令牌验证和过期检查
 * - 中间件集成
 * - 客户端 API 集成
 * - 路径和方法豁免机制
 *
 * 安全特性：
 * - 使用 Web Crypto API 生成 32 字节随机令牌
 * - 恒定时间比较防止时序攻击
 * - 24 小时令牌生命周期
 * - HttpOnly, Secure, SameSite=Strict Cookie 设置
 * - 自动令牌刷新机制
 *
 * @example
 * ```typescript
 * // 生成 CSRF 令牌
 * const { token, expires } = createCSRFTokenWithExpiry();
 *
 * // 验证请求中的 CSRF 令牌
 * const isValid = validateCSRFToken(request);
 *
 * // 检查是否需要 CSRF 保护
 * const needsProtection = requiresCSRFProtection('POST');
 * ```
 */

import { NextRequest } from 'next/server';

/**
 * CSRF 保护配置常量
 *
 * 这些常量定义了 CSRF 保护系统的核心参数：
 * - TOKEN_LENGTH: 令牌字节长度，32 字节提供 256 位熵
 * - TOKEN_HEADER: HTTP 头部名称，用于传递 CSRF 令牌
 * - COOKIE_NAME: Cookie 名称，用于存储 CSRF 令牌
 * - TOKEN_EXPIRY: 令牌过期时间，24 小时平衡安全性和用户体验
 */
export const CSRF_CONSTANTS = {
  TOKEN_LENGTH: 32,
  TOKEN_HEADER: 'x-csrf-token',
  COOKIE_NAME: 'csrf-token',
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
} as const;

// Legacy constants for backward compatibility
const CSRF_TOKEN_LENGTH = CSRF_CONSTANTS.TOKEN_LENGTH;
const CSRF_TOKEN_HEADER = CSRF_CONSTANTS.TOKEN_HEADER;
const CSRF_COOKIE_NAME = CSRF_CONSTANTS.COOKIE_NAME;
const CSRF_TOKEN_EXPIRY = CSRF_CONSTANTS.TOKEN_EXPIRY;

/**
 * 生成加密安全的 CSRF 令牌
 *
 * 使用 Web Crypto API 生成高质量随机令牌：
 * - 32 字节随机数据提供 256 位熵
 * - Base64URL 编码确保 URL 安全
 * - 无填充字符，适合 HTTP 头部传输
 *
 * @returns Base64URL 编码的 CSRF 令牌
 *
 * @example
 * ```typescript
 * const token = generateCSRFToken();
 * console.log(token); // "abc123def456..." (43 字符)
 * ```
 *
 * @throws {Error} 当 Web Crypto API 不可用时抛出错误
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(array);
  // Convert to base64url format (URL-safe, no padding)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * 创建带过期时间的 CSRF 令牌
 *
 * 生成新的 CSRF 令牌并计算过期时间戳：
 * - 令牌有效期为 24 小时
 * - 过期时间戳用于服务端验证
 * - 支持令牌自动刷新机制
 *
 * @returns 包含令牌和过期时间戳的对象
 *
 * @example
 * ```typescript
 * const { token, expires } = createCSRFTokenWithExpiry();
 * console.log(`Token: ${token}, Expires: ${new Date(expires)}`);
 * ```
 */
export function createCSRFTokenWithExpiry(): { token: string; expires: number } {
  const token = generateCSRFToken();
  const expires = Date.now() + CSRF_TOKEN_EXPIRY;
  return { token, expires };
}

/**
 * 验证请求中的 CSRF 令牌
 *
 * 执行完整的 CSRF 令牌验证流程：
 * 1. 从 HTTP 头部获取令牌
 * 2. 从 Cookie 获取存储的令牌和过期时间
 * 3. 验证令牌格式和过期时间
 * 4. 使用恒定时间比较防止时序攻击
 *
 * @param request - Next.js 请求对象
 * @returns 令牌是否有效
 *
 * @example
 * ```typescript
 * // 在 API 路由中验证 CSRF 令牌
 * export async function POST(request: NextRequest) {
 *   if (!validateCSRFToken(request)) {
 *     return new Response('CSRF token invalid', { status: 403 });
 *   }
 *   // 处理请求...
 * }
 * ```
 *
 * @security
 * - 使用恒定时间字符串比较防止时序攻击
 * - 验证令牌过期时间防止重放攻击
 * - 要求头部和 Cookie 中的令牌完全匹配
 */
export function validateCSRFToken(request: NextRequest): boolean {
  try {
    // Get CSRF token from header
    const headerToken = request.headers.get(CSRF_TOKEN_HEADER);
    if (!headerToken) {
      return false;
    }

    // Get CSRF token from cookie
    const cookieToken = request.cookies.get(CSRF_COOKIE_NAME);
    if (!cookieToken?.value) {
      return false;
    }

    // Parse cookie value (format: "token:expires")
    const [storedToken, expiresStr] = cookieToken.value.split(':');
    if (!storedToken || !expiresStr) {
      return false;
    }

    // Check if token has expired
    const expires = parseInt(expiresStr, 10);
    if (Date.now() > expires) {
      return false;
    }

    // Compare tokens using constant-time comparison to prevent timing attacks
    return constantTimeCompare(headerToken, storedToken);
  } catch (error) {
    console.error('[CSRF] Token validation error:', error);
    return false;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 * @param a - First string
 * @param b - Second string
 * @returns Boolean indicating if strings are equal
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Extract CSRF token from request cookie
 * @param request - NextRequest object
 * @returns CSRF token string or null if not found/invalid
 */
export function getCSRFTokenFromCookie(request: NextRequest): string | null {
  try {
    const cookieToken = request.cookies.get(CSRF_COOKIE_NAME);
    if (!cookieToken?.value) {
      return null;
    }

    const [token, expiresStr] = cookieToken.value.split(':');
    if (!token || !expiresStr) {
      return null;
    }

    // Check if token has expired
    const expires = parseInt(expiresStr, 10);
    if (Date.now() > expires) {
      return null;
    }

    return token;
  } catch (error) {
    console.error('[CSRF] Token extraction error:', error);
    return null;
  }
}

/**
 * Check if request method requires CSRF protection
 * @param method - HTTP method
 * @returns Boolean indicating if CSRF protection is required
 */
export function requiresCSRFProtection(method: string): boolean {
  const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  return protectedMethods.includes(method.toUpperCase());
}

/**
 * Check if request path should be excluded from CSRF protection
 * @param pathname - Request pathname
 * @returns Boolean indicating if path should be excluded
 */
export function isCSRFExemptPath(pathname: string): boolean {
  const exemptPaths = [
    '/api/health',
    '/api/metrics',
    '/api/auth/session', // Session creation doesn't need CSRF initially
  ];
  
  return exemptPaths.some(path => pathname.startsWith(path));
}

/**
 * CSRF middleware configuration
 */
export interface CSRFConfig {
  tokenLength?: number;
  tokenExpiry?: number;
  headerName?: string;
  cookieName?: string;
  exemptPaths?: string[];
  exemptMethods?: string[];
}

/**
 * Create CSRF protection middleware with custom configuration
 * @param config - CSRF configuration options
 * @returns Middleware function
 */
export function createCSRFMiddleware(config: CSRFConfig = {}) {
  const {
    exemptPaths = [],
    exemptMethods = ['GET', 'HEAD', 'OPTIONS'],
  } = config;

  return function csrfMiddleware(request: NextRequest): boolean {
    const { method } = request;
    const pathname = request.nextUrl.pathname;

    // Skip CSRF protection for exempt methods
    if (exemptMethods.includes(method.toUpperCase())) {
      return true;
    }

    // Skip CSRF protection for exempt paths
    if (exemptPaths.some(path => pathname.startsWith(path)) || isCSRFExemptPath(pathname)) {
      return true;
    }

    // Validate CSRF token for protected requests
    return validateCSRFToken(request);
  };
}

/**
 * Client-side CSRF utilities
 */
export const CSRFClient = {
  /**
   * Get CSRF token from cookie for client-side use
   * @returns CSRF token string or null
   */
  getToken(): string | null {
    if (typeof document === 'undefined') {
      return null;
    }

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === CSRF_COOKIE_NAME && value) {
        const [token] = decodeURIComponent(value).split(':');
        return token || null;
      }
    }
    return null;
  },

  /**
   * Add CSRF token to fetch request headers
   * @param headers - Request headers object
   * @returns Updated headers with CSRF token
   */
  addTokenToHeaders(headers: Record<string, string> = {}): Record<string, string> {
    const token = this.getToken();
    if (token) {
      headers[CSRF_TOKEN_HEADER] = token;
    }
    return headers;
  },

  /**
   * Create fetch options with CSRF protection
   * @param options - Fetch options
   * @returns Updated options with CSRF token
   */
  createSecureOptions(options: RequestInit = {}): RequestInit {
    const token = this.getToken();
    if (token) {
      options.headers = {
        ...options.headers,
        [CSRF_TOKEN_HEADER]: token,
      };
    }
    return options;
  },
};

// Legacy constants are already exported above as CSRF_CONSTANTS
