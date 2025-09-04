/**
 * CSRF Protection Tests
 * Comprehensive test suite for CSRF token generation, validation, and middleware
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  generateCSRFToken,
  createCSRFTokenWithExpiry,
  validateCSRFToken,
  requiresCSRFProtection,
  isCSRFExemptPath,
  createCSRFMiddleware,
  CSRFClient,
  CSRF_CONSTANTS,
} from '@/lib/csrf';

// Mock crypto.getRandomValues for consistent testing
const mockGetRandomValues = vi.fn();
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: mockGetRandomValues,
  },
});

// Mock btoa for Node.js environment
global.btoa = vi.fn((str: string) => Buffer.from(str, 'binary').toString('base64'));

describe('CSRF Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset crypto mock to return predictable values
    mockGetRandomValues.mockImplementation((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = i % 256;
      }
      return array;
    });
  });

  describe('generateCSRFToken', () => {
    it('should generate a token of correct length', () => {
      const token = generateCSRFToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate different tokens on multiple calls', () => {
      // Mock different random values for each call
      let callCount = 0;
      mockGetRandomValues.mockImplementation((array: Uint8Array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = (i + callCount) % 256;
        }
        callCount++;
        return array;
      });

      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(token1).not.toBe(token2);
    });

    it('should generate base64url encoded tokens', () => {
      const token = generateCSRFToken();
      // Base64url should not contain +, /, or = characters
      expect(token).not.toMatch(/[+/=]/);
    });
  });

  describe('createCSRFTokenWithExpiry', () => {
    it('should create token with expiry timestamp', () => {
      const result = createCSRFTokenWithExpiry();
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expires');
      expect(typeof result.token).toBe('string');
      expect(typeof result.expires).toBe('number');
      expect(result.expires).toBeGreaterThan(Date.now());
    });

    it('should set expiry 24 hours in the future', () => {
      const before = Date.now();
      const result = createCSRFTokenWithExpiry();
      const after = Date.now();
      
      const expectedExpiry = before + CSRF_CONSTANTS.TOKEN_EXPIRY;
      const actualExpiry = result.expires;
      
      // Allow for small timing differences
      expect(actualExpiry).toBeGreaterThanOrEqual(expectedExpiry - 1000);
      expect(actualExpiry).toBeLessThanOrEqual(after + CSRF_CONSTANTS.TOKEN_EXPIRY + 1000);
    });
  });

  describe('validateCSRFToken', () => {
    const createMockRequest = (headerToken?: string, cookieToken?: string) => {
      const headers = new Headers();
      if (headerToken) {
        headers.set(CSRF_CONSTANTS.TOKEN_HEADER, headerToken);
      }

      const cookies = new Map();
      if (cookieToken) {
        cookies.set(CSRF_CONSTANTS.COOKIE_NAME, { value: cookieToken });
      }

      return {
        headers,
        cookies: {
          get: (name: string) => cookies.get(name),
        },
      } as unknown as NextRequest;
    };

    it('should return false when header token is missing', () => {
      const request = createMockRequest(undefined, 'token:1234567890000');
      expect(validateCSRFToken(request)).toBe(false);
    });

    it('should return false when cookie token is missing', () => {
      const request = createMockRequest('token123');
      expect(validateCSRFToken(request)).toBe(false);
    });

    it('should return false when cookie format is invalid', () => {
      const request = createMockRequest('token123', 'invalidformat');
      expect(validateCSRFToken(request)).toBe(false);
    });

    it('should return false when token is expired', () => {
      const expiredTime = Date.now() - 1000; // 1 second ago
      const request = createMockRequest('token123', `token123:${expiredTime}`);
      expect(validateCSRFToken(request)).toBe(false);
    });

    it('should return false when tokens do not match', () => {
      const futureTime = Date.now() + 1000000;
      const request = createMockRequest('token123', `differenttoken:${futureTime}`);
      expect(validateCSRFToken(request)).toBe(false);
    });

    it('should return true when tokens match and not expired', () => {
      const futureTime = Date.now() + 1000000;
      const request = createMockRequest('token123', `token123:${futureTime}`);
      expect(validateCSRFToken(request)).toBe(true);
    });
  });

  describe('requiresCSRFProtection', () => {
    it('should require protection for POST requests', () => {
      expect(requiresCSRFProtection('POST')).toBe(true);
    });

    it('should require protection for PUT requests', () => {
      expect(requiresCSRFProtection('PUT')).toBe(true);
    });

    it('should require protection for PATCH requests', () => {
      expect(requiresCSRFProtection('PATCH')).toBe(true);
    });

    it('should require protection for DELETE requests', () => {
      expect(requiresCSRFProtection('DELETE')).toBe(true);
    });

    it('should not require protection for GET requests', () => {
      expect(requiresCSRFProtection('GET')).toBe(false);
    });

    it('should not require protection for HEAD requests', () => {
      expect(requiresCSRFProtection('HEAD')).toBe(false);
    });

    it('should not require protection for OPTIONS requests', () => {
      expect(requiresCSRFProtection('OPTIONS')).toBe(false);
    });

    it('should handle case insensitive methods', () => {
      expect(requiresCSRFProtection('post')).toBe(true);
      expect(requiresCSRFProtection('get')).toBe(false);
    });
  });

  describe('isCSRFExemptPath', () => {
    it('should exempt health check endpoint', () => {
      expect(isCSRFExemptPath('/api/health')).toBe(true);
      expect(isCSRFExemptPath('/api/health/status')).toBe(true);
    });

    it('should exempt metrics endpoint', () => {
      expect(isCSRFExemptPath('/api/metrics')).toBe(true);
      expect(isCSRFExemptPath('/api/metrics/performance')).toBe(true);
    });

    it('should exempt session creation endpoint', () => {
      expect(isCSRFExemptPath('/api/auth/session')).toBe(true);
    });

    it('should not exempt regular API endpoints', () => {
      expect(isCSRFExemptPath('/api/generate')).toBe(false);
      expect(isCSRFExemptPath('/api/user/profile')).toBe(false);
    });

    it('should not exempt non-API paths', () => {
      expect(isCSRFExemptPath('/dashboard')).toBe(false);
      expect(isCSRFExemptPath('/health')).toBe(false);
    });
  });

  describe('createCSRFMiddleware', () => {
    it('should create middleware function', () => {
      const middleware = createCSRFMiddleware();
      expect(typeof middleware).toBe('function');
    });

    it('should allow GET requests by default', () => {
      const middleware = createCSRFMiddleware();
      const request = {
        method: 'GET',
        nextUrl: { pathname: '/api/test' },
      } as NextRequest;
      
      expect(middleware(request)).toBe(true);
    });

    it('should allow custom exempt methods', () => {
      const middleware = createCSRFMiddleware({
        exemptMethods: ['GET', 'POST'],
      });
      
      const request = {
        method: 'POST',
        nextUrl: { pathname: '/api/test' },
      } as NextRequest;
      
      expect(middleware(request)).toBe(true);
    });

    it('should allow custom exempt paths', () => {
      const middleware = createCSRFMiddleware({
        exemptPaths: ['/api/custom'],
      });
      
      const request = {
        method: 'POST',
        nextUrl: { pathname: '/api/custom/endpoint' },
      } as NextRequest;
      
      expect(middleware(request)).toBe(true);
    });
  });

  describe('CSRFClient', () => {
    // Mock document for browser environment tests
    let mockDocument: { cookie: string };

    beforeEach(() => {
      mockDocument = {
        cookie: 'csrf-token=testtoken%3A1234567890000; other=value',
      };

      Object.defineProperty(global, 'document', {
        value: mockDocument,
        writable: true,
        configurable: true,
      });
    });

    describe('getToken', () => {
      it('should return null in server environment', () => {
        delete (global as any).document;
        expect(CSRFClient.getToken()).toBe(null);
      });

      it('should extract token from cookie', () => {
        const token = CSRFClient.getToken();
        expect(token).toBe('testtoken');
      });

      it('should return null when cookie not found', () => {
        mockDocument.cookie = 'other=value';
        const token = CSRFClient.getToken();
        expect(token).toBe(null);
      });

      it('should handle malformed cookie values', () => {
        mockDocument.cookie = 'csrf-token=malformed; other=value';
        const token = CSRFClient.getToken();
        expect(token).toBe('malformed');
      });
    });

    describe('addTokenToHeaders', () => {
      it('should add token to headers when available', () => {
        const headers = CSRFClient.addTokenToHeaders({ 'Content-Type': 'application/json' });
        expect(headers).toHaveProperty(CSRF_CONSTANTS.TOKEN_HEADER, 'testtoken');
        expect(headers).toHaveProperty('Content-Type', 'application/json');
      });

      it('should not modify headers when token unavailable', () => {
        mockDocument.cookie = 'other=value';
        const originalHeaders = { 'Content-Type': 'application/json' };
        const headers = CSRFClient.addTokenToHeaders(originalHeaders);
        expect(headers).not.toHaveProperty(CSRF_CONSTANTS.TOKEN_HEADER);
        expect(headers).toHaveProperty('Content-Type', 'application/json');
      });
    });

    describe('createSecureOptions', () => {
      it('should add token to request options', () => {
        const options = CSRFClient.createSecureOptions({
          method: 'POST',
          body: JSON.stringify({ data: 'test' }),
        });
        
        expect(options.headers).toHaveProperty(CSRF_CONSTANTS.TOKEN_HEADER, 'testtoken');
        expect(options.method).toBe('POST');
      });

      it('should preserve existing headers', () => {
        const options = CSRFClient.createSecureOptions({
          headers: { 'Custom-Header': 'value' },
        });
        
        expect(options.headers).toHaveProperty(CSRF_CONSTANTS.TOKEN_HEADER, 'testtoken');
        expect(options.headers).toHaveProperty('Custom-Header', 'value');
      });
    });
  });
});
