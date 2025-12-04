/**
 * CSP Nonce Tests
 * Comprehensive test suite for lib/csp-nonce.ts
 */

import { describe, it, expect } from 'vitest';
import { generateCSPNonce, createCSPWithNonce, getNonceFromHeaders } from '@/lib/csp-nonce';

describe('generateCSPNonce', () => {
  it('should generate a base64 encoded nonce', () => {
    const nonce = generateCSPNonce();
    expect(nonce).toBeDefined();
    expect(typeof nonce).toBe('string');
    expect(nonce.length).toBeGreaterThan(0);
  });

  it('should generate nonces of expected length', () => {
    const nonce = generateCSPNonce();
    // Base64 encoded 16 bytes should be around 24 characters
    expect(nonce.length).toBeGreaterThanOrEqual(20);
    expect(nonce.length).toBeLessThanOrEqual(28);
  });

  it('should generate valid base64 string', () => {
    const nonce = generateCSPNonce();
    // Base64 characters: A-Z, a-z, 0-9, +, /, =
    expect(nonce).toMatch(/^[A-Za-z0-9+/=]+$/);
  });
});

describe('createCSPWithNonce', () => {
  it('should create CSP header with nonce', () => {
    const nonce = 'test-nonce-123';
    const csp = createCSPWithNonce(nonce);
    
    expect(csp).toContain(`'nonce-${nonce}'`);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("style-src 'self'");
  });

  it('should include all required CSP directives', () => {
    const nonce = 'test-nonce';
    const csp = createCSPWithNonce(nonce);
    
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("font-src 'self'");
    expect(csp).toContain("img-src 'self'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("object-src 'none'");
  });

  it('should include DeepSeek API in connect-src', () => {
    const nonce = 'test-nonce';
    const csp = createCSPWithNonce(nonce);
    
    expect(csp).toContain('https://api.deepseek.com');
  });

  it('should include security enhancements', () => {
    const nonce = 'test-nonce';
    const csp = createCSPWithNonce(nonce);
    
    expect(csp).toContain('upgrade-insecure-requests');
    expect(csp).toContain('block-all-mixed-content');
  });
});

describe('getNonceFromHeaders', () => {
  it('should return nonce from headers', () => {
    const headers = new Headers();
    headers.set('x-csp-nonce', 'test-nonce-value');
    
    const nonce = getNonceFromHeaders(headers);
    expect(nonce).toBe('test-nonce-value');
  });

  it('should return null when nonce header is missing', () => {
    const headers = new Headers();
    
    const nonce = getNonceFromHeaders(headers);
    expect(nonce).toBeNull();
  });

  it('should handle empty headers', () => {
    const headers = new Headers();
    headers.set('other-header', 'value');
    
    const nonce = getNonceFromHeaders(headers);
    expect(nonce).toBeNull();
  });
});

