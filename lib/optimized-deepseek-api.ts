/**
 * Optimized DeepSeek API Client
 *
 * 高性能 DeepSeek API 客户端，提供企业级功能：
 *
 * 🚀 **性能优化**
 * - 智能缓存系统 (LRU + TTL)
 * - 请求去重和合并
 * - 并发请求限制
 * - 渐进式超时策略
 *
 * 🛡️ **可靠性保障**
 * - 指数退避重试机制
 * - 网络错误自动恢复
 * - 速率限制处理
 * - 详细错误分类
 *
 * 📊 **监控和分析**
 * - 性能指标收集
 * - 请求链路追踪
 * - 错误统计分析
 * - 缓存命中率监控
 *
 * 🔧 **配置灵活性**
 * - 模型特定超时配置
 * - 动态重试策略
 * - 缓存策略自定义
 * - 并发控制调优
 *
 * @example
 * ```typescript
 * const client = new OptimizedDeepSeekClient({
 *   timeout: 30000,
 *   maxRetries: 3,
 *   cacheSize: 100
 * });
 *
 * const response = await client.createChatCompletion({
 *   model: 'deepseek-chat',
 *   messages: [{ role: 'user', content: 'Hello!' }]
 * });
 * ```
 */

import {
  DeepSeekMessage,
  DeepSeekApiResponse,
  DeepSeekApiError,
} from './deepseek-api';
import { performanceLogger } from './performance-logger';
import { longTextTimeoutManager, TimeoutContext } from './long-text-timeout-manager';

/**
 * 缓存条目接口
 *
 * 定义 API 响应缓存的数据结构：
 * - response: 缓存的 API 响应数据
 * - timestamp: 缓存创建时间戳
 * - ttl: 缓存生存时间（毫秒）
 */
interface CacheEntry {
  /** 缓存的 API 响应数据 */
  response: DeepSeekApiResponse;
  /** 缓存创建时间戳 */
  timestamp: number;
  /** 缓存生存时间（毫秒） */
  ttl: number;
}

/**
 * API 错误类型枚举
 *
 * 对不同类型的 API 错误进行分类，便于：
 * - 错误处理策略选择
 * - 重试逻辑判断
 * - 用户友好错误消息
 * - 监控和统计分析
 */
export enum ApiErrorType {
  /** 网络连接错误 */
  NETWORK = 'network',
  /** 请求超时错误 */
  TIMEOUT = 'timeout',
  /** 速率限制错误 */
  RATE_LIMIT = 'rate_limit',
  /** API 服务错误 */
  API_ERROR = 'api_error',
  /** API 密钥无效 */
  INVALID_KEY = 'invalid_key',
  /** 未知错误类型 */
  UNKNOWN = 'unknown',
}

/**
 * 优化 API 错误接口
 *
 * 扩展标准 Error 接口，添加：
 * - type: 错误类型分类
 * - retryable: 是否可重试标志
 * - statusCode: HTTP 状态码（如果适用）
 */
export interface OptimizedApiError extends Error {
  /** 错误类型分类 */
  type: ApiErrorType;
  /** 是否可以重试此错误 */
  retryable: boolean;
  /** HTTP 状态码（如果适用） */
  statusCode?: number;
}

/**
 * API 客户端配置接口
 *
 * 定义客户端的所有可配置参数：
 * - 超时和重试设置
 * - 缓存配置参数
 * - 并发控制选项
 * - 性能优化开关
 */
interface ApiConfig {
  /** 请求超时时间（毫秒） */
  timeout: number;
  /** 最大重试次数 */
  maxRetries: number;
  /** 重试延迟时间（毫秒） */
  retryDelay: number;
  /** 缓存最大条目数 */
  cacheSize: number;
  /** 缓存生存时间（毫秒） */
  cacheTtl: number;
  /** 最大并发请求数 */
  maxConcurrentRequests: number;
  /** 是否启用请求优先级 */
  requestPriority: boolean;
}

/**
 * Get model-specific timeout configuration with progressive timeout strategy
 * Supports different timeout phases for long text generation
 */
