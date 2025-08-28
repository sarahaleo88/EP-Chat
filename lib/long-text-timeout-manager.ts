/**
 * 长文本超时管理器
 * 专门处理长文本生成过程中的超时策略和恢复机制
 */

export interface TimeoutConfig {
  initialConnection: number;    // 初始连接超时
  streamingResponse: number;    // 流式响应超时
  chunkInterval: number;        // 数据块间隔超时
  continuationSegment: number;  // 续写段超时
  maxRetries: number;           // 最大重试次数
  backoffMultiplier: number;    // 退避倍数
}

export interface TimeoutContext {
  model: string;
  phase: 'initial' | 'streaming' | 'continuation';
  segmentIndex?: number;
  totalSegments?: number;
  lastChunkTime: number;
  retryCount: number;
}

export interface TimeoutResult {
  shouldRetry: boolean;
  nextTimeout: number;
  errorMessage: string;
  userFriendlyMessage: string;
  suggestion: string;
}

/**
 * 长文本超时管理器类
 */
export class LongTextTimeoutManager {
  private configs: Map<string, TimeoutConfig> = new Map();
  private activeTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private contextHistory: Map<string, TimeoutContext[]> = new Map();

  constructor() {
    this.initializeConfigs();
  }

  /**
   * 初始化模型特定的超时配置
   */
  private initializeConfigs(): void {
    // DeepSeek Chat 配置
    this.configs.set('deepseek-chat', {
      initialConnection: 45000,     // 45秒初始连接
      streamingResponse: 180000,    // 3分钟流式响应
      chunkInterval: 30000,         // 30秒数据块间隔
      continuationSegment: 120000,  // 2分钟续写段
      maxRetries: 3,
      backoffMultiplier: 1.5,
    });

    // DeepSeek Coder 配置
    this.configs.set('deepseek-coder', {
      initialConnection: 60000,     // 1分钟初始连接
      streamingResponse: 300000,    // 5分钟流式响应
      chunkInterval: 45000,         // 45秒数据块间隔
      continuationSegment: 180000,  // 3分钟续写段
      maxRetries: 3,
      backoffMultiplier: 1.5,
    });

    // DeepSeek Reasoner 配置
    this.configs.set('deepseek-reasoner', {
      initialConnection: 90000,     // 1.5分钟初始连接
      streamingResponse: 600000,    // 10分钟流式响应
      chunkInterval: 60000,         // 1分钟数据块间隔
      continuationSegment: 300000,  // 5分钟续写段
      maxRetries: 2,                // 推理模型重试次数较少
      backoffMultiplier: 2.0,
    });

    // 应用环境变量覆盖
    this.applyEnvironmentOverrides();
  }

  /**
   * 应用环境变量覆盖
   */
  private applyEnvironmentOverrides(): void {
    const longOutputGuard = process.env.EP_LONG_OUTPUT_GUARD !== 'off';
    const multiplier = longOutputGuard ? 1.5 : 1.0;

    // 应用长文本守护倍数
    for (const [model, config] of this.configs.entries()) {
      this.configs.set(model, {
        ...config,
        streamingResponse: Math.floor(config.streamingResponse * multiplier),
        chunkInterval: Math.floor(config.chunkInterval * multiplier),
        continuationSegment: Math.floor(config.continuationSegment * multiplier),
      });
    }

    // 应用环境变量中的API超时设置
    const envTimeout = parseInt(process.env.API_TIMEOUT || '0');
    if (envTimeout > 0) {
      for (const [model, config] of this.configs.entries()) {
        this.configs.set(model, {
          ...config,
          initialConnection: Math.max(config.initialConnection, envTimeout),
        });
      }
    }
  }

  /**
   * 获取超时配置
   */
  getTimeout(model: string, phase: TimeoutContext['phase']): number {
    const config = this.configs.get(model) || this.configs.get('deepseek-chat')!;
    
    switch (phase) {
      case 'initial':
        return config.initialConnection;
      case 'streaming':
        return config.streamingResponse;
      case 'continuation':
        return config.continuationSegment;
      default:
        return config.initialConnection;
    }
  }

