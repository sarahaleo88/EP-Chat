/**
 * 预算感知续写引擎
 * 基于剩余预算动态调整续写策略，支持幂等续传和重叠去重
 */

import { ModelCapabilities } from './model-capabilities';
import { BudgetGuardian, CostEstimate } from './budget-guardian';

export interface ContinuationContext {
  requestId: string;
  userId: string;
  segmentIndex: number;
  totalSegments: number;
  previousContent: string;
  offset: number;
  overlapTokens: number;
}

export interface ContinuationStrategy {
  mode: 'normal' | 'budget-constrained' | 'summary' | 'batch-export';
  maxTokensPerSegment: number;
  overlapTokens: number;
  maxSegments: number;
  summaryThreshold: number;
}

export interface ContinuationResult {
  content: string;
  finishReason: string;
  tokensUsed: number;
  actualCost: CostEstimate;
  shouldContinue: boolean;
  nextStrategy?: ContinuationStrategy;
  metadata: {
    segmentIndex: number;
    totalSegments: number;
    budgetRemaining: number;
    strategyUsed: string;
  };
}

/**
 * 预算感知续写引擎
 */
export class BudgetAwareContinuationEngine {
  private continuationStates: Map<string, ContinuationContext> = new Map();
  private readonly defaultStrategy: ContinuationStrategy;

  constructor(
    private budgetGuardian: BudgetGuardian,
    private capabilities: ModelCapabilities
  ) {
    this.defaultStrategy = {
      mode: 'normal',
      maxTokensPerSegment: this.getEnvNumber('CONTINUATION_TOKENS', 28000),
      overlapTokens: this.getEnvNumber('CONTINUATION_OVERLAP', 600),
      maxSegments: this.getEnvNumber('CONTINUATION_MAX', 6),
      summaryThreshold: this.getEnvNumber('SUMMARY_THRESHOLD', 0.1), // 10% 预算剩余时启用摘要模式
    };
  }

  /**
   * 评估续写策略
   */
  async evaluateContinuationStrategy(
    userId: string,
    currentContent: string,
    finishReason: string,
    segmentIndex: number = 0
  ): Promise<{ shouldContinue: boolean; strategy?: ContinuationStrategy }> {
    // 检查是否需要续写
    if (finishReason !== 'length' || segmentIndex >= this.defaultStrategy.maxSegments) {
      return { shouldContinue: false };
    }

    // 获取预算状态
    const budgetStatus = this.budgetGuardian.getBudgetStatus(userId);
    const userBudgetRemaining = this.getEnvNumber('BUDGET_USER_DAILY_USD', 2.50) - budgetStatus.userSpentTodayUSD;
    const siteBudgetRemaining = this.getEnvNumber('BUDGET_SITE_HOURLY_USD', 8.00) - budgetStatus.siteSpentThisHourUSD;
    const minBudgetRemaining = Math.min(userBudgetRemaining, siteBudgetRemaining);

    // 估算续写成本
    const estimatedInputTokens = this.estimateTokens(currentContent.slice(-2000)); // 使用最后2000字符作为上下文
    const estimatedContinuationCost = this.budgetGuardian.estimateCost(
      this.capabilities,
      estimatedInputTokens,
      this.defaultStrategy.maxTokensPerSegment
    );

    // 如果预算不足，不继续
    if (estimatedContinuationCost.totalCost > minBudgetRemaining) {
      return { shouldContinue: false };
    }

    // 根据剩余预算选择策略
    const budgetRatio = minBudgetRemaining / this.getEnvNumber('BUDGET_REQ_USD', 0.40);
    
    let strategy: ContinuationStrategy;

    if (budgetRatio > 0.5) {
      // 预算充足，使用正常策略
      strategy = { ...this.defaultStrategy, mode: 'normal' };
    } else if (budgetRatio > 0.2) {
      // 预算紧张，减少每段token数
      strategy = {
        ...this.defaultStrategy,
        mode: 'budget-constrained',
        maxTokensPerSegment: Math.floor(this.defaultStrategy.maxTokensPerSegment * 0.6),
        maxSegments: Math.floor(this.defaultStrategy.maxSegments * 0.8),
      };
    } else {
      // 预算严重不足，使用摘要模式
      strategy = {
        ...this.defaultStrategy,
        mode: 'summary',
        maxTokensPerSegment: Math.floor(this.defaultStrategy.maxTokensPerSegment * 0.3),
        maxSegments: 2,
      };
    }

    return { shouldContinue: true, strategy };
  }

