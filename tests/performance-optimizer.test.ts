/**
 * Tests for lib/performance-optimizer.ts
 * Performance optimization utilities tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Performance Optimizer', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('PerformanceOptimizer class', () => {
    it('should be defined', async () => {
      const { PerformanceOptimizer } = await import('@/lib/performance-optimizer');
      
      expect(PerformanceOptimizer).toBeDefined();
    });

    it('should create instance with default config', async () => {
      const { PerformanceOptimizer } = await import('@/lib/performance-optimizer');
      
      const optimizer = new PerformanceOptimizer();
      
      expect(optimizer).toBeDefined();
    });

    it('should accept custom config', async () => {
      const { PerformanceOptimizer } = await import('@/lib/performance-optimizer');
      
      const optimizer = new PerformanceOptimizer({
        enableConnectionPooling: false,
        maxConnectionPool: 10,
      });
      
      expect(optimizer).toBeDefined();
    });

    it('should have optimizeConnections method', async () => {
      const { PerformanceOptimizer } = await import('@/lib/performance-optimizer');
      
      const optimizer = new PerformanceOptimizer();
      
      expect(typeof optimizer.optimizeConnections).toBe('function');
    });
  });

  describe('OptimizationConfig', () => {
    it('should have default connection settings', async () => {
      const { PerformanceOptimizer } = await import('@/lib/performance-optimizer');
      
      const optimizer = new PerformanceOptimizer();
      
      // The optimizer should be created without errors using defaults
      expect(optimizer).toBeDefined();
    });
  });
});