  /**
   * 创建渐进式超时管理器
   */
  createProgressiveTimeout(
    requestId: string,
    context: TimeoutContext,
    onTimeout: (context: TimeoutContext) => void
  ): () => void {
    const config = this.configs.get(context.model) || this.configs.get('deepseek-chat')!;
    let timeoutId: NodeJS.Timeout;

    const setupTimeout = () => {
      const timeoutMs = context.phase === 'streaming' 
        ? config.chunkInterval 
        : this.getTimeout(context.model, context.phase);

      timeoutId = setTimeout(() => {
        onTimeout(context);
      }, timeoutMs);

      this.activeTimeouts.set(requestId, timeoutId);
    };

    const resetTimeout = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      context.lastChunkTime = Date.now();
      setupTimeout();
    };

    const clearTimeout = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.activeTimeouts.delete(requestId);
      }
    };

    // 初始设置
    setupTimeout();

    // 返回重置和清除函数
    return () => {
      clearTimeout();
    };
  }

  /**
   * 分析超时情况并提供恢复建议
   */
  analyzeTimeout(context: TimeoutContext): TimeoutResult {
    const config = this.configs.get(context.model) || this.configs.get('deepseek-chat')!;
    const timeSinceLastChunk = Date.now() - context.lastChunkTime;
    
    // 记录超时历史
    const history = this.contextHistory.get(context.model) || [];
    history.push({ ...context });
    this.contextHistory.set(context.model, history.slice(-10)); // 保留最近10次

    // 判断是否应该重试
    const shouldRetry = context.retryCount < config.maxRetries;
    
    // 计算下次超时时间（指数退避）
    const baseTimeout = this.getTimeout(context.model, context.phase);
    const nextTimeout = Math.floor(baseTimeout * Math.pow(config.backoffMultiplier, context.retryCount));

    // 生成错误消息
    let errorMessage: string;
    let userFriendlyMessage: string;
    let suggestion: string;

    if (context.phase === 'streaming' && timeSinceLastChunk > config.chunkInterval) {
      errorMessage = `长文本生成超时 (${Math.round(timeSinceLastChunk/1000)}秒无响应)`;
      userFriendlyMessage = '生成长文本时服务器响应中断';
      suggestion = '建议将问题分解为多个较短的部分，或使用"继续"功能分段获取内容';
    } else if (context.phase === 'continuation') {
      errorMessage = `续写段超时 (第${context.segmentIndex || 0}/${context.totalSegments || 0}段)`;
      userFriendlyMessage = '续写过程中发生超时';
      suggestion = '可以尝试重新开始对话，或将内容需求进一步细化';
    } else {
      errorMessage = `${context.phase}阶段超时`;
      userFriendlyMessage = '连接或初始响应超时';
      suggestion = '请检查网络连接，或稍后重试';
    }

    return {
      shouldRetry,
      nextTimeout,
      errorMessage,
      userFriendlyMessage,
      suggestion,
    };
  }

  /**
   * 获取模型的超时统计
   */
  getTimeoutStats(model: string): {
    totalTimeouts: number;
    recentTimeouts: number;
    averageRetryCount: number;
    mostCommonPhase: string;
  } {
    const history = this.contextHistory.get(model) || [];
    const recentHistory = history.slice(-5); // 最近5次

    const phaseCount = history.reduce((acc, ctx) => {
      acc[ctx.phase] = (acc[ctx.phase] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonPhase = Object.entries(phaseCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'initial';

    const averageRetryCount = history.length > 0 
      ? history.reduce((sum, ctx) => sum + ctx.retryCount, 0) / history.length 
      : 0;

    return {
      totalTimeouts: history.length,
      recentTimeouts: recentHistory.length,
      averageRetryCount,
      mostCommonPhase,
    };
  }

  /**
   * 清理超时管理器
   */
  cleanup(): void {
    // 清除所有活动的超时
    for (const timeoutId of this.activeTimeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.activeTimeouts.clear();
  }

  /**
   * 获取推荐的超时配置（用于调试）
   */
  getRecommendedConfig(model: string): TimeoutConfig {
    const stats = this.getTimeoutStats(model);
    const baseConfig = this.configs.get(model) || this.configs.get('deepseek-chat')!;

    // 根据历史统计调整配置
    if (stats.totalTimeouts > 5 && stats.mostCommonPhase === 'streaming') {
      return {
        ...baseConfig,
        streamingResponse: Math.floor(baseConfig.streamingResponse * 1.5),
        chunkInterval: Math.floor(baseConfig.chunkInterval * 1.3),
      };
    }

    return baseConfig;
  }
}

/**
 * 创建长文本超时管理器实例
 */
export function createLongTextTimeoutManager(): LongTextTimeoutManager {
  return new LongTextTimeoutManager();
}

// 全局实例
export const longTextTimeoutManager = createLongTextTimeoutManager();
