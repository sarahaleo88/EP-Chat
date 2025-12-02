/**
 * Long Text Timeout Manager Tests
 * Comprehensive test suite for lib/long-text-timeout-manager.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LongTextTimeoutManager, createLongTextTimeoutManager } from '@/lib/long-text-timeout-manager';

describe('LongTextTimeoutManager', () => {
  let manager: LongTextTimeoutManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new LongTextTimeoutManager();
  });

  afterEach(() => {
    manager.cleanup();
  });

  describe('getTimeout', () => {
    it('should return initial connection timeout', () => {
      const timeout = manager.getTimeout('deepseek-chat', 'initial');

      expect(timeout).toBeGreaterThan(0);
    });

    it('should return streaming timeout', () => {
      const timeout = manager.getTimeout('deepseek-chat', 'streaming');

      expect(timeout).toBeGreaterThan(0);
    });

    it('should return continuation timeout', () => {
      const timeout = manager.getTimeout('deepseek-chat', 'continuation');

      expect(timeout).toBeGreaterThan(0);
    });

    it('should return timeout for unknown model (fallback to deepseek-chat)', () => {
      const timeout = manager.getTimeout('unknown-model', 'initial');

      expect(timeout).toBeGreaterThan(0);
    });
  });

  describe('analyzeTimeout', () => {
    it('should return timeout result for initial phase', () => {
      const context = {
        model: 'deepseek-chat',
        phase: 'initial' as const,
        lastChunkTime: Date.now(),
        retryCount: 0,
      };

      const result = manager.analyzeTimeout(context);

      expect(result).toBeDefined();
      expect(typeof result.shouldRetry).toBe('boolean');
      expect(result.errorMessage).toBeDefined();
      expect(result.userFriendlyMessage).toBeDefined();
    });

    it('should suggest retry for first timeout', () => {
      const context = {
        model: 'deepseek-chat',
        phase: 'streaming' as const,
        lastChunkTime: Date.now(),
        retryCount: 0,
      };

      const result = manager.analyzeTimeout(context);

      expect(result.shouldRetry).toBe(true);
      expect(result.nextTimeout).toBeGreaterThan(0);
    });

    it('should not retry after max retries', () => {
      const context = {
        model: 'deepseek-chat',
        phase: 'streaming' as const,
        lastChunkTime: Date.now(),
        retryCount: 10,
      };

      const result = manager.analyzeTimeout(context);

      expect(result.shouldRetry).toBe(false);
    });

    it('should provide user-friendly message', () => {
      const context = {
        model: 'deepseek-chat',
        phase: 'streaming' as const,
        lastChunkTime: Date.now(),
        retryCount: 0,
      };

      const result = manager.analyzeTimeout(context);

      expect(result.userFriendlyMessage).toBeDefined();
      expect(result.userFriendlyMessage.length).toBeGreaterThan(0);
    });
  });

  describe('createProgressiveTimeout', () => {
    it('should create progressive timeout handler', () => {
      const context = {
        model: 'deepseek-chat',
        phase: 'streaming' as const,
        lastChunkTime: Date.now(),
        retryCount: 0,
      };

      const cleanup = manager.createProgressiveTimeout('test-id', context, () => {});

      expect(typeof cleanup).toBe('function');
      cleanup(); // Clean up
    });
  });

  describe('getTimeoutStats', () => {
    it('should return stats for model', () => {
      const stats = manager.getTimeoutStats('deepseek-chat');

      expect(stats).toBeDefined();
      expect(typeof stats.totalTimeouts).toBe('number');
      expect(typeof stats.recentTimeouts).toBe('number');
    });
  });

  describe('getRecommendedConfig', () => {
    it('should return recommended config', () => {
      const config = manager.getRecommendedConfig('deepseek-chat');

      expect(config).toBeDefined();
      expect(config.initialConnection).toBeGreaterThan(0);
      expect(config.streamingResponse).toBeGreaterThan(0);
    });
  });

  describe('cleanup', () => {
    it('should cleanup without error', () => {
      expect(() => manager.cleanup()).not.toThrow();
    });
  });
});

describe('createLongTextTimeoutManager', () => {
  it('should create a new manager instance', () => {
    const manager = createLongTextTimeoutManager();
    expect(manager).toBeInstanceOf(LongTextTimeoutManager);
    manager.cleanup();
  });
});

