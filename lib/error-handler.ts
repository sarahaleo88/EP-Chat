/**
 * Enhanced Error Handling Utilities
 * Provides user-friendly error messages and recovery suggestions
 */

import { ApiErrorType, OptimizedApiError } from './optimized-deepseek-api';
import { EnhancedApiError } from './enhanced-deepseek-api';

export interface UserFriendlyError {
  title: string;
  message: string;
  suggestion: string;
  retryable: boolean;
  icon: string;
  actionLabel?: string;
}

/**
 * Convert API errors to user-friendly messages
 */
export function formatUserFriendlyError(
  error: unknown,
  model?: string
): UserFriendlyError {
  // Handle EnhancedApiError and OptimizedApiError
  if (error instanceof Error && ((error as OptimizedApiError).type || (error as EnhancedApiError).type)) {
    const apiError = error as OptimizedApiError | EnhancedApiError;

    switch (apiError.type) {
      case ApiErrorType.NETWORK:
        return {
          title: '网络连接问题',
          message: '无法连接到 DeepSeek 服务器，请检查您的网络连接。',
          suggestion:
            '请确保网络连接正常，然后重试。如果问题持续存在，可能是服务器暂时不可用。',
          retryable: true,
          icon: '🌐',
          actionLabel: '重试',
        };

      case ApiErrorType.TIMEOUT:
        // Provide model-specific timeout guidance
        if (model === 'deepseek-reasoner') {
          return {
            title: '推理超时',
            message:
              'DeepSeek Reasoner 正在进行复杂推理，但响应时间超过了预期。',
            suggestion:
              '推理模型需要更多时间来分析复杂问题。请稍等片刻后重试，或考虑简化您的问题。对于特别复杂的推理任务，可能需要分步骤进行。',
            retryable: true,
            icon: '🧠',
            actionLabel: '重新推理',
          };
        } else {
          return {
            title: '请求超时',
            message: '服务器响应时间过长，请求已超时。',
            suggestion:
              '这可能是由于网络较慢或服务器负载较高。请稍后重试，或尝试缩短您的输入内容。',
            retryable: true,
            icon: '⏱️',
            actionLabel: '重试',
          };
        }

      case ApiErrorType.RATE_LIMIT:
        return {
          title: '请求频率限制',
          message: '您的请求过于频繁，已达到速率限制。',
          suggestion:
            '请稍等片刻再发送新的请求。如果您需要更高的请求限制，请考虑升级您的 API 计划。',
          retryable: true,
          icon: '🚦',
          actionLabel: '稍后重试',
        };

      case ApiErrorType.INVALID_KEY:
        return {
          title: 'API 密钥无效',
          message: '您的 DeepSeek API 密钥无效或已过期。',
          suggestion:
            '请检查您的 API 密钥是否正确，或前往 DeepSeek 官网重新生成密钥。',
          retryable: false,
          icon: '🔑',
          actionLabel: '检查设置',
        };

      case ApiErrorType.API_ERROR:
        if (apiError.statusCode === 400) {
          return {
            title: '请求格式错误',
            message: '您的请求格式不正确或包含无效参数。',
            suggestion: '请检查您的输入内容，确保没有特殊字符或过长的文本。',
            retryable: false,
            icon: '❌',
            actionLabel: '修改输入',
          };
        }

        if (apiError.statusCode && apiError.statusCode >= 500) {
          return {
            title: '服务器错误',
            message: 'DeepSeek 服务器遇到了内部错误。',
            suggestion:
              '这是服务器端的问题，请稍后重试。如果问题持续存在，请联系技术支持。',
            retryable: true,
            icon: '🔧',
            actionLabel: '重试',
          };
        }

        return {
          title: 'API 错误',
          message: apiError.message || '调用 DeepSeek API 时发生错误。',
          suggestion: '请检查您的输入内容和网络连接，然后重试。',
          retryable: apiError.retryable,
          icon: '⚠️',
          actionLabel: apiError.retryable ? '重试' : '检查输入',
        };

      default:
        return {
          title: '未知错误',
          message: apiError.message || '发生了未知错误。',
          suggestion: '请重试，如果问题持续存在，请联系技术支持。',
          retryable: true,
          icon: '❓',
          actionLabel: '重试',
        };
    }
  }

  // Handle standard errors
  if (error instanceof Error) {
    // Network-related errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return {
        title: '网络错误',
        message: '网络连接出现问题。',
        suggestion: '请检查您的网络连接，然后重试。',
        retryable: true,
        icon: '🌐',
        actionLabel: '重试',
      };
    }

    // Timeout errors - enhanced handling for streaming timeouts
    if (error.message.includes('timeout') || error.message.includes('abort')) {
      // Special handling for long text generation timeout
      if (error.message.includes('长文本生成超时')) {
        return {
          title: '长文本生成超时',
          message: '生成长文本时服务器响应中断，这通常发生在生成特别长的内容时。',
          suggestion: '建议：1) 将问题分解为多个较短的部分；2) 使用"继续"功能分段获取内容；3) 或者稍后重试。',
          retryable: true,
          icon: '📝',
          actionLabel: '重试',
        };
      }

      // Special handling for streaming timeout messages
      if (error.message.includes('Streaming request timeout')) {
        return {
          title: '流式响应超时',
          message: '服务器在流式响应过程中超时，可能是网络不稳定或内容生成时间过长。',
          suggestion: '请尝试提出更简洁的问题，或将复杂问题分解为多个简单问题。对于长文本生成，建议使用分段方式。',
          retryable: true,
          icon: '⏱️',
          actionLabel: '重试',
        };
      }

      return {
        title: '连接超时',
        message: '请求处理时间过长，可能是网络延迟或服务器繁忙。',
        suggestion: '请稍后重试，或尝试缩短您的输入内容。如果问题持续，请检查网络连接。',
        retryable: true,
        icon: '⏱️',
        actionLabel: '重试',
      };
    }

    // JSON parsing errors
    if (error.message.includes('JSON') || error.message.includes('parse')) {
      return {
        title: '数据解析错误',
        message: '服务器返回的数据格式不正确。',
        suggestion: '这可能是服务器的临时问题，请重试。',
        retryable: true,
        icon: '📄',
        actionLabel: '重试',
      };
    }

    return {
      title: '操作失败',
      message: '系统遇到了一个问题，无法完成您的请求。',
      suggestion: '请重试，如果问题持续存在，请联系技术支持。',
      retryable: true,
      icon: '⚠️',
      actionLabel: '重试',
    };
  }

  // Fallback for unknown errors
  return {
    title: '未知错误',
    message: '发生了意外错误。',
    suggestion: '请刷新页面并重试，如果问题持续存在，请联系技术支持。',
    retryable: true,
    icon: '❓',
    actionLabel: '重试',
  };
}

