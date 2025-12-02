/**
 * Tests for app/api/health/route.ts
 * Health check API endpoint tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Health API Route', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const { GET } = await import('@/app/api/health/route');

      const response = await GET();
      const data = await response.json();

      // Status can be 200 (healthy) or 503 (unhealthy/degraded)
      expect([200, 503]).toContain(response.status);
      expect(data).toHaveProperty('status');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status);
    });

    it('should return timestamp', async () => {
      const { GET } = await import('@/app/api/health/route');

      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('timestamp');
      expect(new Date(data.timestamp).getTime()).not.toBeNaN();
    });

    it('should return status field in response', async () => {
      const { GET } = await import('@/app/api/health/route');

      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('status');
      expect(typeof data.status).toBe('string');
    });

    it('should have proper cache-control headers', async () => {
      const { GET } = await import('@/app/api/health/route');

      const response = await GET();
      const cacheControl = response.headers.get('Cache-Control');

      expect(cacheControl).toContain('no-cache');
    });

    it('should have content-type JSON header', async () => {
      const { GET } = await import('@/app/api/health/route');

      const response = await GET();
      const contentType = response.headers.get('Content-Type');

      expect(contentType).toContain('application/json');
    });

    it('should return valid JSON', async () => {
      const { GET } = await import('@/app/api/health/route');

      const response = await GET();
      const data = await response.json();

      expect(data).toBeDefined();
      expect(typeof data).toBe('object');
    });
  });
});

