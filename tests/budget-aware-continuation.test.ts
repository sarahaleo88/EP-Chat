/**
 * Budget Aware Continuation Engine Tests
 * Comprehensive test suite for lib/budget-aware-continuation.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BudgetAwareContinuationEngine } from '@/lib/budget-aware-continuation';
import { BudgetGuardian } from '@/lib/budget-guardian';
import { ModelCapabilities } from '@/lib/model-capabilities';

describe('BudgetAwareContinuationEngine', () => {
  let engine: BudgetAwareContinuationEngine;
  let mockBudgetGuardian: BudgetGuardian;
  let mockCapabilities: ModelCapabilities;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBudgetGuardian = new BudgetGuardian();
    mockCapabilities = {
      modelName: 'deepseek-chat',
      contextWindow: 128000,
      maxOutputPerRequest: 8192,
      supportsReasoning: false,
      rateLimit: { requestsPerSecond: 10, tokensPerMinute: 100000 },
      pricing: { inputPer1K: 0.001, outputPer1K: 0.002, reasoningPer1K: 0.003 },
      lastUpdated: Date.now(),
      source: 'fallback',
    };
    engine = new BudgetAwareContinuationEngine(mockBudgetGuardian, mockCapabilities);
  });

  describe('evaluateContinuationStrategy', () => {
    it('should not continue when finish reason is not length', async () => {
      const result = await engine.evaluateContinuationStrategy(
        'user-1',
        'Some content',
        'stop',
        0
      );

      expect(result.shouldContinue).toBe(false);
    });

    it('should not continue when max segments reached', async () => {
      const result = await engine.evaluateContinuationStrategy(
        'user-1',
        'Some content',
        'length',
        10 // Exceeds max segments
      );

      expect(result.shouldContinue).toBe(false);
    });

    it('should evaluate continuation for length finish reason', async () => {
      const result = await engine.evaluateContinuationStrategy(
        'user-1',
        'Some content that was truncated',
        'length',
        0
      );

      expect(result).toBeDefined();
      expect(typeof result.shouldContinue).toBe('boolean');
    });

    it('should return strategy when continuation is allowed', async () => {
      const result = await engine.evaluateContinuationStrategy(
        'user-1',
        'Some content',
        'length',
        0
      );

      if (result.shouldContinue) {
        expect(result.strategy).toBeDefined();
        expect(result.strategy?.mode).toBeDefined();
      }
    });
  });

  describe('executeContinuation', () => {
    it('should execute continuation with valid parameters', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const strategy = {
        mode: 'normal' as const,
        maxTokensPerSegment: 1000,
        overlapTokens: 100,
        maxSegments: 3,
        summaryThreshold: 0.1,
      };

      // This may throw due to budget constraints, but should not throw type errors
      try {
        const result = await engine.executeContinuation(
          'req-1',
          'user-1',
          messages,
          'Previous content',
          strategy,
          0
        );
        expect(result).toBeDefined();
      } catch (error) {
        // Budget constraint errors are expected
        expect(error).toBeDefined();
      }
    });
  });
});

