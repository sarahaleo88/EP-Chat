/**
 * Enhanced DeepSeek API Tests
 * Comprehensive test suite for lib/enhanced-deepseek-api.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EnhancedDeepSeekClient, EnhancedApiError } from '@/lib/enhanced-deepseek-api';
import { ApiErrorType } from '@/lib/optimized-deepseek-api';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('EnhancedDeepSeekClient', () => {
  let client: EnhancedDeepSeekClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new EnhancedDeepSeekClient('sk-test-key');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create client with API key', () => {
      const c = new EnhancedDeepSeekClient('sk-test-key');
      expect(c).toBeDefined();
    });

    it('should create client with custom model', () => {
      const c = new EnhancedDeepSeekClient('sk-test-key', 'deepseek-coder');
      expect(c).toBeDefined();
    });

    it('should create client with deepseek-reasoner model', () => {
      const c = new EnhancedDeepSeekClient('sk-test-key', 'deepseek-reasoner');
      expect(c).toBeDefined();
    });
  });

  describe('chatStreamEnhanced', () => {
    it('should be a function', () => {
      expect(typeof client.chatStreamEnhanced).toBe('function');
    });
  });
});

describe('EnhancedApiError', () => {
  it('should create error with message and type', () => {
    const error = new EnhancedApiError('Test error', ApiErrorType.NETWORK, true);
    expect(error.message).toBe('Test error');
    expect(error.type).toBe(ApiErrorType.NETWORK);
    expect(error.retryable).toBe(true);
  });

  it('should create error with status code', () => {
    const error = new EnhancedApiError('API error', ApiErrorType.API_ERROR, false, 500);
    expect(error.statusCode).toBe(500);
    expect(error.retryable).toBe(false);
  });

  it('should have correct name', () => {
    const error = new EnhancedApiError('Test', ApiErrorType.UNKNOWN, false);
    expect(error.name).toBe('EnhancedApiError');
  });

  it('should be instance of Error', () => {
    const error = new EnhancedApiError('Test', ApiErrorType.TIMEOUT, true);
    expect(error).toBeInstanceOf(Error);
  });
});