function getModelTimeout(model: string, phase: 'initial' | 'streaming' | 'continuation' = 'initial'): number {
  const baseTimeouts = {
    'deepseek-chat': {
      initial: 45000,      // 45s for initial connection
      streaming: 180000,   // 3min for streaming response
      continuation: 120000 // 2min for continuation segments
    },
    'deepseek-coder': {
      initial: 60000,      // 1min for initial connection
      streaming: 300000,   // 5min for code generation
      continuation: 180000 // 3min for continuation segments
    },
    'deepseek-reasoner': {
      initial: 90000,      // 1.5min for initial connection
      streaming: 600000,   // 10min for complex reasoning
      continuation: 300000 // 5min for continuation segments
    }
  };

  const modelConfig = baseTimeouts[model as keyof typeof baseTimeouts] || baseTimeouts['deepseek-chat'];
  let timeout = modelConfig[phase];

  // Apply long output guard multiplier if enabled
  const longOutputMultiplier = process.env.EP_LONG_OUTPUT_GUARD === 'off' ? 1 : 2;
  timeout *= longOutputMultiplier;

  // Apply environment override if specified
  const envTimeout = parseInt(process.env.API_TIMEOUT || '0');
  if (envTimeout > 0 && phase === 'initial') {
    timeout = Math.max(timeout, envTimeout);
  }

  return timeout;
}

// Default configuration
const DEFAULT_CONFIG: ApiConfig = {
  timeout: 30000, // Default 30 seconds - will be overridden by model-specific timeout
  maxRetries: 3,
  retryDelay: 800, // Reduced from 1000ms to 800ms for faster retry
  cacheSize: 75, // Increased from 50 to 75 for better cache hit rate
  cacheTtl: 1800000, // 30 minutes - optimized for better cache hit rate
  maxConcurrentRequests: 4, // Increased from 3 to 4 for better throughput
  requestPriority: true, // Enable request prioritization
};

/**
 * LRU Cache implementation
 */
class LRUCache<T> {
  private cache = new Map<string, T>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (item) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Request queue item
 */
interface QueuedRequest {
  id: string;
  priority: number;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

/**
 * Optimized DeepSeek API Client
 */
export class OptimizedDeepSeekClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.deepseek.com/v1';
  private config: ApiConfig;
  private cache: LRUCache<CacheEntry>;
  private abortController?: AbortController;
  private requestQueue: QueuedRequest[] = [];
  private activeRequests: number = 0;
  private lastCleanupTime: number = 0;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(apiKey: string, config: Partial<ApiConfig> = {}) {
    this.apiKey = apiKey;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new LRUCache(this.config.cacheSize);
    this.lastCleanupTime = Date.now();

    // Start periodic cleanup (every 10 minutes)
    this.startPeriodicCleanup();
  }

  /**
   * Generate cache key for request with semantic considerations
   */
  private generateCacheKey(
    messages: DeepSeekMessage[],
    model: string,
    temperature: number
  ): string {
    // Normalize messages for semantic caching
    const normalizedMessages = messages.map(msg => ({
      role: msg.role,
      content: this.normalizeContent(msg.content),
    }));

    const content = JSON.stringify({
      messages: normalizedMessages,
      model,
      temperature: Math.round(temperature * 10) / 10, // Round temperature to 1 decimal
    });

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Normalize content for semantic caching
   */
  private normalizeContent(content: string): string {
    return content
      .toLowerCase()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s\u4e00-\u9fff]/g, '') // Remove punctuation except Chinese characters
      .trim();
  }