  /**
   * 执行续写
   */
  async executeContinuation(
    requestId: string,
    userId: string,
    messages: Array<{ role: string; content: string }>,
    previousContent: string,
    strategy: ContinuationStrategy,
    segmentIndex: number
  ): Promise<ContinuationResult> {
    // 创建或更新续写上下文
    const context: ContinuationContext = {
      requestId,
      userId,
      segmentIndex,
      totalSegments: strategy.maxSegments,
      previousContent,
      offset: this.estimateTokens(previousContent),
      overlapTokens: strategy.overlapTokens,
    };

    this.continuationStates.set(requestId, context);

    // 构建续写消息
    const continuationMessages = this.buildContinuationMessages(
      messages,
      previousContent,
      strategy,
      segmentIndex
    );

    // 预飞行检查
    const inputTokens = this.estimateTokens(continuationMessages.map(m => m.content).join('\n'));
    const preflightResult = await this.budgetGuardian.preflightCheck(
      userId,
      this.capabilities,
      inputTokens,
      strategy.maxTokensPerSegment
    );

    if (!preflightResult.allowed) {
      throw new Error(`Continuation blocked: ${preflightResult.reason}`);
    }

    // 记录使用情况
    this.budgetGuardian.recordUsage(
      `${requestId}-seg${segmentIndex}`,
      userId,
      preflightResult.costBreakdown.estimated,
      true
    );

    // 模拟API调用（实际实现中会调用真实API）
    const mockResult = await this.simulateApiCall(continuationMessages, strategy);

    // 处理重叠去重
    const deduplicatedContent = this.deduplicateContent(
      previousContent,
      mockResult.content,
      strategy.overlapTokens
    );

    // 更新实际使用情况
    this.budgetGuardian.updateActualUsage(
      `${requestId}-seg${segmentIndex}`,
      {
        input: inputTokens,
        output: this.estimateTokens(mockResult.content),
      },
      this.capabilities
    );

    // 评估是否需要继续
    const nextEvaluation = await this.evaluateContinuationStrategy(
      userId,
      previousContent + deduplicatedContent,
      mockResult.finishReason,
      segmentIndex + 1
    );

    const budgetStatus = this.budgetGuardian.getBudgetStatus(userId);
    const budgetRemaining = Math.min(
      this.getEnvNumber('BUDGET_USER_DAILY_USD', 2.50) - budgetStatus.userSpentTodayUSD,
      this.getEnvNumber('BUDGET_SITE_HOURLY_USD', 8.00) - budgetStatus.siteSpentThisHourUSD
    );

    const result: ContinuationResult = {
      content: deduplicatedContent,
      finishReason: mockResult.finishReason,
      tokensUsed: this.estimateTokens(mockResult.content),
      actualCost: preflightResult.costBreakdown.estimated, // 简化，实际应该用真实成本
      shouldContinue: nextEvaluation.shouldContinue,
      metadata: {
        segmentIndex,
        totalSegments: strategy.maxSegments,
        budgetRemaining,
        strategyUsed: strategy.mode,
      },
    };

    if (nextEvaluation.strategy) {
      result.nextStrategy = nextEvaluation.strategy;
    }

    return result;
  }

  /**
   * 构建续写消息
   */
  private buildContinuationMessages(
    originalMessages: Array<{ role: string; content: string }>,
    previousContent: string,
    strategy: ContinuationStrategy,
    segmentIndex: number
  ): Array<{ role: string; content: string }> {
    const messages = [...originalMessages];

    // 添加之前的内容作为助手回复
    if (previousContent) {
      messages.push({
        role: 'assistant',
        content: previousContent,
      });
    }

    // 根据策略添加续写提示
    let continuationPrompt: string;

    switch (strategy.mode) {
      case 'normal':
        continuationPrompt = `请继续上面的内容，保持相同的风格和语调。这是第${segmentIndex + 1}/${strategy.maxSegments}段内容。`;
        break;
      case 'budget-constrained':
        continuationPrompt = `请简洁地继续上面的内容，重点突出核心要点。这是第${segmentIndex + 1}/${strategy.maxSegments}段内容。`;
        break;
      case 'summary':
        continuationPrompt = `请以摘要形式继续，概括剩余的主要内容。这是第${segmentIndex + 1}/${strategy.maxSegments}段内容。`;
        break;
      case 'batch-export':
        continuationPrompt = `请提供一个结构化的大纲，用户可以分批获取详细内容。`;
        break;
      default:
        continuationPrompt = `请继续上面的内容。`;
    }

    messages.push({
      role: 'user',
      content: continuationPrompt,
    });

    return messages;
  }

  /**
   * 去重重叠内容
   */
  private deduplicateContent(
    previousContent: string,
    newContent: string,
    overlapTokens: number
  ): string {
    if (!previousContent || overlapTokens <= 0) {
      return newContent;
    }

    // 简化的去重逻辑：检查新内容开头是否与前内容结尾重复
    const previousEnd = previousContent.slice(-overlapTokens * 4); // 粗略估算字符数
    const newStart = newContent.slice(0, overlapTokens * 4);

    // 查找最长公共子串
    let maxOverlap = 0;
    for (let i = 1; i <= Math.min(previousEnd.length, newStart.length); i++) {
      if (previousEnd.slice(-i) === newStart.slice(0, i)) {
        maxOverlap = i;
      }
    }

    return maxOverlap > 0 ? newContent.slice(maxOverlap) : newContent;
  }

  /**
   * 模拟API调用（实际实现中替换为真实API调用）
   */
  private async simulateApiCall(
    messages: Array<{ role: string; content: string }>,
    strategy: ContinuationStrategy
  ): Promise<{ content: string; finishReason: string }> {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 模拟内容生成
    const mockContent = `这是模拟的续写内容，策略模式：${strategy.mode}，最大token数：${strategy.maxTokensPerSegment}。`.repeat(10);
    
    // 模拟finish_reason
    const finishReason = Math.random() > 0.7 ? 'length' : 'stop';

    return {
      content: mockContent,
      finishReason,
    };
  }

  /**
   * 估算token数（简化版本）
   */
  private estimateTokens(text: string): number {
    // 简化估算：中文1.5字符/token，英文4字符/token
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars / 1.5 + otherChars / 4);
  }

  /**
   * 获取续写状态
   */
  getContinuationState(requestId: string): ContinuationContext | undefined {
    return this.continuationStates.get(requestId);
  }

  /**
   * 清理续写状态
   */
  clearContinuationState(requestId: string): void {
    this.continuationStates.delete(requestId);
  }

  /**
   * 辅助方法：获取环境变量数字值
   */
  private getEnvNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (!value) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
}
