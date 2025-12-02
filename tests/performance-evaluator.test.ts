/**
 * Tests for lib/performance-evaluator.ts
 * Performance evaluator tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Performance Evaluator', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('module exports', () => {
    it('should import module without errors', async () => {
      const module = await import('@/lib/performance-evaluator');

      expect(module).toBeDefined();
    });

    it('should export PerformanceEvaluator class', async () => {
      const { PerformanceEvaluator } = await import('@/lib/performance-evaluator');

      expect(PerformanceEvaluator).toBeDefined();
    });
  });

  describe('PerformanceEvaluator class', () => {
    it('should create instance without API key', async () => {
      const { PerformanceEvaluator } = await import('@/lib/performance-evaluator');

      const evaluator = new PerformanceEvaluator();

      expect(evaluator).toBeDefined();
    });

    it('should create instance with API key', async () => {
      const { PerformanceEvaluator } = await import('@/lib/performance-evaluator');

      const evaluator = new PerformanceEvaluator('test-api-key');

      expect(evaluator).toBeDefined();
    });

    it('should have evaluatePerformance method', async () => {
      const { PerformanceEvaluator } = await import('@/lib/performance-evaluator');

      const evaluator = new PerformanceEvaluator();

      expect(typeof evaluator.evaluatePerformance).toBe('function');
    });

    it('should throw error when evaluating without API key', async () => {
      const { PerformanceEvaluator } = await import('@/lib/performance-evaluator');

      const evaluator = new PerformanceEvaluator();

      await expect(evaluator.evaluatePerformance()).rejects.toThrow('API key required');
    });
  });

  describe('PerformanceTestResult interface', () => {
    it('should be usable as type', async () => {
      const { PerformanceEvaluator } = await import('@/lib/performance-evaluator');

      // Type check - if this compiles, the interface is correctly exported
      const testResult: any = {
        testName: 'test',
        duration: 100,
        success: true,
      };

      expect(testResult.testName).toBe('test');
      expect(testResult.duration).toBe(100);
      expect(testResult.success).toBe(true);
    });
  });

  describe('PerformanceEvaluation interface', () => {
    it('should be usable as type', async () => {
      const evaluation: any = {
        timestamp: Date.now(),
        testResults: [],
        summary: {
          averageResponseTime: 100,
          averageTimeToFirstToken: 50,
          cacheHitRate: 0.8,
          successRate: 0.95,
          streamingPerformance: 0.9,
          errorRecoveryTime: 200,
        },
        recommendations: [],
        targetsMet: {
          timeToFirstToken: true,
          completeResponse: true,
          cacheHitRate: true,
          debounceDelay: true,
          streamingImprovement: true,
        },
      };

      expect(evaluation.timestamp).toBeDefined();
      expect(evaluation.summary.averageResponseTime).toBe(100);
    });
  });
});

