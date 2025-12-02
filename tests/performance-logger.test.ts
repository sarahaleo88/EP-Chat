/**
 * Performance Logger Tests
 * Comprehensive test suite for lib/performance-logger.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceLogger } from '@/lib/performance-logger';

describe('PerformanceLogger', () => {
  let logger: PerformanceLogger;

  beforeEach(() => {
    vi.clearAllMocks();
    logger = new PerformanceLogger();
  });

  describe('constructor', () => {
    it('should create logger with default settings', () => {
      const log = new PerformanceLogger();
      expect(log).toBeDefined();
    });

    it('should create disabled logger', () => {
      const log = new PerformanceLogger(false);
      expect(log).toBeDefined();
    });

    it('should accept custom max metrics', () => {
      const log = new PerformanceLogger(true, 500);
      expect(log).toBeDefined();
    });
  });

  describe('startRequest', () => {
    it('should return request ID', () => {
      const requestId = logger.startRequest('test-operation');
      expect(requestId).toBeDefined();
      expect(requestId).toContain('req_');
    });

    it('should return empty string when disabled', () => {
      const disabledLogger = new PerformanceLogger(false);
      const requestId = disabledLogger.startRequest('test-operation');
      expect(requestId).toBe('');
    });

    it('should accept model parameter', () => {
      const requestId = logger.startRequest('test-operation', 'deepseek-chat');
      expect(requestId).toBeDefined();
    });
  });

  describe('endRequest', () => {
    it('should complete request tracking', () => {
      const requestId = logger.startRequest('test-operation');
      logger.endRequest(requestId, true, {});
      // Should not throw
    });

    it('should handle success with options', () => {
      const requestId = logger.startRequest('test-operation');
      logger.endRequest(requestId, true, {
        cacheHit: true,
        tokenCount: 100,
      });
    });

    it('should handle failure with error type', () => {
      const requestId = logger.startRequest('test-operation');
      logger.endRequest(requestId, false, {
        errorType: 'network_error',
      });
    });
  });

  describe('getStats', () => {
    it('should return performance stats', () => {
      const stats = logger.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.totalRequests).toBe('number');
      expect(typeof stats.successfulRequests).toBe('number');
      expect(typeof stats.failedRequests).toBe('number');
    });

    it('should calculate stats after requests', () => {
      const requestId = logger.startRequest('test-operation');
      logger.endRequest(requestId, true, {});

      const stats = logger.getStats();
      expect(stats.totalRequests).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getRecentMetrics', () => {
    it('should return recent metrics', () => {
      const metrics = logger.getRecentMetrics();
      expect(Array.isArray(metrics)).toBe(true);
    });

    it('should return limited metrics', () => {
      const metrics = logger.getRecentMetrics(5);
      expect(metrics.length).toBeLessThanOrEqual(5);
    });
  });

  describe('clearMetrics', () => {
    it('should clear all metrics', () => {
      const requestId = logger.startRequest('test-operation');
      logger.endRequest(requestId, true, {});

      logger.clearMetrics();

      const stats = logger.getStats();
      expect(stats.totalRequests).toBe(0);
    });
  });
});

