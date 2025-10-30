/**
 * DeepSeek-v3.1 模型能力协商系统
 * 动态探测模型能力，失败时使用保守回退
 */

export interface ModelCapabilities {
  modelName: string;
  contextWindow: number;
  maxOutputPerRequest: number;
  supportsReasoning: boolean;
  rateLimit: {
    requestsPerSecond: number;
    tokensPerMinute: number;
  };
  pricing: {
    inputPer1K: number;
    outputPer1K: number;
    reasoningPer1K: number;
  };
  lastUpdated: number;
  source: 'detected' | 'fallback' | 'cached';
}

export interface ModelMetadata {
  id: string;
  max_context_tokens?: number;
  max_output_tokens?: number;
  supports_reasoning?: boolean;
  rate_limits?: {
    requests_per_second?: number;
    tokens_per_minute?: number;
  };
  pricing?: {
    input_per_1k_tokens?: number;
    output_per_1k_tokens?: number;
    reasoning_per_1k_tokens?: number;
  };
}

/**
 * 模型能力管理器
 */
export class ModelCapabilityManager {
  private capabilities: Map<string, ModelCapabilities> = new Map();
  private refreshInterval: NodeJS.Timeout | null = null;
  private readonly REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15分钟刷新一次
  private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30分钟缓存过期

  constructor(private apiKey: string, private baseUrl: string = 'https://api.deepseek.com/v1') {}

