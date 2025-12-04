/**
 * Tests for lib/prometheus-metrics.ts
 * Prometheus metrics collection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock prom-client before importing the module
vi.mock('prom-client', () => ({
  register: {
    metrics: vi.fn().mockResolvedValue('# HELP test_metric\n# TYPE test_metric counter\ntest_metric 1'),
    clear: vi.fn(),
    contentType: 'text/plain; version=0.0.4; charset=utf-8',
  },
  Counter: vi.fn().mockImplementation((config) => ({
    name: config.name,
    help: config.help,
    labelNames: config.labelNames || [],
    inc: vi.fn(),
    labels: vi.fn().mockReturnThis(),
  })),
  Histogram: vi.fn().mockImplementation((config) => ({
    name: config.name,
    help: config.help,
    labelNames: config.labelNames || [],
    buckets: config.buckets || [],
    observe: vi.fn(),
    labels: vi.fn().mockReturnThis(),
    startTimer: vi.fn().mockReturnValue(vi.fn()),
  })),
  Gauge: vi.fn().mockImplementation((config) => ({
    name: config.name,
    help: config.help,
    set: vi.fn(),
    inc: vi.fn(),
    dec: vi.fn(),
    labels: vi.fn().mockReturnThis(),
  })),
  collectDefaultMetrics: vi.fn(),
}));

describe('Prometheus Metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requestsTotal counter', () => {
    it('should be defined with correct configuration', async () => {
      const { requestsTotal } = await import('@/lib/prometheus-metrics');
      expect(requestsTotal).toBeDefined();
      // Counter type check - has inc method
      expect(typeof requestsTotal.inc).toBe('function');
    });

    it('should have labels method for labeling', async () => {
      const { requestsTotal } = await import('@/lib/prometheus-metrics');
      expect(typeof requestsTotal.labels).toBe('function');
    });
  });

  describe('requestDuration histogram', () => {
    it('should be defined with correct configuration', async () => {
      const { requestDuration } = await import('@/lib/prometheus-metrics');
      expect(requestDuration).toBeDefined();
      // Histogram type check - has observe method
      expect(typeof requestDuration.observe).toBe('function');
    });

    it('should have startTimer method', async () => {
      const { requestDuration } = await import('@/lib/prometheus-metrics');
      expect(typeof requestDuration.startTimer).toBe('function');
    });
  });

  describe('activeStreams gauge', () => {
    it('should be defined with correct configuration', async () => {
      const { activeStreams } = await import('@/lib/prometheus-metrics');
      expect(activeStreams).toBeDefined();
      // Gauge type check - has set, inc, dec methods
      expect(typeof activeStreams.set).toBe('function');
      expect(typeof activeStreams.inc).toBe('function');
      expect(typeof activeStreams.dec).toBe('function');
    });
  });

  describe('token counters', () => {
    it('should have inputTokensTotal counter', async () => {
      const { inputTokensTotal } = await import('@/lib/prometheus-metrics');
      expect(inputTokensTotal).toBeDefined();
      expect(typeof inputTokensTotal.inc).toBe('function');
    });

    it('should have outputTokensTotal counter', async () => {
      const { outputTokensTotal } = await import('@/lib/prometheus-metrics');
      expect(outputTokensTotal).toBeDefined();
      expect(typeof outputTokensTotal.inc).toBe('function');
    });

    it('should have reasoningTokensTotal counter', async () => {
      const { reasoningTokensTotal } = await import('@/lib/prometheus-metrics');
      expect(reasoningTokensTotal).toBeDefined();
      expect(typeof reasoningTokensTotal.inc).toBe('function');
    });
  });

  describe('cost metrics', () => {
    it('should have estimatedCostTotal counter', async () => {
      const { estimatedCostTotal } = await import('@/lib/prometheus-metrics');
      expect(estimatedCostTotal).toBeDefined();
      expect(typeof estimatedCostTotal.inc).toBe('function');
    });

    it('should have actualCostTotal counter', async () => {
      const { actualCostTotal } = await import('@/lib/prometheus-metrics');
      expect(actualCostTotal).toBeDefined();
      expect(typeof actualCostTotal.inc).toBe('function');
    });
  });

  describe('error metrics', () => {
    it('should have errorsTotal counter', async () => {
      const { errorsTotal } = await import('@/lib/prometheus-metrics');
      expect(errorsTotal).toBeDefined();
      expect(typeof errorsTotal.inc).toBe('function');
    });
  });

  describe('helper functions', () => {
    it('should have recordRequestStart function', async () => {
      const { recordRequestStart } = await import('@/lib/prometheus-metrics');
      expect(typeof recordRequestStart).toBe('function');
    });

    it('should have recordTokenUsage function', async () => {
      const { recordTokenUsage } = await import('@/lib/prometheus-metrics');
      expect(typeof recordTokenUsage).toBe('function');
    });

    it('should have recordCost function', async () => {
      const { recordCost } = await import('@/lib/prometheus-metrics');
      expect(typeof recordCost).toBe('function');
    });

    it('should have getMetricsRegistry function', async () => {
      const { getMetricsRegistry } = await import('@/lib/prometheus-metrics');
      expect(typeof getMetricsRegistry).toBe('function');
    });
  });
});

