/**
 * 预飞行检查API端点
 * 提供成本预估和预算门控功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCapabilityManager } from '@/lib/model-capabilities';
import { getBudgetGuardian } from '@/lib/budget-guardian';
import { getApiKeyFromSession } from '@/lib/session-manager';
import { safeValidateDeepSeekModel, type DeepSeekModel } from '@/lib/types';

interface PreflightRequest {
  model: string;
  inputTokens: number;
  targetOutputTokens: number;
  reasoningTokens?: number;
  userId: string;
}

interface PreflightResponse {
  allowed: boolean;
  costEstimate: {
    inputCost: number;
    outputCost: number;
    reasoningCost: number;
    totalCost: number;
    currency: string;
  };
  budgetStatus: {
    withinRequestLimit: boolean;
    withinUserLimit: boolean;
    withinSiteLimit: boolean;
    userSpentToday: number;
    siteSpentThisHour: number;
    remainingBudget: {
      request: number;
      userDaily: number;
      siteHourly: number;
    };
  };
  recommendations?: {
    recommendedOutputTokens?: number;
    suggestedActions?: string[];
    alternativeStrategies?: string[];
  };
  reason?: string;
}

/**
 * POST /api/preflight - 预飞行检查
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body: PreflightRequest = await request.json();
    const {
      model = 'deepseek-v3.1',
      inputTokens,
      targetOutputTokens,
      reasoningTokens = 0,
      userId,
    } = body;

    // 验证请求参数
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: '缺少有效的用户ID' },
        { status: 400 }
      );
    }

    if (!inputTokens || !targetOutputTokens || inputTokens < 0 || targetOutputTokens < 0) {
      return NextResponse.json(
        { error: '无效的token数量参数' },
        { status: 400 }
      );
    }

    // 验证模型类型 - 使用 Zod 运行时验证
    const modelValidation = safeValidateDeepSeekModel(model);
    if (!modelValidation.success) {
      return NextResponse.json(
        {
          error: '无效的模型类型',
          details: modelValidation.error.issues.map(e => e.message).join(', ')
        },
        { status: 400 }
      );
    }
    const validatedModel = modelValidation.data;

    // 获取API密钥 - 优先从会话获取，回退到环境变量
    let apiKey = getApiKeyFromSession(request);

    if (!apiKey) {
      apiKey = process.env.DEEPSEEK_API_KEY || null;
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API密钥未配置。请在设置中配置您的DeepSeek API密钥。' },
        { status: 401 }
      );
    }

    // 获取模型能力
    const capabilityManager = getCapabilityManager(apiKey);
    const capabilities = await capabilityManager.getCapabilities(validatedModel);

    // 获取预算守护器
    const budgetGuardian = getBudgetGuardian();

    // 执行预飞行检查
    const preflightResult = await budgetGuardian.preflightCheck(
      userId,
      capabilities,
      inputTokens,
      targetOutputTokens,
      reasoningTokens
    );

    // 获取预算状态
    const budgetStatus = budgetGuardian.getBudgetStatus(userId);

    // 计算剩余预算
    const requestLimit = parseFloat(process.env.BUDGET_REQ_USD || '0.40');
    const userDailyLimit = parseFloat(process.env.BUDGET_USER_DAILY_USD || '2.50');
    const siteHourlyLimit = parseFloat(process.env.BUDGET_SITE_HOURLY_USD || '8.00');

    const remainingBudget = {
      request: requestLimit - preflightResult.costBreakdown.estimated.totalCost,
      userDaily: userDailyLimit - budgetStatus.userSpentTodayUSD,
      siteHourly: siteHourlyLimit - budgetStatus.siteSpentThisHourUSD,
    };

    // 构建响应
    const response: PreflightResponse = {
      allowed: preflightResult.allowed,
      costEstimate: {
        inputCost: preflightResult.costBreakdown.estimated.inputCost,
        outputCost: preflightResult.costBreakdown.estimated.outputCost,
        reasoningCost: preflightResult.costBreakdown.estimated.reasoningCost,
        totalCost: preflightResult.costBreakdown.estimated.totalCost,
        currency: 'USD',
      },
      budgetStatus: {
        withinRequestLimit: preflightResult.costBreakdown.withinRequestLimit,
        withinUserLimit: preflightResult.costBreakdown.withinUserLimit,
        withinSiteLimit: preflightResult.costBreakdown.withinSiteLimit,
        userSpentToday: budgetStatus.userSpentTodayUSD,
        siteSpentThisHour: budgetStatus.siteSpentThisHourUSD,
        remainingBudget,
      },
    };

    // 添加建议和原因
    if (!preflightResult.allowed) {
      if (preflightResult.reason) {
        response.reason = preflightResult.reason;
      }
      const recommendations: any = {
        alternativeStrategies: generateAlternativeStrategies(preflightResult),
      };

      if (preflightResult.recommendedOutputTokens !== undefined) {
        recommendations.recommendedOutputTokens = preflightResult.recommendedOutputTokens;
      }

      if (preflightResult.suggestedActions !== undefined) {
        recommendations.suggestedActions = preflightResult.suggestedActions;
      }

      response.recommendations = recommendations;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Preflight check error:', error);
    
    return NextResponse.json(
      {
        error: '预飞行检查失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/preflight - 获取预算状态
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: '缺少用户ID参数' },
        { status: 400 }
      );
    }

    // 获取预算守护器
    const budgetGuardian = getBudgetGuardian();
    const budgetStatus = budgetGuardian.getBudgetStatus(userId);

    // 获取使用记录
    const recentUsage = budgetGuardian.getUsageRecords(userId, 10);

    // 计算预算限制
    const limits = {
      requestMaxUSD: parseFloat(process.env.BUDGET_REQ_USD || '0.40'),
      userDailyMaxUSD: parseFloat(process.env.BUDGET_USER_DAILY_USD || '2.50'),
      siteHourlyMaxUSD: parseFloat(process.env.BUDGET_SITE_HOURLY_USD || '8.00'),
    };

    const response = {
      budgetStatus,
      limits,
      recentUsage: recentUsage.map(record => ({
        requestId: record.requestId,
        timestamp: record.timestamp,
        estimatedCost: record.estimated.totalCost,
        actualCost: record.actual?.totalCost,
        approved: record.approved,
        completed: record.completed,
      })),
      remainingBudget: {
        userDaily: limits.userDailyMaxUSD - budgetStatus.userSpentTodayUSD,
        siteHourly: limits.siteHourlyMaxUSD - budgetStatus.siteSpentThisHourUSD,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Budget status error:', error);
    
    return NextResponse.json(
      {
        error: '获取预算状态失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

/**
 * 生成替代策略建议
 */
function generateAlternativeStrategies(preflightResult: any): string[] {
  const strategies: string[] = [];

  if (!preflightResult.costBreakdown.withinRequestLimit) {
    strategies.push('分批处理：将长文本分成多个较短的请求');
    strategies.push('降低输出长度：减少目标输出token数');
  }

  if (!preflightResult.costBreakdown.withinUserLimit) {
    strategies.push('明日重试：等待用户日预算重置');
    strategies.push('升级配额：联系管理员提高用户预算限制');
  }

  if (!preflightResult.costBreakdown.withinSiteLimit) {
    strategies.push('稍后重试：等待全站时预算重置');
    strategies.push('使用摘要模式：生成内容大纲而非完整内容');
  }

  // 通用策略
  strategies.push('使用模板：基于预定义模板生成内容');
  strategies.push('缓存复用：查看是否有类似的已生成内容');

  return strategies;
}

/**
 * OPTIONS 请求处理器（CORS 预检）
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