  /**
   * 获取模型能力（带缓存和回退）
   */
  async getCapabilities(modelName: string): Promise<ModelCapabilities> {
    const cached = this.capabilities.get(modelName);
    
    // 检查缓存是否有效
    if (cached && Date.now() - cached.lastUpdated < this.CACHE_TTL_MS) {
      return cached;
    }

    // 尝试探测能力
    try {
      const detected = await this.detectCapabilities(modelName);
      this.capabilities.set(modelName, detected);
      return detected;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Capability] Detection failed for ${modelName}:`, error);
      }
      
      // 使用回退配置
      const fallback = this.getFallbackCapabilities(modelName);
      this.capabilities.set(modelName, fallback);
      return fallback;
    }
  }

  /**
   * 探测模型能力
   */
  private async detectCapabilities(modelName: string): Promise<ModelCapabilities> {
    // Note: startTime is kept for future performance monitoring features
    const _startTime = Date.now();

    try {
      // 尝试获取模型元数据
      const metadata = await this.fetchModelMetadata(modelName);
      
      const capabilities: ModelCapabilities = {
        modelName,
        contextWindow: metadata.max_context_tokens || this.getEnvNumber('MODEL_CTX', 131072),
        maxOutputPerRequest: Math.min(
          metadata.max_output_tokens || this.getEnvNumber('MODEL_MAX_OUTPUT_PER_REQ', 30000),
          metadata.max_context_tokens || this.getEnvNumber('MODEL_CTX', 131072)
        ),
        supportsReasoning: metadata.supports_reasoning || process.env.MODEL_SUPPORTS_REASONING === 'true',
        rateLimit: {
          requestsPerSecond: metadata.rate_limits?.requests_per_second || this.getEnvNumber('MODEL_RATE_LIMIT_RPS', 0.5),
          tokensPerMinute: metadata.rate_limits?.tokens_per_minute || this.getEnvNumber('MODEL_RATE_LIMIT_TPM', 30000),
        },
        pricing: {
          inputPer1K: metadata.pricing?.input_per_1k_tokens || this.getEnvNumber('PRICE_IN_PER_1K', 0.0014),
          outputPer1K: metadata.pricing?.output_per_1k_tokens || this.getEnvNumber('PRICE_OUT_PER_1K', 0.0028),
          reasoningPer1K: metadata.pricing?.reasoning_per_1k_tokens || this.getEnvNumber('PRICE_REASON_PER_1K', 0.0056),
        },
        lastUpdated: Date.now(),
        source: 'detected'
      };

      if (process.env.NODE_ENV === 'development') {

      }

      return capabilities;
    } catch (error) {
      throw new Error(`Failed to detect capabilities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 获取模型元数据
   */
  private async fetchModelMetadata(modelName: string): Promise<ModelMetadata> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    try {
      // 尝试多个端点获取模型信息
      const endpoints = [
        `/models/${modelName}`,
        `/models`,
        `/info`
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          });

          if (!response.ok) {
            continue; // 尝试下一个端点
          }

          const data = await response.json();
          
          // 处理不同的响应格式
          if (endpoint === `/models/${modelName}`) {
            return data as ModelMetadata;
          } else if (endpoint === '/models') {
            const model = data.data?.find((m: any) => m.id === modelName);
            if (model) {
              return model as ModelMetadata;
            }
          } else if (endpoint === '/info') {
            return {
              id: modelName,
              max_context_tokens: data.max_context_tokens,
              max_output_tokens: data.max_output_tokens,
              supports_reasoning: data.supports_reasoning,
              rate_limits: data.rate_limits,
              pricing: data.pricing,
            };
          }
        } catch (endpointError) {
          // 继续尝试下一个端点
          continue;
        }
      }

      throw new Error('All metadata endpoints failed');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 获取回退能力配置
   */
  private getFallbackCapabilities(modelName: string): ModelCapabilities {
    return {
      modelName,
      contextWindow: this.getEnvNumber('MODEL_CTX', 131072),
      maxOutputPerRequest: this.getEnvNumber('MODEL_MAX_OUTPUT_PER_REQ', 30000),
      supportsReasoning: process.env.MODEL_SUPPORTS_REASONING === 'true',
      rateLimit: {
        requestsPerSecond: this.getEnvNumber('MODEL_RATE_LIMIT_RPS', 0.5),
        tokensPerMinute: this.getEnvNumber('MODEL_RATE_LIMIT_TPM', 30000),
      },
      pricing: {
        inputPer1K: this.getEnvNumber('PRICE_IN_PER_1K', 0.0014),
        outputPer1K: this.getEnvNumber('PRICE_OUT_PER_1K', 0.0028),
        reasoningPer1K: this.getEnvNumber('PRICE_REASON_PER_1K', 0.0056),
      },
      lastUpdated: Date.now(),
      source: 'fallback'
    };
  }

  /**
   * 计算最优输出token数
   */
  calculateOptimalMaxTokens(
    capabilities: ModelCapabilities,
    inputTokens: number,
    requestedTokens?: number
  ): number {
    const safetyMargin = this.getEnvNumber('SAFETY_MARGIN', 1024);
    const availableForOutput = capabilities.contextWindow - inputTokens - safetyMargin;
    
    let maxTokens = Math.min(
      capabilities.maxOutputPerRequest,
      availableForOutput
    );

    if (requestedTokens) {
      maxTokens = Math.min(maxTokens, requestedTokens);
    }

    return Math.max(maxTokens, this.getEnvNumber('RESERVE_OUTPUT', 4096));
  }

  /**
   * 启动定期刷新
   */
  startPeriodicRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshInterval = setInterval(async () => {
      const modelNames = Array.from(this.capabilities.keys());
      
      for (const modelName of modelNames) {
        try {
          await this.getCapabilities(modelName); // 这会触发刷新
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[Capability] Refresh failed for ${modelName}:`, error);
          }
        }
      }
    }, this.REFRESH_INTERVAL_MS);
  }

  /**
   * 停止定期刷新
   */
  stopPeriodicRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.capabilities.clear();
  }

  /**
   * 获取所有缓存的能力
   */
  getAllCapabilities(): ModelCapabilities[] {
    return Array.from(this.capabilities.values());
  }

  /**
   * 辅助方法：获取环境变量数字值
   */
  private getEnvNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (!value) {
      return defaultValue;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * 销毁管理器
   */
  dispose(): void {
    this.stopPeriodicRefresh();
    this.clearCache();
  }
}

/**
 * 全局能力管理器实例
 */
let globalCapabilityManager: ModelCapabilityManager | null = null;

/**
 * 获取或创建全局能力管理器
 */
export function getCapabilityManager(apiKey?: string): ModelCapabilityManager {
  if (!globalCapabilityManager && apiKey) {
    globalCapabilityManager = new ModelCapabilityManager(apiKey);
    globalCapabilityManager.startPeriodicRefresh();
  }
  
  if (!globalCapabilityManager) {
    throw new Error('Capability manager not initialized. Provide API key first.');
  }
  
  return globalCapabilityManager;
}

/**
 * 销毁全局能力管理器
 */
export function disposeCapabilityManager(): void {
  if (globalCapabilityManager) {
    globalCapabilityManager.dispose();
    globalCapabilityManager = null;
  }
}
