/**
 * 生成 API 路由 - DeepSeek v3.1 升级版
 * 集成能力协商、预算控制和续写功能
 */

const DEFAULT_MODEL = process.env.DEFAULT_MODEL ?? "deepseek-v3.1";

import { NextRequest, NextResponse } from 'next/server';
import { getDeepSeekClient } from '@/lib/deepseek';
import { getCapabilityManager } from '@/lib/model-capabilities';
import { getBudgetGuardian } from '@/lib/budget-guardian';
import { BudgetAwareContinuationEngine } from '@/lib/budget-aware-continuation';
import { formatUserFriendlyError } from '@/lib/error-handler';
import { estimateTokens } from '@/lib/utils';
import type { DeepSeekModel } from '@/lib/types';
import { validateDeepSeekModel, safeValidateDeepSeekModel } from '@/lib/types';
import { getApiKeyFromSession } from '@/lib/session-manager';
import { validateCSRFToken } from '@/lib/csrf';

// 请求体接口
interface GenerateRequest {
  prompt: string;
  model: DeepSeekModel;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  userId?: string;
  requestId?: string;
  enableBudgetGuard?: boolean;
  enableContinuation?: boolean;
}

/**
 * POST 请求处理器 - v3.1 升级版
 * @param request - 请求对象
 * @returns 响应
 */
