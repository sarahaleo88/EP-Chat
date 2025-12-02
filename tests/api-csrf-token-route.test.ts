/**
 * Tests for app/api/csrf-token/route.ts
 * CSRF token generation API tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

describe('CSRF Token API Route', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('GET /api/csrf-token', () => {
    it('should return success response', async () => {
      const { GET } = await import('@/app/api/csrf-token/route');
      
      const request = new NextRequest('http://localhost:3000/api/csrf-token');
      const response = await GET(request);
      const data = await response.json();
      
      expect(data.success).toBe(true);
    });

    it('should return a token', async () => {
      const { GET } = await import('@/app/api/csrf-token/route');
      
      const request = new NextRequest('http://localhost:3000/api/csrf-token');
      const response = await GET(request);
      const data = await response.json();
      
      expect(data).toHaveProperty('token');
      expect(typeof data.token).toBe('string');
      expect(data.token.length).toBeGreaterThan(0);
    });

    it('should return expires timestamp', async () => {
      const { GET } = await import('@/app/api/csrf-token/route');
      
      const request = new NextRequest('http://localhost:3000/api/csrf-token');
      const response = await GET(request);
      const data = await response.json();
      
      expect(data).toHaveProperty('expires');
      expect(typeof data.expires).toBe('number');
      expect(data.expires).toBeGreaterThan(Date.now());
    });

    it('should set cookie in response', async () => {
      const { GET } = await import('@/app/api/csrf-token/route');
      
      const request = new NextRequest('http://localhost:3000/api/csrf-token');
      const response = await GET(request);
      
      // NextResponse cookies
      const cookies = response.cookies;
      expect(cookies).toBeDefined();
    });

    it('should return success message', async () => {
      const { GET } = await import('@/app/api/csrf-token/route');
      
      const request = new NextRequest('http://localhost:3000/api/csrf-token');
      const response = await GET(request);
      const data = await response.json();
      
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('successfully');
    });
  });

  describe('POST /api/csrf-token', () => {
    it('should refresh and return new token', async () => {
      const { POST } = await import('@/app/api/csrf-token/route');
      
      const request = new NextRequest('http://localhost:3000/api/csrf-token', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('token');
    });

    it('should return refreshed message', async () => {
      const { POST } = await import('@/app/api/csrf-token/route');
      
      const request = new NextRequest('http://localhost:3000/api/csrf-token', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();
      
      expect(data.message).toContain('refreshed');
    });

    it('should return new expires timestamp', async () => {
      const { POST } = await import('@/app/api/csrf-token/route');
      
      const request = new NextRequest('http://localhost:3000/api/csrf-token', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();
      
      expect(data.expires).toBeGreaterThan(Date.now());
    });
  });
});

