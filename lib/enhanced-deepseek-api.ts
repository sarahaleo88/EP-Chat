/**
 * 增强版DeepSeek API客户端
 * 集成自适应token预算管理和自动续写功能
 */

import {
  TokenBudgetManager,
  createTokenBudgetManager,
  ContinuationContext
} from './token-budget-manager';
import {
  OptimizedDeepSeekClient,
  ApiErrorType,
  createOptimizedDeepSeekClient
} from './optimized-deepseek-api';
import { performanceLogger } from './performance-logger';
import { formatUserFriendlyError } from './error-handler';

export interface EnhancedStreamOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  onChunk?: (content: string, metadata?: ChunkMetadata) => void;
  onComplete?: (metadata?: CompletionMetadata) => void;
  onError?: (error: EnhancedApiError) => void;
  onContinuation?: (context: ContinuationContext) => void;
  enableAutoRetry?: boolean;
  maxContinuations?: number;
}

export interface ChunkMetadata {
  segmentIndex: number;
  totalSegments: number;
  tokenCount: number;
  isLastSegment: boolean;
}

export interface CompletionMetadata {
  totalTokens: number;
  totalSegments: number;
  finishReason: string;
  continuationUsed: boolean;
  duration: number;
}

/**
 * 增强版API错误类
 */
export class EnhancedApiError extends Error {
  public type: ApiErrorType;
  public retryable: boolean;
  public statusCode?: number;

  constructor(message: string, type: ApiErrorType, retryable: boolean, statusCode?: number) {
    super(message);
    this.name = 'EnhancedApiError';
    this.type = type;
    this.retryable = retryable;
    if (statusCode !== undefined) {
      this.statusCode = statusCode;
    }
  }
}

/**
 * 增强版DeepSeek API客户端类
 */
export class EnhancedDeepSeekClient {
  private baseClient: OptimizedDeepSeekClient;
  private tokenManager: TokenBudgetManager;
  private model: string;
  private abortController?: AbortController;
  private continuationState: Map<string, ContinuationContext> = new Map();

  constructor(apiKey: string, model: string = 'deepseek-chat') {
    this.baseClient = createOptimizedDeepSeekClient(apiKey, {
      timeout: this.getEnhancedTimeout(model, 'initial'),
      maxRetries: 3,
      retryDelay: 1000,
    });
    this.tokenManager = createTokenBudgetManager(model);
    this.model = model;
  }

  /**
   * 获取增强的超时配置 - 使用渐进式超时策略
   */
  private getEnhancedTimeout(model: string, phase: 'initial' | 'streaming' | 'continuation' = 'initial'): number {
    const baseTimeouts = {
      'deepseek-chat': {
        initial: 60000,      // 1分钟初始连接
        streaming: 300000,   // 5分钟流式响应
        continuation: 180000 // 3分钟续写段
      },
      'deepseek-coder': {
        initial: 90000,      // 1.5分钟初始连接
        streaming: 480000,   // 8分钟流式响应
        continuation: 240000 // 4分钟续写段
      },
      'deepseek-reasoner': {
        initial: 120000,     // 2分钟初始连接
        streaming: 900000,   // 15分钟流式响应
        continuation: 420000 // 7分钟续写段
      }
    };

    const modelConfig = baseTimeouts[model as keyof typeof baseTimeouts] || baseTimeouts['deepseek-chat'];
    const timeout = modelConfig[phase];

    // 应用长文本守护倍数
    const longOutputMultiplier = process.env.EP_LONG_OUTPUT_GUARD === 'off' ? 1 : 1.5;
    return Math.floor(timeout * longOutputMultiplier);
  }

  /**
   * 智能流式聊天 - 支持自动续写
   */
  async chatStreamEnhanced(
    messages: Array<{ role: string; content: string }>,
    options: EnhancedStreamOptions = {}
  ): Promise<void> {
    const {
      temperature = 0.7,
      maxTokens,
      topP = 0.95,
      onChunk,
      onComplete,
      onError,
      onContinuation,
      // enableAutoRetry reserved for future retry logic
      enableAutoRetry: _enableAutoRetry = true,
      maxContinuations = 5,
    } = options;
    void _enableAutoRetry; // Mark as intentionally unused for now

    const requestId = performanceLogger.startRequest('enhanced-deepseek-stream', this.model);
    const startTime = Date.now();

    let totalContent = '';
    let totalTokens = 0;
    const segmentIndex = 0;
    let continuationUsed = false;
    let lastFinishReason = '';

    try {
      // 计算token预算
      const budget = this.tokenManager.calculateBudget(messages, maxTokens);

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[Enhanced API] Token budget:', budget);
      }

      // 如果需要截断，先处理消息历史
      let processedMessages = messages;
      if (budget.needsTruncation) {
        const targetTokens = this.tokenManager.getModelConfig().contextWindow - budget.maxTokens - this.tokenManager.getModelConfig().safetyMargin;
        processedMessages = this.tokenManager.truncateMessages(messages, targetTokens);

        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log(`[Enhanced API] Truncated messages: ${messages.length} -> ${processedMessages.length}`);
        }
      }

      // 执行主要的流式请求
      await new Promise<void>((resolve, reject) => {
        this.baseClient.chatStream(
          processedMessages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
          this.model,
          {
            temperature,
            max_tokens: budget.maxTokens,
            top_p: topP,
            onChunk: (content: string) => {
              totalContent += content;
              totalTokens++;
              onChunk?.(content, {
                segmentIndex,
                totalSegments: 1, // 初始值，可能会更新
                tokenCount: totalTokens,
                isLastSegment: true, // 初始假设
              });
            },
            onComplete: () => {
              resolve();
            },
            onError: (error) => {
              lastFinishReason = 'error';
              performanceLogger.endRequest(requestId, false, {
                errorType: error.type,
                model: this.model,
              });
              reject(error);
            },
          }
        );
      });

