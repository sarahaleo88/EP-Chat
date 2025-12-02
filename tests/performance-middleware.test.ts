/**
 * Tests for lib/performance-middleware.ts
 * Performance tracking middleware tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Performance Middleware', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('getPerformanceMetrics', () => {
    it('should return initial metrics', async () => {
      const { getPerformanceMetrics, resetPerformanceMetrics } = await import('@/lib/performance-middleware');
      
      resetPerformanceMetrics();
      const metrics = getPerformanceMetrics();
      
      expect(metrics.requestCount).toBe(0);
      expect(metrics.totalResponseTime).toBe(0);
      expect(metrics.averageResponseTime).toBe(0);
      expect(metrics.fastRequests).toBe(0);
      expect(metrics.performanceScore).toBe(100);
    });

    it('should return performance score', async () => {
      const { getPerformanceMetrics, resetPerformanceMetrics } = await import('@/lib/performance-middleware');
      
      resetPerformanceMetrics();
      const metrics = getPerformanceMetrics();
      
      expect(typeof metrics.performanceScore).toBe('number');
      expect(metrics.performanceScore).toBeGreaterThanOrEqual(0);
      expect(metrics.performanceScore).toBeLessThanOrEqual(100);
    });

    it('should return fast request ratio', async () => {
      const { getPerformanceMetrics, resetPerformanceMetrics } = await import('@/lib/performance-middleware');
      
      resetPerformanceMetrics();
      const metrics = getPerformanceMetrics();
      
      expect(metrics.fastRequestRatio).toBe('100.0%');
    });
  });

  describe('resetPerformanceMetrics', () => {
    it('should reset all metrics to initial values', async () => {
      const { getPerformanceMetrics, resetPerformanceMetrics } = await import('@/lib/performance-middleware');
      
      resetPerformanceMetrics();
      const metrics = getPerformanceMetrics();
      
      expect(metrics.requestCount).toBe(0);
      expect(metrics.slowRequests).toHaveLength(0);
    });
  });

  describe('MemoryOptimizer', () => {
    it('should have cleanup function', async () => {
      const { MemoryOptimizer } = await import('@/lib/performance-middleware');
      
      expect(typeof MemoryOptimizer.cleanup).toBe('function');
    });

    it('should return memory stats', async () => {
      const { MemoryOptimizer } = await import('@/lib/performance-middleware');
      
      const stats = MemoryOptimizer.getMemoryStats();
      
      expect(stats).toHaveProperty('heapUsed');
      expect(stats).toHaveProperty('heapTotal');
      expect(stats).toHaveProperty('external');
      expect(stats).toHaveProperty('rss');
    });

    it('should format memory stats as strings', async () => {
      const { MemoryOptimizer } = await import('@/lib/performance-middleware');
      
      const stats = MemoryOptimizer.getMemoryStats();
      
      expect(stats.heapUsed).toMatch(/\d+MB/);
      expect(stats.heapTotal).toMatch(/\d+MB/);
    });
  });

  describe('createOptimizedFetch', () => {
    it('should return a fetch function', async () => {
      const { createOptimizedFetch } = await import('@/lib/performance-middleware');
      
      const optimizedFetch = createOptimizedFetch();
      
      expect(typeof optimizedFetch).toBe('function');
    });
  });

  describe('withPerformanceTracking', () => {
    it('should be a function', async () => {
      const { withPerformanceTracking } = await import('@/lib/performance-middleware');
      
      expect(typeof withPerformanceTracking).toBe('function');
    });
  });
});

