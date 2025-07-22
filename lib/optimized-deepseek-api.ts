/**
 * Optimized DeepSeek API Client
 * Enhanced with timeout, retry logic, caching, and better error handling
 */

import { DeepSeekMessage, DeepSeekApiResponse, DeepSeekApiError } from './deepseek-api';
import { performanceLogger } from './performance-logger';

// Cache interface
interface CacheEntry {
  response: DeepSeekApiResponse;
  timestamp: number;
  ttl: number;
}

// Error types for better handling
export enum ApiErrorType {
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  API_ERROR = 'api_error',
  INVALID_KEY = 'invalid_key',
  UNKNOWN = 'unknown'
}

export interface OptimizedApiError extends Error {
  type: ApiErrorType;
  retryable: boolean;
  statusCode?: number;
}

// Configuration interface
interface ApiConfig {
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  cacheSize: number;
  cacheTtl: number;
  maxConcurrentRequests: number;
  requestPriority: boolean;
}

// Default configuration
const DEFAULT_CONFIG: ApiConfig = {
  timeout: 15000, // 15 seconds - optimized for faster response
  maxRetries: 3,
  retryDelay: 800, // Reduced from 1000ms to 800ms for faster retry
  cacheSize: 75, // Increased from 50 to 75 for better cache hit rate
  cacheTtl: 1800000, // 30 minutes - optimized for better cache hit rate
  maxConcurrentRequests: 4, // Increased from 3 to 4 for better throughput
  requestPriority: true // Enable request prioritization
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

  constructor(apiKey: string, config: Partial<ApiConfig> = {}) {
    this.apiKey = apiKey;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new LRUCache(this.config.cacheSize);
  }

  /**
   * Generate cache key for request with semantic considerations
   */
  private generateCacheKey(messages: DeepSeekMessage[], model: string, temperature: number): string {
    // Normalize messages for semantic caching
    const normalizedMessages = messages.map(msg => ({
      role: msg.role,
      content: this.normalizeContent(msg.content)
    }));

    const content = JSON.stringify({
      messages: normalizedMessages,
      model,
      temperature: Math.round(temperature * 10) / 10 // Round temperature to 1 decimal
    });

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
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
    if (!this.config.requestPriority || this.activeRequests < this.config.maxConcurrentRequests) {
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
        reject
      };

      // Insert request in priority order (higher priority first)
      const insertIndex = this.requestQueue.findIndex(req => req.priority < priority);
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
    while (this.requestQueue.length > 0 && this.activeRequests < this.config.maxConcurrentRequests) {
      const request = this.requestQueue.shift();
      if (!request) break;

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
   * Create optimized error
   */
  private createError(message: string, type: ApiErrorType, retryable: boolean, statusCode?: number): OptimizedApiError {
    const error = new Error(message) as OptimizedApiError;
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
  private determineErrorType(status: number, message: string): { type: ApiErrorType; retryable: boolean } {
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
   * Handle streaming response
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
      const error = this.createError('Response body is empty', ApiErrorType.API_ERROR, false);
      performanceLogger.endRequest(requestId, false, { errorType: error.type, model });
      onError?.(error);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let totalTokens = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          performanceLogger.endRequest(requestId, true, {
            cacheHit: false,
            model,
            tokenCount: totalTokens
          });
          onComplete?.();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (trimmedLine === '') continue;
          if (trimmedLine === 'data: [DONE]') {
            performanceLogger.endRequest(requestId, true, {
              cacheHit: false,
              model,
              tokenCount: totalTokens
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
                onChunk?.(content);
              }

              if (data.choices?.[0]?.finish_reason) {
                performanceLogger.endRequest(requestId, true, {
                  cacheHit: false,
                  model,
                  tokenCount: totalTokens
                });
                onComplete?.();
                return;
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      let streamError: OptimizedApiError;

      if (error instanceof Error && error.name === 'AbortError') {
        streamError = this.createError('Streaming request timeout', ApiErrorType.TIMEOUT, true);
      } else if (error instanceof Error && error.message.includes('network')) {
        streamError = this.createError('Network connection lost during streaming', ApiErrorType.NETWORK, true);
      } else {
        streamError = this.createError(
          error instanceof Error ? error.message : 'Streaming failed',
          ApiErrorType.UNKNOWN,
          false
        );
      }

      performanceLogger.endRequest(requestId, false, { errorType: streamError.type, model });
      onError?.(streamError);
    } finally {
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
    const { temperature = 0.7, max_tokens = 2048, top_p = 0.95 } = options;

    // Start performance tracking
    const requestId = performanceLogger.startRequest('deepseek-api-call', model);

    // Check cache first
    const cacheKey = this.generateCacheKey(messages, model, temperature);
    const cachedEntry = this.cache.get(cacheKey);
    if (cachedEntry && this.isCacheValid(cachedEntry)) {
      performanceLogger.endRequest(requestId, true, { cacheHit: true, model });
      return cachedEntry.response;
    }

    const requestBody = {
      model,
      messages,
      temperature,
      max_tokens,
      top_p,
      stream: false
    };

    let lastError: OptimizedApiError | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Create new abort controller for this attempt
        this.abortController = new AbortController();
        const timeoutId = setTimeout(() => {
          this.abortController?.abort();
        }, this.config.timeout);

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(requestBody),
          signal: this.abortController.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData: DeepSeekApiError = await response.json().catch(() => ({
            error: { message: 'Unknown error', type: 'unknown' }
          }));
          
          const { type, retryable } = this.determineErrorType(response.status, errorData.error.message);
          lastError = this.createError(
            errorData.error.message || `HTTP ${response.status}: ${response.statusText}`,
            type,
            retryable,
            response.status
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
            ttl: this.config.cacheTtl
          });

          // Log successful request
          performanceLogger.endRequest(requestId, true, {
            cacheHit: false,
            retryCount: attempt,
            model,
            tokenCount: data.usage?.total_tokens
          });

          return data;
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = this.createError('Request timeout', ApiErrorType.TIMEOUT, true);
        } else if (error instanceof Error && error.message.includes('fetch')) {
          lastError = this.createError('Network error', ApiErrorType.NETWORK, true);
        } else if (error instanceof Error && (error as OptimizedApiError).type) {
          lastError = error as OptimizedApiError;
        } else {
          lastError = this.createError('Unknown error', ApiErrorType.UNKNOWN, true);
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

    const finalError = lastError || this.createError('Max retries exceeded', ApiErrorType.UNKNOWN, false);

    // Log failed request
    performanceLogger.endRequest(requestId, false, {
      errorType: finalError.type,
      retryCount: this.config.maxRetries,
      model
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
    const { temperature = 0.7, max_tokens = 2048, top_p = 0.95, onChunk, onComplete, onError } = options;

    // Start performance tracking
    const requestId = performanceLogger.startRequest('deepseek-api-stream', model);

    const requestBody = {
      model,
      messages,
      temperature,
      max_tokens,
      top_p,
      stream: true
    };

    let lastError: OptimizedApiError | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Create new abort controller for this attempt
        this.abortController = new AbortController();
        const timeoutId = setTimeout(() => {
          this.abortController?.abort();
        }, this.config.timeout);

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(requestBody),
          signal: this.abortController.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData: DeepSeekApiError = await response.json().catch(() => ({
            error: { message: 'Unknown error', type: 'unknown' }
          }));

          const { type, retryable } = this.determineErrorType(response.status, errorData.error.message);
          lastError = this.createError(
            errorData.error.message || `HTTP ${response.status}: ${response.statusText}`,
            type,
            retryable,
            response.status
          );

          if (!retryable || attempt === this.config.maxRetries) {
            performanceLogger.endRequest(requestId, false, {
              errorType: lastError.type,
              retryCount: attempt,
              model
            });
            onError?.(lastError);
            return;
          }
        } else {
          // Handle streaming response
          await this.handleStreamingResponse(response, requestId, model, onChunk, onComplete, onError);
          return;
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = this.createError('Request timeout', ApiErrorType.TIMEOUT, true);
        } else if (error instanceof Error && error.message.includes('fetch')) {
          lastError = this.createError('Network error', ApiErrorType.NETWORK, true);
        } else if (error instanceof Error && (error as OptimizedApiError).type) {
          lastError = error as OptimizedApiError;
        } else {
          lastError = this.createError('Unknown error', ApiErrorType.UNKNOWN, true);
        }

        if (!lastError.retryable || attempt === this.config.maxRetries) {
          performanceLogger.endRequest(requestId, false, {
            errorType: lastError.type,
            retryCount: attempt,
            model
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
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache['cache'].size,
      maxSize: this.config.cacheSize
    };
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