  /**
   * Add request to queue with priority
   */
  private async queueRequest<T>(
    execute: () => Promise<T>,
    priority: number = 1
  ): Promise<T> {
    if (
      !this.config.requestPriority ||
      this.activeRequests < this.config.maxConcurrentRequests
    ) {
      this.activeRequests++;
      try {
        return await execute();
      } finally {
        this.activeRequests--;
        this.processQueue();
      }
    }

    return new Promise<T>((resolve, reject) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const queuedRequest: QueuedRequest = {
        id: requestId,
        priority,
        execute,
        resolve,
        reject,
      };

      // Insert request in priority order (higher priority first)
      const insertIndex = this.requestQueue.findIndex(
        req => req.priority < priority
      );
      if (insertIndex === -1) {
        this.requestQueue.push(queuedRequest);
      } else {
        this.requestQueue.splice(insertIndex, 0, queuedRequest);
      }
    });
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    while (
      this.requestQueue.length > 0 &&
      this.activeRequests < this.config.maxConcurrentRequests
    ) {
      const request = this.requestQueue.shift();
      if (!request) {break;}

      this.activeRequests++;

      try {
        const result = await request.execute();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      } finally {
        this.activeRequests--;
      }
    }
  }

  /**
   * Check if cache entry is valid
   */
  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Clean expired entries from cache
   */
  private cleanExpiredEntries(): { cleaned: number; remaining: number } {
    const startTime = Date.now();
    let cleanedCount = 0;
    const cacheMap = this.cache['cache'] as Map<string, CacheEntry>;

    // Collect expired keys
    const expiredKeys: string[] = [];
    for (const [key, entry] of cacheMap) {
      if (!this.isCacheValid(entry)) {
        expiredKeys.push(key);
      }
    }

    // Remove expired entries
    for (const key of expiredKeys) {
      cacheMap.delete(key);
      cleanedCount++;
    }

    const cleanupDuration = Date.now() - startTime;
    const remainingCount = cacheMap.size;

    // Log cleanup performance
    if (process.env.NODE_ENV === 'development') {
      performanceLogger.logCustomMetric('cache-cleanup', {
        cleanedEntries: cleanedCount,
        remainingEntries: remainingCount,
        cleanupDuration,
        cacheUtilization: (remainingCount / this.config.cacheSize) * 100,
      });
    }

    this.lastCleanupTime = Date.now();

    return { cleaned: cleanedCount, remaining: remainingCount };
  }

  /**
   * Start periodic cleanup timer
   */
  private startPeriodicCleanup(): void {
    // Clean up every 10 minutes (600,000ms)
    this.cleanupInterval = setInterval(() => {
      this.cleanExpiredEntries();
    }, 600000);
  }

  /**
   * Stop periodic cleanup timer
   */
  private stopPeriodicCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      delete this.cleanupInterval;
    }
  }

  /**
   * Check if cleanup should be triggered based on cache capacity
   */
  private shouldTriggerCleanup(): boolean {
    const cacheMap = this.cache['cache'] as Map<string, CacheEntry>;
    const currentSize = cacheMap.size;
    const capacityThreshold = Math.floor(this.config.cacheSize * 0.8); // 80% capacity
    const timeSinceLastCleanup = Date.now() - this.lastCleanupTime;
    const minCleanupInterval = 60000; // Minimum 1 minute between cleanups

    return (
      currentSize >= capacityThreshold &&
      timeSinceLastCleanup >= minCleanupInterval
    );
  }

  /**
   * Create optimized error with model-specific context
   */
  private createError(
    message: string,
    type: ApiErrorType,
    retryable: boolean,
    statusCode?: number,
    model?: string
  ): OptimizedApiError {
    let enhancedMessage = message;

    // Add model-specific context for timeout errors
    if (type === ApiErrorType.TIMEOUT && model) {
      const timeout = getModelTimeout(model);
      const timeoutSeconds = timeout / 1000;

      switch (model) {
        case 'deepseek-reasoner':
          enhancedMessage = `${message} (${timeoutSeconds}s limit for complex reasoning tasks). Try breaking down your question into smaller parts or simplifying the request.`;
          break;
        case 'deepseek-coder':
          enhancedMessage = `${message} (${timeoutSeconds}s limit for code generation). Try requesting smaller code snippets or simpler functions.`;
          break;
        case 'deepseek-chat':
          enhancedMessage = `${message} (${timeoutSeconds}s limit for general chat). Try asking a more concise question.`;
          break;
        default:
          enhancedMessage = `${message} (${timeoutSeconds}s timeout)`;
      }
    }

    const error = new Error(enhancedMessage) as OptimizedApiError;
    error.type = type;
    error.retryable = retryable;
    if (statusCode !== undefined) {
      error.statusCode = statusCode;
    }
    return error;
  }

  /**
   * Determine error type from response
   */
  private determineErrorType(
    status: number,
    message: string
  ): { type: ApiErrorType; retryable: boolean } {
    if (status === 401 || status === 403) {
      return { type: ApiErrorType.INVALID_KEY, retryable: false };
    }
    if (status === 429) {
      return { type: ApiErrorType.RATE_LIMIT, retryable: true };
    }
    if (status >= 500) {
      return { type: ApiErrorType.API_ERROR, retryable: true };
    }
    if (status >= 400) {
      return { type: ApiErrorType.API_ERROR, retryable: false };
    }
    return { type: ApiErrorType.UNKNOWN, retryable: true };
  }

  /**
   * Sleep for specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle streaming response with progressive timeout management
   */
  private async handleStreamingResponse(
    response: Response,
    requestId: string,
    model: string,
    onChunk?: (content: string) => void,
    onComplete?: () => void,
    onError?: (error: OptimizedApiError) => void
  ): Promise<void> {
    if (!response.body) {
      const error = this.createError(
        'Response body is empty',
        ApiErrorType.API_ERROR,
        false,
        undefined,
        model
      );
      performanceLogger.endRequest(requestId, false, {
        errorType: error.type,
        model,
      });
      onError?.(error);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let totalTokens = 0;
    let lastChunkTime = Date.now();
    let streamingTimeout: NodeJS.Timeout | null = null;

    // Set up progressive streaming timeout
    const streamingTimeoutMs = getModelTimeout(model, 'streaming');
    const resetStreamingTimeout = () => {
      if (streamingTimeout) {
        clearTimeout(streamingTimeout);
      }
      streamingTimeout = setTimeout(() => {
        if (this.abortController) {
          this.abortController.abort();
        }
      }, streamingTimeoutMs);
    };

    resetStreamingTimeout();

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          performanceLogger.endRequest(requestId, true, {
            cacheHit: false,
            model,
            tokenCount: totalTokens,
          });
          onComplete?.();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (trimmedLine === '') {continue;}
          if (trimmedLine === 'data: [DONE]') {
            performanceLogger.endRequest(requestId, true, {
              cacheHit: false,
              model,
              tokenCount: totalTokens,
            });
            onComplete?.();
            return;
          }

          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.slice(6);
              const data = JSON.parse(jsonStr);

              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                totalTokens++;
                lastChunkTime = Date.now();
                resetStreamingTimeout(); // Reset timeout on each chunk
                onChunk?.(content);
              }

              if (data.choices?.[0]?.finish_reason) {
                if (streamingTimeout) {
                  clearTimeout(streamingTimeout);
                }
                performanceLogger.endRequest(requestId, true, {
                  cacheHit: false,
                  model,
                  tokenCount: totalTokens,
                });
                onComplete?.();
                return;
              }
            } catch (parseError) {
              // Only log parsing errors in development
              if (process.env.NODE_ENV === 'development') {
                console.warn('Failed to parse streaming data:', parseError);
              }
            }
          }
        }
      }
    } catch (error) {
      let streamError: OptimizedApiError;

      if (streamingTimeout) {
        clearTimeout(streamingTimeout);
      }

      if (error instanceof Error && error.name === 'AbortError') {
        const timeSinceLastChunk = Date.now() - lastChunkTime;
        const isStreamingTimeout = timeSinceLastChunk > streamingTimeoutMs * 0.8;

        streamError = this.createError(
          isStreamingTimeout
            ? `长文本生成超时 (${Math.round(streamingTimeoutMs/1000)}秒无响应)`
            : 'Streaming request timeout',
          ApiErrorType.TIMEOUT,
          true,
          undefined,
          model
        );
      } else if (error instanceof Error && error.message.includes('network')) {
        streamError = this.createError(
          'Network connection lost during streaming',
          ApiErrorType.NETWORK,
          true,
          undefined,
          model
        );
      } else {
        streamError = this.createError(
          error instanceof Error ? error.message : 'Streaming failed',
          ApiErrorType.UNKNOWN,
          false,
          undefined,
          model
        );
      }

      performanceLogger.endRequest(requestId, false, {
        errorType: streamError.type,
        model,
      });
      onError?.(streamError);
    } finally {
      if (streamingTimeout) {
        clearTimeout(streamingTimeout);
      }
      reader.releaseLock();
    }
  }

  /**
   * Make API request with timeout and retry logic
   */
  private async makeRequest(
    messages: DeepSeekMessage[],
    model: string,
    options: {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
    }
  ): Promise<DeepSeekApiResponse> {
    // Get model-specific timeout for initial connection
    const modelTimeout = getModelTimeout(model, 'initial');
    // Log timeout configuration in development only
    if (process.env.NODE_ENV === 'development') {
      if (process.env.NODE_ENV === 'development') {

      }
    }
    const { temperature = 0.7, max_tokens = 2048, top_p = 0.95 } = options;

    // Start performance tracking
    const requestId = performanceLogger.startRequest(
      'deepseek-api-call',
      model
    );

    // Check cache first
    const cacheKey = this.generateCacheKey(messages, model, temperature);
    const cachedEntry = this.cache.get(cacheKey);
    if (cachedEntry && this.isCacheValid(cachedEntry)) {
      performanceLogger.endRequest(requestId, true, { cacheHit: true, model });
      return cachedEntry.response;
    }

    // Trigger cleanup if needed (80% capacity reached)
    if (this.shouldTriggerCleanup()) {
      const cleanupResult = this.cleanExpiredEntries();
      if (process.env.NODE_ENV === 'development') {
        performanceLogger.logCustomMetric('cache-auto-cleanup', {
          trigger: 'capacity-threshold',
          ...cleanupResult,
        });
      }
    }

    const requestBody = {
      model,
      messages,
      temperature,
      max_tokens,
      top_p,
      stream: false,
    };

    let lastError: OptimizedApiError | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Create new abort controller for this attempt
        this.abortController = new AbortController();
        const timeoutId = setTimeout(() => {
          this.abortController?.abort();
        }, modelTimeout);

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: this.abortController.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData: DeepSeekApiError = await response
            .json()
            .catch(() => ({
              error: { message: 'Unknown error', type: 'unknown' },
            }));

          const { type, retryable } = this.determineErrorType(
            response.status,
            errorData.error.message
          );
          lastError = this.createError(
            errorData.error.message ||
              `HTTP ${response.status}: ${response.statusText}`,
            type,
            retryable,
            response.status,
            model
          );

          if (!retryable || attempt === this.config.maxRetries) {
            throw lastError;
          }
        } else {
          const data: DeepSeekApiResponse = await response.json();

          // Cache successful response
          this.cache.set(cacheKey, {
            response: data,
            timestamp: Date.now(),
            ttl: this.config.cacheTtl,
          });

          // Log successful request
          performanceLogger.endRequest(requestId, true, {
            cacheHit: false,
            retryCount: attempt,
            model,
            tokenCount: data.usage?.total_tokens,
          });

          return data;
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = this.createError(
            'Request timeout',
            ApiErrorType.TIMEOUT,
            true,
            undefined,
            model
          );
        } else if (error instanceof Error && error.message.includes('fetch')) {
          lastError = this.createError(
            'Network error',
            ApiErrorType.NETWORK,
            true,
            undefined,
            model
          );
        } else if (
          error instanceof Error &&
          (error as OptimizedApiError).type
        ) {
          lastError = error as OptimizedApiError;
        } else {
          lastError = this.createError(
            'Unknown error',
            ApiErrorType.UNKNOWN,
            true,
            undefined,
            model
          );
        }

        if (!lastError.retryable || attempt === this.config.maxRetries) {
          throw lastError;
        }
      }

      // Wait before retry with exponential backoff
      if (attempt < this.config.maxRetries) {
        const delay = this.config.retryDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }

    const finalError =
      lastError ||
      this.createError(
        'Max retries exceeded',
        ApiErrorType.UNKNOWN,
        false,
        undefined,
        model
      );

    // Log failed request
    performanceLogger.endRequest(requestId, false, {
      errorType: finalError.type,
      retryCount: this.config.maxRetries,
      model,
    });

    throw finalError;
  }

  /**
   * Chat with optimizations (non-streaming)
   */
  async chat(
    messages: DeepSeekMessage[],
    model: string = 'deepseek-chat',
    options: {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      priority?: number;
    } = {}
  ): Promise<DeepSeekApiResponse> {
    const { priority = 1, ...requestOptions } = options;

    return this.queueRequest(
      () => this.makeRequest(messages, model, requestOptions),
      priority
    );
  }

  /**
   * Chat with streaming support
   */
  async chatStream(
    messages: DeepSeekMessage[],
    model: string = 'deepseek-chat',
    options: {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      onChunk?: (content: string) => void;
      onComplete?: () => void;
      onError?: (error: OptimizedApiError) => void;
    } = {}
  ): Promise<void> {
    const {
      temperature = 0.7,
      max_tokens = 2048,
      top_p = 0.95,
      onChunk,
      onComplete,
      onError,
    } = options;

    // Get model-specific timeout for initial connection
    const modelTimeout = getModelTimeout(model, 'initial');
    // Log timeout configuration in development only
    if (process.env.NODE_ENV === 'development') {
      if (process.env.NODE_ENV === 'development') {

      }
    }

    // Start performance tracking
    const requestId = performanceLogger.startRequest(
      'deepseek-api-stream',
      model
    );

    const requestBody = {
      model,
      messages,
      temperature,
      max_tokens,
      top_p,
      stream: true,
    };

    let lastError: OptimizedApiError | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Create new abort controller for this attempt
        this.abortController = new AbortController();
        const timeoutId = setTimeout(() => {
          this.abortController?.abort();
        }, modelTimeout);

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: this.abortController.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData: DeepSeekApiError = await response
            .json()
            .catch(() => ({
              error: { message: 'Unknown error', type: 'unknown' },
            }));

          const { type, retryable } = this.determineErrorType(
            response.status,
            errorData.error.message
          );
          lastError = this.createError(
            errorData.error.message ||
              `HTTP ${response.status}: ${response.statusText}`,
            type,
            retryable,
            response.status,
            model
          );

          if (!retryable || attempt === this.config.maxRetries) {
            performanceLogger.endRequest(requestId, false, {
              errorType: lastError.type,
              retryCount: attempt,
              model,
            });
            onError?.(lastError);
            return;
          }
        } else {
          // Handle streaming response
          await this.handleStreamingResponse(
            response,
            requestId,
            model,
            onChunk,
            onComplete,
            onError
          );
          return;
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = this.createError(
            'Request timeout',
            ApiErrorType.TIMEOUT,
            true,
            undefined,
            model
          );
        } else if (error instanceof Error && error.message.includes('fetch')) {
          lastError = this.createError(
            'Network error',
            ApiErrorType.NETWORK,
            true,
            undefined,
            model
          );
        } else if (
          error instanceof Error &&
          (error as OptimizedApiError).type
        ) {
          lastError = error as OptimizedApiError;
        } else {
          lastError = this.createError(
            'Unknown error',
            ApiErrorType.UNKNOWN,
            true,
            undefined,
            model
          );
        }

        if (!lastError.retryable || attempt === this.config.maxRetries) {
          performanceLogger.endRequest(requestId, false, {
            errorType: lastError.type,
            retryCount: attempt,
            model,
          });
          onError?.(lastError);
          return;
        }
      }

      // Wait before retry with exponential backoff
      if (attempt < this.config.maxRetries) {
        const delay = this.config.retryDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }
  }

  /**
   * Cancel current request
   */
  cancel(): void {
    this.abortController?.abort();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.lastCleanupTime = Date.now();

    if (process.env.NODE_ENV === 'development') {
      performanceLogger.logCustomMetric('cache-manual-clear', {
        action: 'full-clear',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Force cleanup of expired entries
   */
  forceCleanup(): { cleaned: number; remaining: number } {
    return this.cleanExpiredEntries();
  }

  /**
   * Get cache stats
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    utilization: number;
    expiredEntries: number;
    lastCleanup: number;
  } {
    const cacheMap = this.cache['cache'] as Map<string, CacheEntry>;
    let expiredCount = 0;

    // Count expired entries
    for (const [, entry] of cacheMap) {
      if (!this.isCacheValid(entry)) {
        expiredCount++;
      }
    }

    const size = cacheMap.size;
    const maxSize = this.config.cacheSize;

    return {
      size,
      maxSize,
      utilization: (size / maxSize) * 100,
      expiredEntries: expiredCount,
      lastCleanup: this.lastCleanupTime,
    };
  }

  /**
   * Cleanup resources when client is destroyed
   */
  destroy(): void {
    this.stopPeriodicCleanup();
    this.cancel();
    this.clearCache();
  }

  /**
   * Get performance stats
   */
  getPerformanceStats() {
    return performanceLogger.getStats();
  }

  /**
   * Get recent performance metrics
   */
  getRecentMetrics(count: number = 10) {
    return performanceLogger.getRecentMetrics(count);
  }
}

/**
 * Create optimized DeepSeek client
 */
export function createOptimizedDeepSeekClient(
  apiKey: string,
  config?: Partial<ApiConfig>
): OptimizedDeepSeekClient {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('API key is required');
  }
  return new OptimizedDeepSeekClient(apiKey.trim(), config);
}
