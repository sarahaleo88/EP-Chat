/**
 * Error Handler Tests
 * Comprehensive test suite for error handling utilities
 */

import { describe, it, expect } from 'vitest';
import {
  formatUserFriendlyError,
  getContextualSuggestions,
} from '@/lib/error-handler';
import { ApiErrorType } from '@/lib/optimized-deepseek-api';

// Mock API error classes for testing
class MockOptimizedApiError extends Error {
  public type: ApiErrorType;
  public statusCode?: number;
  public retryable: boolean;

  constructor(type: ApiErrorType, message: string, statusCode?: number, retryable = true) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.name = 'OptimizedApiError';
  }
}

describe('Error Handler', () => {
  describe('formatUserFriendlyError', () => {
    describe('API Error handling', () => {
      it('should format network errors', () => {
        const error = new MockOptimizedApiError(ApiErrorType.NETWORK, 'Network failed');
        const result = formatUserFriendlyError(error);

        expect(result.title).toBe('网络连接问题');
        expect(result.message).toBe('无法连接到 DeepSeek 服务器，请检查您的网络连接。');
        expect(result.retryable).toBe(true);
        expect(result.icon).toBe('🌐');
        expect(result.actionLabel).toBe('重试');
      });

      it('should format timeout errors for regular models', () => {
        const error = new MockOptimizedApiError(ApiErrorType.TIMEOUT, 'Request timeout');
        const result = formatUserFriendlyError(error);

        expect(result.title).toBe('请求超时');
        expect(result.message).toBe('服务器响应时间过长，请求已超时。');
        expect(result.retryable).toBe(true);
        expect(result.icon).toBe('⏱️');
        expect(result.actionLabel).toBe('重试');
      });

      it('should format timeout errors for reasoner model', () => {
        const error = new MockOptimizedApiError(ApiErrorType.TIMEOUT, 'Request timeout');
        const result = formatUserFriendlyError(error, 'deepseek-reasoner');

        expect(result.title).toBe('推理超时');
        expect(result.message).toBe('DeepSeek Reasoner 正在进行复杂推理，但响应时间超过了预期。');
        expect(result.retryable).toBe(true);
        expect(result.icon).toBe('🧠');
        expect(result.actionLabel).toBe('重新推理');
      });

      it('should format rate limit errors', () => {
        const error = new MockOptimizedApiError(ApiErrorType.RATE_LIMIT, 'Rate limit exceeded');
        const result = formatUserFriendlyError(error);

        expect(result.title).toBe('请求频率限制');
        expect(result.message).toBe('您的请求过于频繁，已达到速率限制。');
        expect(result.retryable).toBe(true);
        expect(result.icon).toBe('🚦');
        expect(result.actionLabel).toBe('稍后重试');
      });

      it('should format invalid API key errors', () => {
        const error = new MockOptimizedApiError(ApiErrorType.INVALID_KEY, 'Invalid API key');
        const result = formatUserFriendlyError(error);

        expect(result.title).toBe('API 密钥无效');
        expect(result.message).toBe('您的 DeepSeek API 密钥无效或已过期。');
        expect(result.retryable).toBe(false);
        expect(result.icon).toBe('🔑');
        expect(result.actionLabel).toBe('检查设置');
      });

      it('should format quota exceeded errors', () => {
        const error = new MockOptimizedApiError(ApiErrorType.QUOTA_EXCEEDED, 'Quota exceeded');
        const result = formatUserFriendlyError(error);

        // This error type might not be specifically handled, so it falls back to generic error
        expect(result.title).toBe('操作失败');
        expect(result.retryable).toBe(true);
        expect(result.icon).toBe('⚠️');
        expect(result.actionLabel).toBe('重试');
      });

      it('should format 400 API errors', () => {
        const error = new MockOptimizedApiError(ApiErrorType.API_ERROR, 'Bad request', 400);
        const result = formatUserFriendlyError(error);

        expect(result.title).toBe('请求格式错误');
        expect(result.message).toBe('您的请求格式不正确或包含无效参数。');
        expect(result.retryable).toBe(false);
        expect(result.icon).toBe('❌');
        expect(result.actionLabel).toBe('修改输入');
      });

      it('should format 500+ API errors', () => {
        const error = new MockOptimizedApiError(ApiErrorType.API_ERROR, 'Server error', 500);
        const result = formatUserFriendlyError(error);

        expect(result.title).toBe('服务器错误');
        expect(result.message).toBe('DeepSeek 服务器遇到了内部错误。');
        expect(result.retryable).toBe(true);
        expect(result.icon).toBe('🔧');
        expect(result.actionLabel).toBe('重试');
      });

      it('should format generic API errors', () => {
        const error = new MockOptimizedApiError(ApiErrorType.API_ERROR, 'Generic error', 422, false);
        const result = formatUserFriendlyError(error);

        expect(result.title).toBe('API 错误');
        expect(result.message).toBe('Generic error');
        expect(result.retryable).toBe(false);
        expect(result.icon).toBe('⚠️');
        expect(result.actionLabel).toBe('检查输入');
      });

      it('should format unknown API error types', () => {
        const error = new MockOptimizedApiError('UNKNOWN_TYPE' as ApiErrorType, 'Unknown error');
        const result = formatUserFriendlyError(error);

        expect(result.title).toBe('未知错误');
        expect(result.message).toBe('Unknown error');
        expect(result.retryable).toBe(true);
        expect(result.icon).toBe('❓');
        expect(result.actionLabel).toBe('重试');
      });
    });

    describe('Standard Error handling', () => {
      it('should format network-related errors', () => {
        const error = new Error('fetch failed due to network issue');
        const result = formatUserFriendlyError(error);

        expect(result.title).toBe('网络错误');
        expect(result.message).toBe('网络连接出现问题。');
        expect(result.retryable).toBe(true);
        expect(result.icon).toBe('🌐');
        expect(result.actionLabel).toBe('重试');
      });

      it('should format timeout-related errors', () => {
        const error = new Error('Request timeout occurred');
        const result = formatUserFriendlyError(error);

        expect(result.title).toBe('连接超时');
        expect(result.message).toBe('请求处理时间过长，可能是网络延迟或服务器繁忙。');
        expect(result.retryable).toBe(true);
        expect(result.icon).toBe('⏱️');
        expect(result.actionLabel).toBe('重试');
      });

      it('should format JSON parsing errors', () => {
        const error = new Error('Unexpected token in JSON at position 0');
        const result = formatUserFriendlyError(error);

        expect(result.title).toBe('数据解析错误');
        expect(result.message).toBe('服务器返回的数据格式不正确。');
        expect(result.retryable).toBe(true);
        expect(result.icon).toBe('📄');
        expect(result.actionLabel).toBe('重试');
      });

      it('should format generic errors', () => {
        const error = new Error('Something went wrong');
        const result = formatUserFriendlyError(error);

        expect(result.title).toBe('操作失败');
        expect(result.message).toBe('系统遇到了一个问题，无法完成您的请求。');
        expect(result.retryable).toBe(true);
        expect(result.icon).toBe('⚠️');
        expect(result.actionLabel).toBe('重试');
      });
    });

    describe('Unknown error handling', () => {
      it('should format unknown error types', () => {
        const result = formatUserFriendlyError('string error');

        expect(result.title).toBe('未知错误');
        expect(result.message).toBe('发生了意外错误。');
        expect(result.retryable).toBe(true);
        expect(result.icon).toBe('❓');
        expect(result.actionLabel).toBe('重试');
      });

      it('should format null/undefined errors', () => {
        const result = formatUserFriendlyError(null);

        expect(result.title).toBe('未知错误');
        expect(result.message).toBe('发生了意外错误。');
        expect(result.retryable).toBe(true);
        expect(result.icon).toBe('❓');
        expect(result.actionLabel).toBe('重试');
      });
    });
  });

  describe('getContextualSuggestions', () => {
    it('should suggest shortening input for timeout with long input', () => {
      const error = new MockOptimizedApiError(ApiErrorType.TIMEOUT, 'Timeout');
      const context = { inputLength: 2000 };

      const actions = getContextualSuggestions(error, context);
      expect(actions).toContain('尝试缩短您的输入内容');
    });

    it('should suggest rate limit recovery actions', () => {
      const error = new MockOptimizedApiError(ApiErrorType.RATE_LIMIT, 'Rate limit');
      const context = {};

      const actions = getContextualSuggestions(error, context);
      expect(actions).toContain('等待几分钟后再试');
      expect(actions).toContain('考虑升级您的 API 计划');
    });

    it('should suggest API key recovery actions for first request', () => {
      const error = new MockOptimizedApiError(ApiErrorType.INVALID_KEY, 'Invalid key');
      const context = { isFirstRequest: true };

      const actions = getContextualSuggestions(error, context);
      expect(actions).toContain('检查 API 密钥是否正确复制');
      expect(actions).toContain('确认 API 密钥没有过期');
      expect(actions).toContain('访问 DeepSeek 官网重新生成密钥');
    });

    it('should suggest network recovery actions', () => {
      const error = new MockOptimizedApiError(ApiErrorType.NETWORK, 'Network error');
      const context = {};

      const actions = getContextualSuggestions(error, context);
      expect(actions).toContain('检查网络连接');
      expect(actions).toContain('尝试刷新页面');
      expect(actions).toContain('如果使用 VPN，尝试切换节点');
    });

    it('should return empty array for non-API errors', () => {
      const error = new Error('Generic error');
      const context = {};

      const actions = getContextualSuggestions(error, context);
      expect(actions).toEqual([]);
    });
  });


});
