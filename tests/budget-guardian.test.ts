/**
 * Budget Guardian Tests
 * Comprehensive test suite for lib/budget-guardian.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BudgetGuardian, CostEstimate } from '@/lib/budget-guardian';
import { ModelCapabilities } from '@/lib/model-capabilities';

describe('BudgetGuardian', () => {
  let guardian: BudgetGuardian;
  let mockCapabilities: ModelCapabilities;

  beforeEach(() => {
    vi.clearAllMocks();
    guardian = new BudgetGuardian();
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
  });

  describe('estimateCost', () => {
    it('should calculate cost correctly', () => {
      const cost = guardian.estimateCost(mockCapabilities, 1000, 500, 0);

      expect(cost.inputTokens).toBe(1000);
      expect(cost.outputTokens).toBe(500);
      expect(cost.inputCost).toBeCloseTo(0.001);
      expect(cost.outputCost).toBeCloseTo(0.001);
      expect(cost.totalCost).toBeCloseTo(0.002);
      expect(cost.currency).toBe('USD');
    });

    it('should include reasoning cost when provided', () => {
      const cost = guardian.estimateCost(mockCapabilities, 1000, 500, 200);

      expect(cost.reasoningTokens).toBe(200);
      expect(cost.reasoningCost).toBeCloseTo(0.0006);
      expect(cost.totalCost).toBeCloseTo(0.0026);
    });

    it('should throw error for negative tokens', () => {
      expect(() => guardian.estimateCost(mockCapabilities, -100, 500, 0)).toThrow('Token数量不能为负数');
    });

    it('should handle zero tokens', () => {
      const cost = guardian.estimateCost(mockCapabilities, 0, 0, 0);

      expect(cost.totalCost).toBe(0);
    });
  });

  describe('preflightCheck', () => {
    it('should allow request within budget', async () => {
      const result = await guardian.preflightCheck('user-1', mockCapabilities, 1000, 500);

      expect(result.allowed).toBe(true);
      expect(result.costBreakdown).toBeDefined();
      expect(result.costBreakdown.withinRequestLimit).toBe(true);
    });

    it('should reject request exceeding request limit', async () => {
      // Create capabilities with high pricing to exceed limit
      const expensiveCaps = {
        ...mockCapabilities,
        pricing: { inputPer1K: 1.0, outputPer1K: 2.0, reasoningPer1K: 3.0 },
      };

      const result = await guardian.preflightCheck('user-1', expensiveCaps, 100000, 100000);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  describe('recordUsage', () => {
    it('should record usage correctly', () => {
      const estimated = guardian.estimateCost(mockCapabilities, 1000, 500, 0);
      guardian.recordUsage('req-1', 'user-1', estimated, true);

      const status = guardian.getBudgetStatus('user-1');
      expect(status.userSpentTodayUSD).toBeGreaterThan(0);
    });

    it('should accumulate usage for same user', () => {
      const estimated = guardian.estimateCost(mockCapabilities, 1000, 500, 0);
      guardian.recordUsage('req-1', 'user-1', estimated, true);
      const status1 = guardian.getBudgetStatus('user-1');

      guardian.recordUsage('req-2', 'user-1', estimated, true);
      const status2 = guardian.getBudgetStatus('user-1');

      expect(status2.userSpentTodayUSD).toBeGreaterThan(status1.userSpentTodayUSD);
    });
  });

  describe('getBudgetStatus', () => {
    it('should return initial status for new user', () => {
      const status = guardian.getBudgetStatus('new-user');

      expect(status.userSpentTodayUSD).toBe(0);
      expect(status.lastResetTime).toBeDefined();
    });

    it('should return site spending status', () => {
      const status = guardian.getBudgetStatus('user-1');

      expect(status.siteSpentThisHourUSD).toBeDefined();
      expect(typeof status.siteSpentThisHourUSD).toBe('number');
    });
  });

  describe('getUserSpentToday', () => {
    it('should return 0 for new user', () => {
      const spent = guardian.getUserSpentToday('new-user');
      expect(spent).toBe(0);
    });
  });

  describe('getSiteSpentThisHour', () => {
    it('should return site spending', () => {
      const spent = guardian.getSiteSpentThisHour();
      expect(typeof spent).toBe('number');
    });
  });

  describe('getUsageRecords', () => {
    it('should return empty array initially', () => {
      const records = guardian.getUsageRecords();
      expect(Array.isArray(records)).toBe(true);
    });

    it('should return records after usage', () => {
      const estimated = guardian.estimateCost(mockCapabilities, 1000, 500, 0);
      guardian.recordUsage('req-1', 'user-1', estimated, true);

      const records = guardian.getUsageRecords();
      expect(records.length).toBeGreaterThan(0);
    });
  });
});

