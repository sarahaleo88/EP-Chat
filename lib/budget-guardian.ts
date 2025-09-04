/**
 * 三级预算守护系统
 * 实现请求级、用户级、全站级预算控制和成本预估
 */

import { ModelCapabilities } from './model-capabilities';

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  inputCost: number;
  outputCost: number;
  reasoningCost: number;
  totalCost: number;
  currency: 'USD';
}

export interface BudgetLimits {
  requestMaxUSD: number;
  userDailyMaxUSD: number;
  siteHourlyMaxUSD: number;
}

export interface BudgetStatus {
  userSpentTodayUSD: number;
  siteSpentThisHourUSD: number;
  lastResetTime: number;
}

export interface BudgetCheckResult {
  allowed: boolean;
  reason?: string;
  recommendedOutputTokens?: number;
  costBreakdown: {
    estimated: CostEstimate;
    withinRequestLimit: boolean;
    withinUserLimit: boolean;
    withinSiteLimit: boolean;
  };
  suggestedActions?: string[];
}

export interface UsageRecord {
  requestId: string;
  userId: string;
  timestamp: number;
  estimated: CostEstimate;
  actual?: CostEstimate;
  approved: boolean;
  completed: boolean;
}

/**
 * 预算守护器
 */
export class BudgetGuardian {
  private userSpending: Map<string, { dailyUSD: number; lastReset: number }> = new Map();
  private siteSpending: { hourlyUSD: number; lastReset: number } = { hourlyUSD: 0, lastReset: Date.now() };
  private usageRecords: Map<string, UsageRecord> = new Map();
  private readonly limits: BudgetLimits;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private readonly maxRecords: number;

  constructor() {
    this.limits = {
      requestMaxUSD: this.getEnvNumber('BUDGET_REQ_USD', 0.40),
      userDailyMaxUSD: this.getEnvNumber('BUDGET_USER_DAILY_USD', 2.50),
      siteHourlyMaxUSD: this.getEnvNumber('BUDGET_SITE_HOURLY_USD', 8.00),
    };
    
    // 设置最大记录数限制
    this.maxRecords = this.getEnvNumber('BUDGET_MAX_RECORDS', 10000);

    // 启动定期清理
    this.startPeriodicCleanup();
  }

  /**
   * 估算成本
   */
  estimateCost(
    capabilities: ModelCapabilities,
    inputTokens: number,
    outputTokens: number,
    reasoningTokens: number = 0
  ): CostEstimate {
    // 输入验证
    if (inputTokens < 0 || outputTokens < 0 || reasoningTokens < 0) {
      throw new Error('Token数量不能为负数');
    }
    
    const inputCost = (inputTokens / 1000) * capabilities.pricing.inputPer1K;
    const outputCost = (outputTokens / 1000) * capabilities.pricing.outputPer1K;
    const reasoningCost = (reasoningTokens / 1000) * capabilities.pricing.reasoningPer1K;

    return {
      inputTokens,
      outputTokens,
      reasoningTokens,
      inputCost,
      outputCost,
      reasoningCost,
      totalCost: inputCost + outputCost + reasoningCost,
      currency: 'USD',
    };
  }

  /**
   * 预飞行检查 - 核心预算门控
   */
  async preflightCheck(
    userId: string,
    capabilities: ModelCapabilities,
    inputTokens: number,
    requestedOutputTokens: number,
    reasoningTokens: number = 0
  ): Promise<BudgetCheckResult> {
    // 更新用户和全站消费统计
    this.updateSpendingStats(userId);

    // 估算成本
    const estimated = this.estimateCost(capabilities, inputTokens, requestedOutputTokens, reasoningTokens);

    // 获取当前消费状态
    const userSpent = this.getUserSpentToday(userId);
    const siteSpent = this.getSiteSpentThisHour();

    // 三级预算检查
    const withinRequestLimit = estimated.totalCost <= this.limits.requestMaxUSD;
    const withinUserLimit = userSpent + estimated.totalCost <= this.limits.userDailyMaxUSD;
    const withinSiteLimit = siteSpent + estimated.totalCost <= this.limits.siteHourlyMaxUSD;

    const allowed = withinRequestLimit && withinUserLimit && withinSiteLimit;

    // 构建结果
    const result: BudgetCheckResult = {
      allowed,
      costBreakdown: {
        estimated,
        withinRequestLimit,
        withinUserLimit,
        withinSiteLimit,
      },
    };

    // 如果不允许，提供原因和建议
    if (!allowed) {
      const reasons: string[] = [];
      const suggestions: string[] = [];

      if (!withinRequestLimit) {
        reasons.push(`单请求成本 $${estimated.totalCost.toFixed(4)} 超过限制 $${this.limits.requestMaxUSD}`);
        suggestions.push('减少输出长度或分批处理');
      }

      if (!withinUserLimit) {
        const remaining = this.limits.userDailyMaxUSD - userSpent;
        reasons.push(`用户日消费将超限 (剩余: $${remaining.toFixed(4)})`);
        suggestions.push('明日再试或升级配额');
      }

      if (!withinSiteLimit) {
        const remaining = this.limits.siteHourlyMaxUSD - siteSpent;
        reasons.push(`全站时消费将超限 (剩余: $${remaining.toFixed(4)})`);
        suggestions.push('稍后重试或联系管理员');
      }

      result.reason = reasons.join('; ');
      result.suggestedActions = suggestions;

      // 计算推荐的输出token数
      if (!withinRequestLimit) {
        const maxCostForRequest = this.limits.requestMaxUSD;
        const fixedCost = estimated.inputCost + estimated.reasoningCost;
        const availableForOutput = maxCostForRequest - fixedCost;
        const recommendedTokens = Math.floor((availableForOutput / capabilities.pricing.outputPer1K) * 1000);
        result.recommendedOutputTokens = Math.max(recommendedTokens, 512);
      }
    }

    return result;
  }

