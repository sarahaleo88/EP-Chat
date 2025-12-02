/**
 * Optimized DeepSeek API Tests
 * Comprehensive test suite for lib/optimized-deepseek-api.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { OptimizedDeepSeekClient, ApiErrorType, createOptimizedDeepSeekClient } from '@/lib/optimized-deepseek-api';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('OptimizedDeepSeekClient', () => {
  let client: OptimizedDeepSeekClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new OptimizedDeepSeekClient('sk-test-key');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create client with API key', () => {
      const c = new OptimizedDeepSeekClient('sk-test-key');
      expect(c).toBeDefined();
    });

    it('should create client with custom config', () => {
      const c = new OptimizedDeepSeekClient('sk-test-key', {
        timeout: 60000,
        maxRetries: 5,
      });
      expect(c).toBeDefined();
    });
  });

  describe('chat', () => {
    it('should send chat request', async () => {
      const mockResponse = {
        id: 'test-id',
        object: 'chat.completion',
        created: Date.now(),
        model: 'deepseek-chat',
        choices: [{
          index: 0,
          message: { role: 'assistant', content: 'Hello!' },
          finish_reason: 'stop',
        }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.chat(
        [{ role: 'user', content: 'Hello' }],
        'deepseek-chat'
      );

      expect(result).toBeDefined();
    });
  });

  describe('getPerformanceStats', () => {
    it('should return performance statistics', () => {
      const stats = client.getPerformanceStats();
      expect(stats).toBeDefined();
    });
  });
});

describe('ApiErrorType', () => {
  it('should have NETWORK error type', () => {
    expect(ApiErrorType.NETWORK).toBe('network');
  });

  it('should have TIMEOUT error type', () => {
    expect(ApiErrorType.TIMEOUT).toBe('timeout');
  });

  it('should have RATE_LIMIT error type', () => {
    expect(ApiErrorType.RATE_LIMIT).toBe('rate_limit');
  });

  it('should have API_ERROR error type', () => {
    expect(ApiErrorType.API_ERROR).toBe('api_error');
  });

  it('should have INVALID_KEY error type', () => {
    expect(ApiErrorType.INVALID_KEY).toBe('invalid_key');
  });

  it('should have UNKNOWN error type', () => {
    expect(ApiErrorType.UNKNOWN).toBe('unknown');
  });
});

describe('createOptimizedDeepSeekClient', () => {
  it('should create client with factory function', () => {
    const client = createOptimizedDeepSeekClient('sk-test-key');
    expect(client).toBeDefined();
    expect(client).toBeInstanceOf(OptimizedDeepSeekClient);
  });

  it('should accept custom options', () => {
    const client = createOptimizedDeepSeekClient('sk-test-key', {
      timeout: 30000,
      maxRetries: 2,
    });
    expect(client).toBeDefined();
  });
});

