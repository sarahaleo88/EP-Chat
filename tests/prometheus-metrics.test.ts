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
      expect(requestsTotal.name).toBe('ep_chat_requests_total');
    });

    it('should have correct label names', async () => {
      const { requestsTotal } = await import('@/lib/prometheus-metrics');
      expect(requestsTotal.labelNames).toContain('model');
      expect(requestsTotal.labelNames).toContain('status');
    });
  });

  describe('requestDuration histogram', () => {
    it('should be defined with correct configuration', async () => {
      const { requestDuration } = await import('@/lib/prometheus-metrics');
      expect(requestDuration).toBeDefined();
      expect(requestDuration.name).toBe('ep_chat_request_duration_seconds');
    });

    it('should have buckets defined', async () => {
      const { requestDuration } = await import('@/lib/prometheus-metrics');
      expect(requestDuration.buckets).toBeDefined();
      expect(Array.isArray(requestDuration.buckets)).toBe(true);
    });
  });

  describe('activeStreams gauge', () => {
    it('should be defined with correct configuration', async () => {
      const { activeStreams } = await import('@/lib/prometheus-metrics');
      expect(activeStreams).toBeDefined();
      expect(activeStreams.name).toBe('ep_chat_active_streams');
    });
  });

  describe('token counters', () => {
    it('should have inputTokensTotal counter', async () => {
      const { inputTokensTotal } = await import('@/lib/prometheus-metrics');
      expect(inputTokensTotal).toBeDefined();
      expect(inputTokensTotal.name).toBe('ep_chat_input_tokens_total');
    });

    it('should have outputTokensTotal counter', async () => {
      const { outputTokensTotal } = await import('@/lib/prometheus-metrics');
      expect(outputTokensTotal).toBeDefined();
      expect(outputTokensTotal.name).toBe('ep_chat_output_tokens_total');
    });

    it('should have reasoningTokensTotal counter', async () => {
      const { reasoningTokensTotal } = await import('@/lib/prometheus-metrics');
      expect(reasoningTokensTotal).toBeDefined();
      expect(reasoningTokensTotal.name).toBe('ep_chat_reasoning_tokens_total');
    });
  });

  describe('cost metrics', () => {
    it('should have estimatedCostTotal counter', async () => {
      const { estimatedCostTotal } = await import('@/lib/prometheus-metrics');
      expect(estimatedCostTotal).toBeDefined();
      expect(estimatedCostTotal.name).toBe('ep_chat_estimated_cost_usd_total');
    });

    it('should have actualCostTotal counter', async () => {
      const { actualCostTotal } = await import('@/lib/prometheus-metrics');
      expect(actualCostTotal).toBeDefined();
      expect(actualCostTotal.name).toBe('ep_chat_actual_cost_usd_total');
    });
  });

  describe('error metrics', () => {
    it('should have errorsTotal counter', async () => {
      const { errorsTotal } = await import('@/lib/prometheus-metrics');
      expect(errorsTotal).toBeDefined();
      expect(errorsTotal.name).toBe('ep_chat_errors_total');
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

