/**
 * Prometheus 监控指标集成
 * 提供成本、性能、错误率等关键指标的监控
 */

import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// 启用默认指标收集
if (process.env.PROM_ENABLED === 'true') {
  collectDefaultMetrics({ register });
}

// =============================================================================
// 请求相关指标
// =============================================================================

/**
 * 请求总数计数器
 */
export const requestsTotal = new Counter({
  name: 'ep_chat_requests_total',
  help: 'Total number of requests',
  labelNames: ['model', 'user_id', 'status', 'budget_guard_enabled'],
  registers: [register],
});

/**
 * 请求持续时间直方图
 */
export const requestDuration = new Histogram({
  name: 'ep_chat_request_duration_seconds',
  help: 'Request duration in seconds',
  labelNames: ['model', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300],
  registers: [register],
});

/**
 * 活动流数量
 */
export const activeStreams = new Gauge({
  name: 'ep_chat_active_streams',
  help: 'Number of active streaming connections',
  registers: [register],
});

// =============================================================================
// Token 和成本相关指标
// =============================================================================

/**
 * 输入token计数器
 */
export const inputTokensTotal = new Counter({
  name: 'ep_chat_input_tokens_total',
  help: 'Total input tokens processed',
  labelNames: ['model', 'user_id'],
  registers: [register],
});

/**
 * 输出token计数器
 */
export const outputTokensTotal = new Counter({
  name: 'ep_chat_output_tokens_total',
  help: 'Total output tokens generated',
  labelNames: ['model', 'user_id'],
  registers: [register],
});

/**
 * 推理token计数器（如果支持）
 */
export const reasoningTokensTotal = new Counter({
  name: 'ep_chat_reasoning_tokens_total',
  help: 'Total reasoning tokens used',
  labelNames: ['model', 'user_id'],
  registers: [register],
});

/**
 * 估算成本计数器
 */
export const estimatedCostTotal = new Counter({
  name: 'ep_chat_estimated_cost_usd_total',
  help: 'Total estimated cost in USD',
  labelNames: ['model', 'user_id'],
  registers: [register],
});

/**
 * 实际成本计数器
 */
export const actualCostTotal = new Counter({
  name: 'ep_chat_actual_cost_usd_total',
  help: 'Total actual cost in USD',
  labelNames: ['model', 'user_id'],
  registers: [register],
});

// =============================================================================
// 预算和限流相关指标
// =============================================================================

/**
 * 预算熔断计数器
 */
export const budgetCircuitBreaker = new Counter({
  name: 'ep_chat_budget_circuit_breaker_total',
  help: 'Total budget circuit breaker triggers',
  labelNames: ['reason', 'user_id'],
  registers: [register],
});

/**
 * 用户日消费
 */
export const userDailySpending = new Gauge({
  name: 'ep_chat_user_daily_spending_usd',
  help: 'User daily spending in USD',
  labelNames: ['user_id'],
  registers: [register],
});

/**
 * 全站时消费
 */
export const siteHourlySpending = new Gauge({
  name: 'ep_chat_site_hourly_spending_usd',
  help: 'Site hourly spending in USD',
  registers: [register],
});

/**
 * 速率限制触发计数器
 */
export const rateLimitHits = new Counter({
  name: 'ep_chat_rate_limit_hits_total',
  help: 'Total rate limit hits',
  labelNames: ['type', 'user_id'],
  registers: [register],
});

// =============================================================================
// 续写相关指标
// =============================================================================

/**
 * 续写次数计数器
 */
export const continuationsTotal = new Counter({
  name: 'ep_chat_continuations_total',
  help: 'Total number of continuations',
  labelNames: ['model', 'strategy', 'user_id'],
  registers: [register],
});

/**
 * 续写失败计数器
 */
export const continuationFailures = new Counter({
  name: 'ep_chat_continuation_failures_total',
  help: 'Total continuation failures',
  labelNames: ['model', 'reason', 'user_id'],
  registers: [register],
});

/**
 * 续写段数直方图
 */
