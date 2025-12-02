/**
 * Tests for app/api/security-metrics/route.ts
 * Security metrics API tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

describe('Security Metrics API Route', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('GET /api/security-metrics', () => {
    it('should return security metrics', async () => {
      const { GET } = await import('@/app/api/security-metrics/route');
      
      const request = new NextRequest('http://localhost:3000/api/security-metrics');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
    });

    it('should include security score', async () => {
      const { GET } = await import('@/app/api/security-metrics/route');
      
      const request = new NextRequest('http://localhost:3000/api/security-metrics');
      const response = await GET(request);
      const data = await response.json();
      
      expect(data).toHaveProperty('securityScore');
      expect(typeof data.securityScore).toBe('number');
      expect(data.securityScore).toBeGreaterThanOrEqual(0);
      expect(data.securityScore).toBeLessThanOrEqual(100);
    });

    it('should include metrics object', async () => {
      const { GET } = await import('@/app/api/security-metrics/route');
      
      const request = new NextRequest('http://localhost:3000/api/security-metrics');
      const response = await GET(request);
      const data = await response.json();
      
      expect(data).toHaveProperty('metrics');
    });

    it('should include system health', async () => {
      const { GET } = await import('@/app/api/security-metrics/route');
      
      const request = new NextRequest('http://localhost:3000/api/security-metrics');
      const response = await GET(request);
      const data = await response.json();
      
      expect(data).toHaveProperty('systemHealth');
      expect(data.systemHealth).toHaveProperty('uptime');
      expect(data.systemHealth).toHaveProperty('memoryUsage');
    });

    it('should include alerts array', async () => {
      const { GET } = await import('@/app/api/security-metrics/route');
      
      const request = new NextRequest('http://localhost:3000/api/security-metrics');
      const response = await GET(request);
      const data = await response.json();
      
      expect(data).toHaveProperty('alerts');
      expect(Array.isArray(data.alerts)).toBe(true);
    });

    it('should set no-cache headers', async () => {
      const { GET } = await import('@/app/api/security-metrics/route');
      
      const request = new NextRequest('http://localhost:3000/api/security-metrics');
      const response = await GET(request);
      
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    });
  });

  describe('POST /api/security-metrics', () => {
    it('should log security event', async () => {
      const { POST } = await import('@/app/api/security-metrics/route');
      
      const request = new NextRequest('http://localhost:3000/api/security-metrics', {
        method: 'POST',
        body: JSON.stringify({
          type: 'test_event',
          severity: 'low',
          details: 'Test security event',
        }),
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.status).toBe('success');
    });

    it('should reject missing required fields', async () => {
      const { POST } = await import('@/app/api/security-metrics/route');
      
      const request = new NextRequest('http://localhost:3000/api/security-metrics', {
        method: 'POST',
        body: JSON.stringify({
          type: 'test_event',
          // missing severity and details
        }),
      });
      
      const response = await POST(request);
      
      expect(response.status).toBe(400);
    });
  });
});