      // 模拟finish_reason检查（实际应从API响应获取）
      if (totalContent.length >= budget.maxTokens * 3) { // 简化的length检查
        lastFinishReason = 'length';
      } else {
        lastFinishReason = 'stop';
      }

      // 检查是否需要自动续写
      if (this.tokenManager.shouldContinue(lastFinishReason, totalContent.length) &&
          segmentIndex < maxContinuations) {

        continuationUsed = true;
        const continuationOptions: {
          temperature: number;
          topP: number;
          onChunk: (content: string, metadata?: ChunkMetadata) => void;
          onContinuation?: (context: ContinuationContext) => void;
          onError?: (error: EnhancedApiError) => void;
        } = {
          temperature,
          topP,
          onChunk: (content: string, metadata?: ChunkMetadata) => {
            totalContent += content;
            totalTokens++;
            onChunk?.(content, metadata);
          },
        };

        if (onContinuation) {
          continuationOptions.onContinuation = onContinuation;
        }

        if (onError) {
          continuationOptions.onError = onError;
        }

        await this.handleContinuation(
          processedMessages,
          totalContent,
          segmentIndex,
          maxContinuations,
          continuationOptions
        );
      }

      // 完成回调
      const duration = Date.now() - startTime;
      performanceLogger.endRequest(requestId, true, {
        model: this.model,
        tokenCount: totalTokens,
      });

      onComplete?.({
        totalTokens,
        totalSegments: segmentIndex + 1,
        finishReason: lastFinishReason,
        continuationUsed,
        duration,
      });

    } catch (error) {
      const errorDuration = Date.now() - startTime;
      void errorDuration; // Duration tracked via performanceLogger
      performanceLogger.endRequest(requestId, false, {
        errorType: error instanceof EnhancedApiError ? error.type : 'unknown',
        model: this.model,
      });

      if (error instanceof EnhancedApiError) {
        onError?.(error);
      } else {
        // 使用用户友好的错误格式化
        const friendlyError = formatUserFriendlyError(error, this.model);
        onError?.(new EnhancedApiError(
          friendlyError.message, // 只使用友好的消息，不包含标题
          ApiErrorType.UNKNOWN,
          friendlyError.retryable
        ));
      }
    }
  }

  /**
   * 执行单个流式段落
   */
  private async executeStreamingSegment(
    messages: Array<{ role: string; content: string }>,
    options: {
      temperature: number;
      max_tokens: number;
      top_p: number;
      onChunk: (content: string) => void;
      onComplete: () => void;
      onError: (error: EnhancedApiError) => void;
    }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.baseClient.chatStream(
        messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
        this.model,
        {
          ...options,
          onComplete: () => {
            options.onComplete();
            resolve();
          },
          onError: (error) => {
            options.onError(error);
            reject(error);
          },
        }
      );
    });
  }

  /**
   * 处理自动续写
   */
  private async handleContinuation(
    originalMessages: Array<{ role: string; content: string }>,
    previousContent: string,
    currentSegment: number,
    maxContinuations: number,
    options: {
      temperature: number;
      topP: number;
      onChunk: (content: string, metadata?: ChunkMetadata) => void;
      onContinuation?: (context: ContinuationContext) => void;
      onError?: (error: EnhancedApiError) => void;
    }
  ): Promise<void> {
    const continuationContext: ContinuationContext = {
      conversationId: Date.now().toString(),
      segmentIndex: currentSegment + 1,
      totalSegments: maxContinuations + 1,
      previousContent,
    };

    // 通知开始续写
    options.onContinuation?.(continuationContext);

    // 构建续写消息
    const continuationPrompt = this.tokenManager.generateContinuationPrompt(
      previousContent,
      continuationContext
    );

    const continuationMessages = [
      ...originalMessages,
      { role: 'assistant', content: previousContent },
      { role: 'user', content: continuationPrompt },
    ];

    // 重新计算token预算
    const budget = this.tokenManager.calculateBudget(continuationMessages);

    try {
      await this.executeStreamingSegment(
        continuationMessages,
        {
          temperature: options.temperature,
          max_tokens: budget.maxTokens,
          top_p: options.topP,
          onChunk: (content: string) => {
            options.onChunk?.(content, {
              segmentIndex: continuationContext.segmentIndex,
              totalSegments: continuationContext.totalSegments,
              tokenCount: 0, // 在上层累计
              isLastSegment: continuationContext.segmentIndex >= maxContinuations,
            });
          },
          onComplete: () => {
            // 续写段完成
          },
          onError: (error) => {
            options.onError?.(error);
          },
        }
      );
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Enhanced API] Continuation failed:', error);
      }
      // 续写失败不应该中断整个流程
    }
  }

  /**
   * 取消当前请求
   */
  cancel(): void {
    this.abortController?.abort();
    this.baseClient.cancel();
  }

  /**
   * 获取token预算信息
   */
  getTokenBudget(messages: Array<{ role: string; content: string }>): any {
    return this.tokenManager.calculateBudget(messages);
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.cancel();
    this.continuationState.clear();
  }
}

/**
 * 创建增强版DeepSeek客户端
 */
export function createEnhancedDeepSeekClient(
  apiKey: string, 
  model: string = 'deepseek-chat'
): EnhancedDeepSeekClient {
  return new EnhancedDeepSeekClient(apiKey, model);
}