export const continuationSegments = new Histogram({
  name: 'ep_chat_continuation_segments',
  help: 'Number of continuation segments per request',
  labelNames: ['model'],
  buckets: [1, 2, 3, 4, 5, 6, 8, 10],
  registers: [register],
});

// =============================================================================
// 错误相关指标
// =============================================================================

/**
 * 错误计数器
 */
export const errorsTotal = new Counter({
  name: 'ep_chat_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'model', 'user_id'],
  registers: [register],
});

/**
 * API错误计数器
 */
export const apiErrorsTotal = new Counter({
  name: 'ep_chat_api_errors_total',
  help: 'Total API errors',
  labelNames: ['provider', 'status_code', 'model'],
  registers: [register],
});

// =============================================================================
// 模型能力相关指标
// =============================================================================

/**
 * 能力探测成功计数器
 */
export const capabilityDetectionSuccess = new Counter({
  name: 'ep_chat_capability_detection_success_total',
  help: 'Successful capability detections',
  labelNames: ['model'],
  registers: [register],
});

/**
 * 能力探测失败计数器
 */
export const capabilityDetectionFailure = new Counter({
  name: 'ep_chat_capability_detection_failure_total',
  help: 'Failed capability detections',
  labelNames: ['model'],
  registers: [register],
});

/**
 * 模型上下文窗口大小
 */
export const modelContextWindow = new Gauge({
  name: 'ep_chat_model_context_window_tokens',
  help: 'Model context window size in tokens',
  labelNames: ['model', 'source'],
  registers: [register],
});

// =============================================================================
// 辅助函数
// =============================================================================

/**
 * 记录请求开始
 */
export function recordRequestStart(
  model: string,
  userId: string,
  budgetGuardEnabled: boolean
): () => void {
  const startTime = Date.now();
  
  activeStreams.inc();
  
  return () => {
    const duration = (Date.now() - startTime) / 1000;
    requestDuration.observe({ model, status: 'success' }, duration);
    activeStreams.dec();
  };
}

/**
 * 记录请求完成
 */
export function recordRequestComplete(
  model: string,
  userId: string,
  status: 'success' | 'error' | 'budget_blocked',
  budgetGuardEnabled: boolean
): void {
  requestsTotal.inc({
    model,
    user_id: userId,
    status,
    budget_guard_enabled: budgetGuardEnabled.toString(),
  });
}

/**
 * 记录token使用
 */
export function recordTokenUsage(
  model: string,
  userId: string,
  tokens: {
    input: number;
    output: number;
    reasoning?: number;
  }
): void {
  inputTokensTotal.inc({ model, user_id: userId }, tokens.input);
  outputTokensTotal.inc({ model, user_id: userId }, tokens.output);
  
  if (tokens.reasoning && tokens.reasoning > 0) {
    reasoningTokensTotal.inc({ model, user_id: userId }, tokens.reasoning);
  }
}

/**
 * 记录成本
 */
export function recordCost(
  model: string,
  userId: string,
  cost: {
    estimated: number;
    actual?: number;
  }
): void {
  estimatedCostTotal.inc({ model, user_id: userId }, cost.estimated);
  
  if (cost.actual !== undefined) {
    actualCostTotal.inc({ model, user_id: userId }, cost.actual);
  }
}

/**
 * 记录预算状态
 */
export function recordBudgetStatus(
  userId: string,
  userDailySpent: number,
  siteHourlySpent: number
): void {
  userDailySpending.set({ user_id: userId }, userDailySpent);
  siteHourlySpending.set(siteHourlySpent);
}

/**
 * 记录续写
 */
export function recordContinuation(
  model: string,
  userId: string,
  strategy: string,
  segments: number,
  success: boolean
): void {
  continuationsTotal.inc({ model, strategy, user_id: userId });
  continuationSegments.observe({ model }, segments);
  
  if (!success) {
    continuationFailures.inc({ model, reason: 'unknown', user_id: userId });
  }
}

/**
 * 获取指标注册表
 */
export function getMetricsRegistry() {
  return register;
}

/**
 * 清除所有指标
 */
export function clearMetrics(): void {
  register.clear();
}
