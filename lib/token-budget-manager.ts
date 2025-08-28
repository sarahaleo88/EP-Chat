/**
 * 自适应Token预算管理器
 * 智能管理模型上下文窗口和输出token分配
 */

export interface ModelContextConfig {
  contextWindow: number;
  maxOutputTokens: number;
  safetyMargin: number;
  minOutputTokens: number;
}

export interface TokenBudgetResult {
  inputTokens: number;
  maxTokens: number;
  remainingContext: number;
  needsTruncation: boolean;
  canContinue: boolean;
  strategy: 'normal' | 'truncate' | 'continue';
}

export interface ContinuationContext {
  conversationId: string;
  segmentIndex: number;
  totalSegments: number;
  previousContent: string;
}

// 模型配置映射
const MODEL_CONFIGS: Record<string, ModelContextConfig> = {
  'deepseek-chat': {
    contextWindow: 128000, // 128K context window
    maxOutputTokens: 8192,  // 增加到8K输出
    safetyMargin: 1000,     // 安全边距
    minOutputTokens: 1024,  // 最小输出保证
  },
  'deepseek-coder': {
    contextWindow: 128000,
    maxOutputTokens: 8192,
    safetyMargin: 1000,
    minOutputTokens: 1024,
  },
  'deepseek-reasoner': {
    contextWindow: 128000,
    maxOutputTokens: 8192,
    safetyMargin: 1500,     // 推理模型需要更多安全边距
    minOutputTokens: 2048,  // 推理需要更多输出空间
  },
};

/**
 * Token预算管理器类
 */
export class TokenBudgetManager {
  private model: string;
  private config: ModelContextConfig;
  private enabled: boolean;

  constructor(model: string) {
    this.model = model;
    this.config = MODEL_CONFIGS[model] || MODEL_CONFIGS['deepseek-chat']!;
    this.enabled = process.env.EP_LONG_OUTPUT_GUARD !== 'off';
  }

  /**
   * 估算文本的token数量（简化版本）
   * 实际应用中可以使用更精确的tokenizer
   */
  private estimateTokens(text: string): number {
    // 简化估算：英文约4字符/token，中文约1.5字符/token
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars / 1.5 + otherChars / 4);
  }

  /**
   * 计算最优token预算
   */
  calculateBudget(
    messages: Array<{ role: string; content: string }>,
    requestedMaxTokens?: number
  ): TokenBudgetResult {
    if (!this.enabled) {
      // 如果禁用长文本守护，使用传统逻辑
      return {
        inputTokens: 0,
        maxTokens: requestedMaxTokens || 2048,
        remainingContext: this.config.contextWindow,
        needsTruncation: false,
        canContinue: false,
        strategy: 'normal',
      };
    }

    // 计算输入token总数
    const inputText = messages.map(m => m.content).join('\n');
    const inputTokens = this.estimateTokens(inputText);

    // 计算可用的输出token空间
    const availableForOutput = this.config.contextWindow - inputTokens - this.config.safetyMargin;
    
    // 确定最终的max_tokens
    let maxTokens: number;
    if (requestedMaxTokens) {
      maxTokens = Math.min(requestedMaxTokens, availableForOutput, this.config.maxOutputTokens);
    } else {
      maxTokens = Math.min(availableForOutput, this.config.maxOutputTokens);
    }

    // 确保不低于最小输出
    maxTokens = Math.max(maxTokens, this.config.minOutputTokens);

    // 判断是否需要截断输入
    const needsTruncation = inputTokens + maxTokens + this.config.safetyMargin > this.config.contextWindow;
    
    // 判断是否可以续写
    const canContinue = maxTokens >= this.config.minOutputTokens;

    let strategy: 'normal' | 'truncate' | 'continue' = 'normal';
    if (needsTruncation) {
      strategy = 'truncate';
    } else if (maxTokens >= this.config.maxOutputTokens * 0.8) {
      strategy = 'continue'; // 预期可能需要续写
    }

    return {
      inputTokens,
      maxTokens,
      remainingContext: this.config.contextWindow - inputTokens - maxTokens,
      needsTruncation,
      canContinue,
      strategy,
    };
  }

  /**
   * 截断消息历史以适应上下文窗口
   */
  truncateMessages(
    messages: Array<{ role: string; content: string }>,
    targetTokens: number
  ): Array<{ role: string; content: string }> {
    if (!this.enabled) {
      return messages;
    }

    const result = [...messages];
    let currentTokens = this.estimateTokens(result.map(m => m.content).join('\n'));

    // 从历史消息开始删除（保留最新的用户消息）
    while (currentTokens > targetTokens && result.length > 1) {
      // 删除最早的消息对（保持对话结构）
      if (result.length >= 2) {
        result.splice(0, 2); // 删除一对用户-助手消息
      } else {
        result.splice(0, 1); // 删除单条消息
      }
      currentTokens = this.estimateTokens(result.map(m => m.content).join('\n'));
    }

    return result;
  }

  /**
   * 生成续写提示
   */
  generateContinuationPrompt(previousContent: string, context?: ContinuationContext): string {
    const basePrompt = "请继续上面的内容，保持相同的风格和语调。";
    
    if (context) {
      return `${basePrompt}\n\n[这是第${context.segmentIndex + 1}/${context.totalSegments}段内容的续写]`;
    }
    
    return basePrompt;
  }

  /**
   * 检查是否需要续写
   */
  shouldContinue(finishReason: string, contentLength: number): boolean {
    if (!this.enabled) {
      return false;
    }

    return finishReason === 'length' && contentLength >= this.config.minOutputTokens;
  }

  /**
   * 获取模型配置
   */
  getModelConfig(): ModelContextConfig {
    return { ...this.config };
  }

  /**
   * 更新环境配置
   */
  updateFromEnv(): void {
    const envConfig = {
      contextWindow: parseInt(process.env.MODEL_CTX || '128000'),
      maxOutputTokens: parseInt(process.env.RESERVE_OUTPUT || '8192'),
      safetyMargin: parseInt(process.env.SAFETY_MARGIN || '1000'),
      minOutputTokens: parseInt(process.env.MIN_OUTPUT || '1024'),
    };

    // 验证配置合理性
    if (envConfig.contextWindow > 0) {
      this.config.contextWindow = envConfig.contextWindow;
    }
    if (envConfig.maxOutputTokens > 0) {
      this.config.maxOutputTokens = envConfig.maxOutputTokens;
    }
    if (envConfig.safetyMargin > 0) {
      this.config.safetyMargin = envConfig.safetyMargin;
    }
    if (envConfig.minOutputTokens > 0) {
      this.config.minOutputTokens = envConfig.minOutputTokens;
    }
  }
}

/**
 * 创建Token预算管理器实例
 */
export function createTokenBudgetManager(model: string): TokenBudgetManager {
  const manager = new TokenBudgetManager(model);
  manager.updateFromEnv(); // 应用环境变量配置
  return manager;
}

/**
 * 全局配置检查
 */
export function validateTokenBudgetConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 检查环境变量
  const modelCtx = process.env.MODEL_CTX;
  const reserveOutput = process.env.RESERVE_OUTPUT;
  
  if (modelCtx && parseInt(modelCtx) <= 0) {
    errors.push('MODEL_CTX must be a positive number');
  }
  
  if (reserveOutput && parseInt(reserveOutput) <= 0) {
    errors.push('RESERVE_OUTPUT must be a positive number');
  }

  if (process.env.EP_LONG_OUTPUT_GUARD === 'off') {
    warnings.push('Long output guard is disabled');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