  /**
   * 记录使用情况
   */
  recordUsage(
    requestId: string,
    userId: string,
    estimated: CostEstimate,
    approved: boolean
  ): void {
    const record: UsageRecord = {
      requestId,
      userId,
      timestamp: Date.now(),
      estimated,
      approved,
      completed: false,
    };

    this.usageRecords.set(requestId, record);

    // 如果批准，预扣费用
    if (approved) {
      this.addUserSpending(userId, estimated.totalCost);
      this.addSiteSpending(estimated.totalCost);
    }
  }

  /**
   * 更新实际使用情况
   */
  updateActualUsage(
    requestId: string,
    actualTokens: { input: number; output: number; reasoning?: number },
    capabilities: ModelCapabilities
  ): void {
    const record = this.usageRecords.get(requestId);
    if (!record) {
      return;
    }

    const actual = this.estimateCost(
      capabilities,
      actualTokens.input,
      actualTokens.output,
      actualTokens.reasoning || 0
    );

    record.actual = actual;
    record.completed = true;

    // 调整费用差额
    if (record.approved) {
      const difference = actual.totalCost - record.estimated.totalCost;
      if (Math.abs(difference) > 0.0001) { // 避免浮点精度问题
        this.addUserSpending(record.userId, difference);
        this.addSiteSpending(difference);
      }
    }
  }

  /**
   * 获取用户今日消费
   */
  getUserSpentToday(userId: string): number {
    this.updateSpendingStats(userId);
    return this.userSpending.get(userId)?.dailyUSD || 0;
  }

  /**
   * 获取全站本小时消费
   */
  getSiteSpentThisHour(): number {
    this.updateSpendingStats();
    return this.siteSpending.hourlyUSD;
  }

  /**
   * 获取预算状态
   */
  getBudgetStatus(userId: string): BudgetStatus {
    return {
      userSpentTodayUSD: this.getUserSpentToday(userId),
      siteSpentThisHourUSD: this.getSiteSpentThisHour(),
      lastResetTime: Date.now(),
    };
  }