export async function POST(request: NextRequest) {
  let model: DeepSeekModel = DEFAULT_MODEL as DeepSeekModel; // Default model, will be overridden by request body
  let validatedModel: DeepSeekModel = model; // Will be set after validation

  try {
    // CSRF protection is handled by middleware, but we can add additional validation here if needed
    // The middleware will have already validated the CSRF token for POST requests
    // 解析请求体
    const body: GenerateRequest = await request.json();
    const {
      prompt,
      model: requestModel = DEFAULT_MODEL as DeepSeekModel,
      stream = true,
      temperature = 0.7,
      maxTokens = 128000, // 128k tokens
      userId = 'anonymous',
      requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      enableBudgetGuard = process.env.EP_LONG_OUTPUT_GUARD === 'on',
      enableContinuation = process.env.EP_AUTO_CONTINUATION === 'true',
    } = body;

    model = requestModel as DeepSeekModel; // Set the model from request

    // 验证请求参数
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: '缺少有效的提示内容' },
        { status: 400 }
      );
    }

    if (prompt.length > 200000) { // 增加到200K字符支持长输入
      return NextResponse.json(
        { error: '提示内容过长，请精简后重试' },
        { status: 400 }
      );
    }

    // 验证温度参数
    if (typeof temperature !== 'number' || temperature < 0 || temperature > 2) {
      return NextResponse.json(
        { error: '温度参数必须在0-2之间' },
        { status: 400 }
      );
    }

    // 验证最大token数
    if (typeof maxTokens !== 'number' || maxTokens < 1 || maxTokens > 200000) {
      return NextResponse.json(
        { error: '最大token数必须在1-200000之间' },
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
    validatedModel = modelValidation.data;

    // 获取API密钥 - 优先从会话获取，回退到环境变量
    let apiKey = getApiKeyFromSession(request);

    // 如果会话中没有API密钥，回退到环境变量（向后兼容）
    if (!apiKey) {
      apiKey = process.env.DEEPSEEK_API_KEY || null;
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API密钥未配置。请在设置中配置您的DeepSeek API密钥。' },
        { status: 401 }
      );
    }

    // 初始化能力协商和预算系统
    const capabilityManager = getCapabilityManager(apiKey);
    const budgetGuardian = getBudgetGuardian();

    // 获取模型能力
    const capabilities = await capabilityManager.getCapabilities(validatedModel);

    // 估算输入token数
    const inputTokens = estimateTokens(prompt);

    // 计算最优输出token数
    const optimalMaxTokens = capabilityManager.calculateOptimalMaxTokens(
      capabilities,
      inputTokens,
      maxTokens
    );

    // 预算检查（如果启用）
    if (enableBudgetGuard) {
      const preflightResult = await budgetGuardian.preflightCheck(
        userId,
        capabilities,
        inputTokens,
        optimalMaxTokens
      );

      if (!preflightResult.allowed) {
        return NextResponse.json(
          {
            error: '预算限制',
            reason: preflightResult.reason,
            costEstimate: preflightResult.costBreakdown.estimated,
            recommendations: {
              recommendedOutputTokens: preflightResult.recommendedOutputTokens,
              suggestedActions: preflightResult.suggestedActions,
            },
          },
          { status: 402 } // Payment Required
        );
      }

      // 记录使用情况
      budgetGuardian.recordUsage(
        requestId,
        userId,
        preflightResult.costBreakdown.estimated,
        true
      );
    }

    // 获取 DeepSeek 客户端
    const client = getDeepSeekClient();

    // 发送请求到 DeepSeek API
    const response = await client.sendPrompt(prompt, validatedModel, {
      stream,
      temperature,
      maxTokens,
    });

    // 流式响应
    if (stream) {
      // 创建可读流
      const readable = new ReadableStream({
        start(controller) {
          client.handleStreamResponse(
            response,
            // onChunk
            (content: string) => {
              const data = {
                choices: [
                  {
                    index: 0,
                    delta: { content },
                    finish_reason: null,
                  },
                ],
              };
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
              );
            },
            // onComplete
            () => {
              const data = {
                choices: [
                  {
                    index: 0,
                    delta: {},
                    finish_reason: 'stop',
                  },
                ],
              };
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
              );
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
              controller.close();
            },
            // onError
            (error: Error) => {
              if (process.env.NODE_ENV === 'development') {
                console.error('流处理错误:', error);
              }
              // 使用用户友好的错误格式化
              const friendlyError = formatUserFriendlyError(error, validatedModel);
              const errorData = {
                error: {
                  message: `${friendlyError.title}: ${friendlyError.message}`,
                  type: 'stream_error',
                  suggestion: friendlyError.suggestion,
                  retryable: friendlyError.retryable,
                },
              };
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify(errorData)}\n\n`
                )
              );
              controller.close();
            }
          );
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    } else {
      // 非流式响应
      const content = await client.getNonStreamResponse(response);

      return NextResponse.json({
        success: true,
        data: content,
        model: validatedModel,
        usage: {
          prompt_tokens: Math.ceil(prompt.length / 4), // 粗略估算
          completion_tokens: Math.ceil(content.length / 4),
          total_tokens: Math.ceil((prompt.length + content.length) / 4),
        },
      });
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('生成 API 错误:', error);
    }

    // 使用用户友好的错误格式化
    const friendlyError = formatUserFriendlyError(error, validatedModel);

    // 根据错误类型返回适当的HTTP状态码
    let statusCode = 500;
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('unauthorized')) {
        statusCode = 401;
      } else if (error.message.includes('rate limit')) {
        statusCode = 429;
      } else if (error.message.includes('quota')) {
        statusCode = 402;
      }
    }

    return NextResponse.json({
      error: friendlyError.title,
      message: friendlyError.message,
      suggestion: friendlyError.suggestion,
      retryable: friendlyError.retryable
    }, { status: statusCode });
  }
}

/**
 * OPTIONS 请求处理器（CORS 预检）
 * @returns 响应
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * GET 请求处理器（健康检查）
 * @returns 响应
 */
export async function GET(request: NextRequest) {
  try {
    // 检查API密钥 - 优先从会话获取，回退到环境变量
    let apiKey = getApiKeyFromSession(request);

    if (!apiKey) {
      apiKey = process.env.DEEPSEEK_API_KEY || null;
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'API密钥未配置。请在设置中配置您的DeepSeek API密钥。',
        },
        { status: 401 }
      );
    }

    // 简单的健康检查
    return NextResponse.json({
      status: 'ok',
      message: 'EP 生成 API 运行正常',
      timestamp: new Date().toISOString(),
      models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
    });
  } catch (error) {
    const friendlyError = formatUserFriendlyError(error);
    return NextResponse.json(
      {
        status: 'error',
        message: '健康检查失败',
        error: friendlyError.title,
        details: friendlyError.message,
      },
      { status: 500 }
    );
  }
}

