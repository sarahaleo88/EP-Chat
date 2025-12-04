/**
 * Tests for app/api/metrics/route.ts
 * Metrics collection API tests
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';

// Import once at the top to avoid re-registration issues
let GET: any;
let OPTIONS: any;

describe('Metrics API Route', () => {
  beforeAll(async () => {
    // Import once to avoid Prometheus metric re-registration
    const module = await import('@/app/api/metrics/route');
    GET = module.GET;
    OPTIONS = module.OPTIONS;
  });

  describe('GET /api/metrics', () => {
    it('should return JSON metrics when PROM_ENABLED is not set', async () => {
      const request = new NextRequest('http://localhost:3000/api/metrics');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('metrics');
    });

    it('should include request metrics', async () => {
      const request = new NextRequest('http://localhost:3000/api/metrics');
      const response = await GET(request);
      const data = await response.json();

      expect(data.metrics).toHaveProperty('requests');
      expect(data.metrics.requests).toHaveProperty('total');
      expect(data.metrics.requests).toHaveProperty('successful');
      expect(data.metrics.requests).toHaveProperty('failed');
    });

    it('should include error metrics', async () => {
      const request = new NextRequest('http://localhost:3000/api/metrics');
      const response = await GET(request);
      const data = await response.json();

      expect(data.metrics).toHaveProperty('errors');
      expect(data.metrics.errors).toHaveProperty('total');
      expect(data.metrics.errors).toHaveProperty('byType');
    });

    it('should include response time metrics', async () => {
      const request = new NextRequest('http://localhost:3000/api/metrics');
      const response = await GET(request);
      const data = await response.json();

      expect(data.metrics).toHaveProperty('responseTime');
      expect(data.metrics.responseTime).toHaveProperty('average');
      expect(data.metrics.responseTime).toHaveProperty('p50');
      expect(data.metrics.responseTime).toHaveProperty('p95');
      expect(data.metrics.responseTime).toHaveProperty('p99');
    });

    it('should include security metrics', async () => {
      const request = new NextRequest('http://localhost:3000/api/metrics');
      const response = await GET(request);
      const data = await response.json();

      expect(data.metrics).toHaveProperty('security');
      expect(data.metrics.security).toHaveProperty('csrfTokensGenerated');
    });

    it('should include system information', async () => {
      const request = new NextRequest('http://localhost:3000/api/metrics');
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty('system');
      expect(data.system).toHaveProperty('memory');
      expect(data.system).toHaveProperty('platform');
    });

    it('should set no-cache headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/metrics');
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    });
  });

  describe('OPTIONS /api/metrics', () => {
    it('should return CORS headers', async () => {
      const response = await OPTIONS();

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
    });
  });
});

