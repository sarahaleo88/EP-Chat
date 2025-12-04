/**
 * CSRF-aware API client utilities
 * Provides secure API request methods with automatic CSRF token handling
 */

import { CSRF_CONSTANTS } from './csrf';

/**
 * CSRF-aware fetch wrapper
 * Automatically includes CSRF token in request headers
 */
export class CSRFApiClient {
  private csrfToken: string | null = null;
  private tokenExpiry: number = 0;

  /**
   * Initialize the client and fetch CSRF token
   */
  async initialize(): Promise<void> {
    await this.refreshCSRFToken();
  }

  /**
   * Fetch a new CSRF token from the server
   */
  async refreshCSRFToken(): Promise<void> {
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        this.csrfToken = data.token;
        this.tokenExpiry = data.expires;
      } else {
        console.warn('[CSRF Client] Failed to fetch CSRF token');
        this.csrfToken = null;
        this.tokenExpiry = 0;
      }
    } catch (error) {
      console.error('[CSRF Client] Error fetching CSRF token:', error);
      this.csrfToken = null;
      this.tokenExpiry = 0;
    }
  }

  /**
   * Check if current token is valid and not expired
   */
  private isTokenValid(): boolean {
    return this.csrfToken !== null && Date.now() < this.tokenExpiry;
  }

  /**
   * Get CSRF token, refreshing if necessary
   */
  async getCSRFToken(): Promise<string | null> {
    if (!this.isTokenValid()) {
      await this.refreshCSRFToken();
    }
    return this.csrfToken;
  }

  /**
   * Create secure fetch options with CSRF token
   */
  async createSecureOptions(options: RequestInit = {}): Promise<RequestInit> {
    const token = await this.getCSRFToken();
    
    const secureOptions: RequestInit = {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Add CSRF token for state-changing requests
    if (token && this.requiresCSRFToken(options.method)) {
      (secureOptions.headers as Record<string, string>)[CSRF_CONSTANTS.TOKEN_HEADER] = token;
    }

    return secureOptions;
  }

  /**
   * Check if request method requires CSRF token
   */
  private requiresCSRFToken(method?: string): boolean {
    if (!method) {return false;}
    const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    return protectedMethods.includes(method.toUpperCase());
  }

  /**
   * Secure fetch wrapper with automatic CSRF token handling
   */
  async secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const secureOptions = await this.createSecureOptions(options);
    
    try {
      const response = await fetch(url, secureOptions);
      
      // If we get a 403 with CSRF error, try refreshing token once
      if (response.status === 403) {
        const errorData = await response.clone().json().catch(() => ({}));
        if (errorData.code === 'CSRF_TOKEN_INVALID') {
          console.warn('[CSRF Client] CSRF token invalid, refreshing and retrying...');
          await this.refreshCSRFToken();
          
          // Retry with new token
          const retryOptions = await this.createSecureOptions(options);
          return fetch(url, retryOptions);
        }
      }
      
      return response;
    } catch (error) {
      console.error('[CSRF Client] Secure fetch error:', error);
      throw error;
    }
  }

  /**
   * Secure POST request
   */
  async post(url: string, data?: any, options: RequestInit = {}): Promise<Response> {
    return this.secureFetch(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
    });
  }

  /**
   * Secure PUT request
   */
  async put(url: string, data?: any, options: RequestInit = {}): Promise<Response> {
    return this.secureFetch(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : null,
    });
  }

  /**
   * Secure PATCH request
   */
  async patch(url: string, data?: any, options: RequestInit = {}): Promise<Response> {
    return this.secureFetch(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : null,
    });
  }

  /**
   * Secure DELETE request
   */
  async delete(url: string, options: RequestInit = {}): Promise<Response> {
    return this.secureFetch(url, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * Regular GET request (no CSRF token needed)
   */
  async get(url: string, options: RequestInit = {}): Promise<Response> {
    return fetch(url, {
      ...options,
      method: 'GET',
      credentials: 'include',
    });
  }
}

// Global CSRF-aware API client instance
let globalCSRFClient: CSRFApiClient | null = null;

/**
 * Get or create global CSRF API client
 */
export async function getCSRFApiClient(): Promise<CSRFApiClient> {
  if (!globalCSRFClient) {
    globalCSRFClient = new CSRFApiClient();
    await globalCSRFClient.initialize();
  }
  return globalCSRFClient;
}

/**
 * Simple CSRF-aware fetch function for one-off requests
 */
export async function csrfFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const client = await getCSRFApiClient();
  return client.secureFetch(url, options);
}

/**
 * CSRF-aware POST helper
 */
export async function csrfPost(url: string, data?: any, options: RequestInit = {}): Promise<Response> {
  const client = await getCSRFApiClient();
  return client.post(url, data, options);
}

/**
 * Legacy support: Get CSRF token from cookie (client-side only)
 */
export function getCSRFTokenFromCookie(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_CONSTANTS.COOKIE_NAME && value) {
      try {
        const [token] = decodeURIComponent(value).split(':');
        return token || null;
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Add CSRF token to existing headers object
 */
export function addCSRFTokenToHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const token = getCSRFTokenFromCookie();
  if (token) {
    headers[CSRF_CONSTANTS.TOKEN_HEADER] = token;
  }
  return headers;
}