/**
 * Get retry delay based on error type
 */
export function getRetryDelay(error: unknown): number {
  if (error instanceof Error && (error as OptimizedApiError).type) {
    const apiError = error as OptimizedApiError;

    switch (apiError.type) {
      case ApiErrorType.RATE_LIMIT:
        return 5000; // 5 seconds for rate limit
      case ApiErrorType.TIMEOUT:
        return 2000; // 2 seconds for timeout
      case ApiErrorType.NETWORK:
        return 3000; // 3 seconds for network issues
      case ApiErrorType.API_ERROR:
        return apiError.statusCode && apiError.statusCode >= 500 ? 5000 : 1000;
      default:
        return 1000; // 1 second default
    }
  }

  return 1000; // Default 1 second
}

/**
 * Check if error should trigger automatic retry
 */
export function shouldAutoRetry(
  error: unknown,
  attemptCount: number,
  maxAttempts: number = 3
): boolean {
  if (attemptCount >= maxAttempts) {
    return false;
  }

  if (error instanceof Error && (error as OptimizedApiError).type) {
    const apiError = error as OptimizedApiError;

    // Don't auto-retry for these error types
    if (
      apiError.type === ApiErrorType.INVALID_KEY ||
      (apiError.type === ApiErrorType.API_ERROR && apiError.statusCode === 400)
    ) {
      return false;
    }

    return apiError.retryable;
  }

  // Auto-retry for network and timeout errors
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('abort')
    );
  }

  return false;
}

/**
 * Generate helpful suggestions based on error context
 */
export function getContextualSuggestions(
  error: unknown,
  context: {
    inputLength?: number;
    modelType?: string;
    isFirstRequest?: boolean;
  }
): string[] {
  const suggestions: string[] = [];

  if (error instanceof Error && (error as OptimizedApiError).type) {
    const apiError = error as OptimizedApiError;

    if (
      apiError.type === ApiErrorType.TIMEOUT &&
      context.inputLength &&
      context.inputLength > 1000
    ) {
      suggestions.push('尝试缩短您的输入内容');
    }

    if (apiError.type === ApiErrorType.RATE_LIMIT) {
      suggestions.push('等待几分钟后再试');
      suggestions.push('考虑升级您的 API 计划');
    }

    if (apiError.type === ApiErrorType.INVALID_KEY && context.isFirstRequest) {
      suggestions.push('检查 API 密钥是否正确复制');
      suggestions.push('确认 API 密钥没有过期');
      suggestions.push('访问 DeepSeek 官网重新生成密钥');
    }

    if (apiError.type === ApiErrorType.NETWORK) {
      suggestions.push('检查网络连接');
      suggestions.push('尝试刷新页面');
      suggestions.push('如果使用 VPN，尝试切换节点');
    }
  }

  return suggestions;
}
