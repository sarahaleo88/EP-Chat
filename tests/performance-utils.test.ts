/**
 * Tests for lib/performance-utils.ts
 * Performance utility functions tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Performance Utils', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('PerformanceMonitor', () => {
    it('should import module without errors', async () => {
      const module = await import('@/lib/performance-utils');
      
      expect(module).toBeDefined();
    });

    it('should export PerformanceMonitor class', async () => {
      const { PerformanceMonitor } = await import('@/lib/performance-utils');
      
      expect(PerformanceMonitor).toBeDefined();
    });

    it('should have getInstance static method', async () => {
      const { PerformanceMonitor } = await import('@/lib/performance-utils');
      
      expect(typeof PerformanceMonitor.getInstance).toBe('function');
    });

    it('should return singleton instance', async () => {
      const { PerformanceMonitor } = await import('@/lib/performance-utils');
      
      const instance1 = PerformanceMonitor.getInstance();
      const instance2 = PerformanceMonitor.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should have startTiming method', async () => {
      const { PerformanceMonitor } = await import('@/lib/performance-utils');
      
      const instance = PerformanceMonitor.getInstance();
      
      expect(typeof instance.startTiming).toBe('function');
    });

    it('should return timing function from startTiming', async () => {
      const { PerformanceMonitor } = await import('@/lib/performance-utils');
      
      const instance = PerformanceMonitor.getInstance();
      const endTiming = instance.startTiming('test-operation');
      
      expect(typeof endTiming).toBe('function');
    });

    it('should measure timing correctly', async () => {
      const { PerformanceMonitor } = await import('@/lib/performance-utils');
      
      const instance = PerformanceMonitor.getInstance();
      const endTiming = instance.startTiming('test-operation');
      
      // Wait a small amount of time
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const duration = endTiming();
      
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('module exports', () => {
    it('should export expected functions and classes', async () => {
      const module = await import('@/lib/performance-utils');
      
      // Check for PerformanceMonitor
      expect(module.PerformanceMonitor).toBeDefined();
    });
  });
});