  /**
   * 获取使用记录
   */
  getUsageRecords(userId?: string, limit: number = 100): UsageRecord[] {
    const records = Array.from(this.usageRecords.values());
    
    const filtered = userId 
      ? records.filter(r => r.userId === userId)
      : records;

    return filtered
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * 生成成本报告
   */
  generateCostReport(startTime: number, endTime: number): {
    totalRequests: number;
    approvedRequests: number;
    totalEstimatedCost: number;
    totalActualCost: number;
    averageCostPerRequest: number;
    topUsers: Array<{ userId: string; cost: number; requests: number }>;
  } {
    const records = Array.from(this.usageRecords.values())
      .filter(r => r.timestamp >= startTime && r.timestamp <= endTime);

    const totalRequests = records.length;
    const approvedRequests = records.filter(r => r.approved).length;
    const totalEstimatedCost = records.reduce((sum, r) => sum + r.estimated.totalCost, 0);
    const totalActualCost = records.reduce((sum, r) => sum + (r.actual?.totalCost || r.estimated.totalCost), 0);
    const averageCostPerRequest = totalActualCost / Math.max(totalRequests, 1);

    // 统计用户消费
    const userStats = new Map<string, { cost: number; requests: number }>();
    records.forEach(r => {
      const cost = r.actual?.totalCost || r.estimated.totalCost;
      const existing = userStats.get(r.userId) || { cost: 0, requests: 0 };
      userStats.set(r.userId, {
        cost: existing.cost + cost,
        requests: existing.requests + 1,
      });
    });

    const topUsers = Array.from(userStats.entries())
      .map(([userId, stats]) => ({ userId, ...stats }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    return {
      totalRequests,
      approvedRequests,
      totalEstimatedCost,
      totalActualCost,
      averageCostPerRequest,
      topUsers,
    };
  }

  /**
   * 更新消费统计（处理重置逻辑）
   */
  private updateSpendingStats(userId?: string): void {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneHourMs = 60 * 60 * 1000;

    // 更新用户日消费
    if (userId) {
      const userStats = this.userSpending.get(userId);
      if (!userStats || now - userStats.lastReset > oneDayMs) {
        this.userSpending.set(userId, { dailyUSD: 0, lastReset: now });
      }
    }

    // 更新全站时消费
    if (now - this.siteSpending.lastReset > oneHourMs) {
      this.siteSpending = { hourlyUSD: 0, lastReset: now };
    }
  }

  /**
   * 添加用户消费
   */
  private addUserSpending(userId: string, amount: number): void {
    this.updateSpendingStats(userId);
    const userStats = this.userSpending.get(userId)!;
    userStats.dailyUSD += amount;
  }

  /**
   * 添加全站消费
   */
  private addSiteSpending(amount: number): void {
    this.updateSpendingStats();
    this.siteSpending.hourlyUSD += amount;
  }

  /**
   * 启动定期清理
   */
  private startPeriodicCleanup(): void {
    // 清除之前的定时器
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, 30 * 60 * 1000); // 每30分钟清理一次
  }

  /**
   * 执行内存清理
   */
  private performCleanup(): void {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneWeekMs = 7 * oneDayMs;
    
    // 清理过期的使用记录
    let deletedRecords = 0;
    for (const [requestId, record] of this.usageRecords.entries()) {
      if (now - record.timestamp > oneWeekMs) {
        this.usageRecords.delete(requestId);
        deletedRecords++;
      }
    }
    
    // 清理过期的用户消费记录
    let deletedUsers = 0;
    for (const [userId, spending] of this.userSpending.entries()) {
      if (now - spending.lastReset > oneDayMs) {
        this.userSpending.delete(userId);
        deletedUsers++;
      }
    }
    
    // 重置站点每小时消费（如果超过1小时）
    if (now - this.siteSpending.lastReset > 60 * 60 * 1000) {
      this.siteSpending = { hourlyUSD: 0, lastReset: now };
    }
    
    // 如果记录过多，强制清理最旧的记录
    if (this.usageRecords.size > this.maxRecords) {
      const recordsArray = Array.from(this.usageRecords.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp);
      
      const toDelete = recordsArray.slice(0, recordsArray.length - this.maxRecords);
      toDelete.forEach(([requestId]) => {
        this.usageRecords.delete(requestId);
        deletedRecords++;
      });
    }
    
    if (process.env.NODE_ENV === 'development') {

    }
  }
  
  /**
   * 获取内存使用统计
   */
  getMemoryStats(): {
    totalRecords: number;
    userRecords: number;
    estimatedMemoryKB: number;
  } {
    const totalRecords = this.usageRecords.size;
    const userRecords = this.userSpending.size;
    
    // 估算内存使用（粗略计算）
    const avgRecordSize = 200; // 字节
    const avgUserSize = 100; // 字节
    const estimatedMemoryKB = Math.round(
      (totalRecords * avgRecordSize + userRecords * avgUserSize) / 1024
    );
    
    return {
      totalRecords,
      userRecords,
      estimatedMemoryKB
    };
  }
  
  /**
   * 手动触发清理
   */
  forceCleanup(): void {
    this.performCleanup();
  }
  
  /**
   * 销毁实例，清理资源
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.usageRecords.clear();
    this.userSpending.clear();
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
}

/**
 * 全局预算守护器实例
 */
let globalBudgetGuardian: BudgetGuardian | null = null;

/**
 * 获取或创建全局预算守护器
 */
export function getBudgetGuardian(): BudgetGuardian {
  if (!globalBudgetGuardian) {
    globalBudgetGuardian = new BudgetGuardian();
  }
  return globalBudgetGuardian;
}
