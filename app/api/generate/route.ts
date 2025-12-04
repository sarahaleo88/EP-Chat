/**
 * 生成 API 路由 - DeepSeek v3.1 升级版
 * 集成能力协商、预算控制和续写功能
 */

const DEFAULT_MODEL = process.env.DEFAULT_MODEL ?? "deepseek-v3.1";

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDeepSeekClient } from '@/lib/deepseek';
import { getCapabilityManager } from '@/lib/model-capabilities';
import { getBudgetGuardian } from '@/lib/budget-guardian';
// BudgetAwareContinuationEngine reserved for future continuation feature
// import { BudgetAwareContinuationEngine } from '@/lib/budget-aware-continuation';
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
  systemPrompt?: string; // Agent 模式：可选的系统提示词
  mode?: 'chat' | 'agent'; // 模式：chat=快速路径，agent=完整增强路径
}

// 导入 DeepSeekClient 类型
import type { DeepSeekClient } from '@/lib/deepseek';

/**
 * 创建流式响应（复用逻辑，避免代码重复）
 */
function createStreamResponse(
  client: DeepSeekClient,
  response: Response,
  model: DeepSeekModel
): Response {
  const encoder = new TextEncoder();
  const DONE_MESSAGE = encoder.encode('data: [DONE]\n\n');
  const STOP_MESSAGE = encoder.encode('data: {"choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\n');

  const encodeChunk = (content: string): Uint8Array => {
    const escaped = content
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    return encoder.encode(`data: {"choices":[{"index":0,"delta":{"content":"${escaped}"},"finish_reason":null}]}\n\n`);
  };

  const readable = new ReadableStream({
    start(controller) {
      client.handleStreamResponse(
        response,
        (content: string) => {
          controller.enqueue(encodeChunk(content));
        },
        () => {
          controller.enqueue(STOP_MESSAGE);
          controller.enqueue(DONE_MESSAGE);
          controller.close();
        },
        (error: Error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('流处理错误:', error);
          }
          const friendlyError = formatUserFriendlyError(error, model);
          const errorData = {
            error: {
              message: `${friendlyError.title}: ${friendlyError.message}`,
              type: 'stream_error',
              suggestion: friendlyError.suggestion,
              retryable: friendlyError.retryable,
            },
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
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
      maxTokens = 8192, // DeepSeek API limit: [1, 8192]
      userId = 'anonymous',
      requestId = `req_${Date.now()}_${randomUUID().slice(0, 8)}`,
      systemPrompt, // Agent 模式：可选的系统提示词
      mode = 'chat', // 默认为 chat 模式（快速路径）
    } = body;

    // 根据模式决定是否启用预算守护和续写
    // Chat 模式：跳过能力协商和预算检查，实现快速响应
    // Agent 模式：启用完整的增强逻辑
    const isAgentMode = mode === 'agent';
    const enableBudgetGuard = isAgentMode && process.env.EP_LONG_OUTPUT_GUARD === 'on';
    // Reserved for future auto-continuation feature (see BudgetAwareContinuationEngine)
    const _enableContinuation = isAgentMode && process.env.EP_AUTO_CONTINUATION === 'true';
    void _enableContinuation; // Suppress unused variable warning

    model = requestModel as DeepSeekModel; // Set the model from request

    // 清理 systemPrompt（去除空白）
    const cleanedSystemPrompt = systemPrompt?.trim() || undefined;

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

    // 验证最大token数 - DeepSeek API limit is [1, 8192]
    if (typeof maxTokens !== 'number' || maxTokens < 1 || maxTokens > 8192) {
      return NextResponse.json(
        { error: '最大token数必须在1-8192之间' },
        { status: 400 }
      );
    }

    // 验证模型类型 - 使用 Zod 运行时验证
    const modelValidation = safeValidateDeepSeekModel(model);
    if (!modelValidation.success) {
      return NextResponse.json(
        {
          error: '无效的模型类型',
          details: modelValidation.error.issues.map((e: { message: string }) => e.message).join(', ')
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

    // 获取 DeepSeek 客户端（始终需要）
    const client = getDeepSeekClient(apiKey);

    // 构建发送选项
    const sendOptions: {
      stream: boolean;
      temperature: number;
      maxTokens: number;
      systemPrompt?: string;
    } = {
      stream,
      temperature,
      maxTokens,
    };

    // 仅在 systemPrompt 存在时添加（避免 undefined 类型错误）
    if (cleanedSystemPrompt) {
      sendOptions.systemPrompt = cleanedSystemPrompt;
    }

    // ========== 模式分流 ==========
    // Chat 模式：快速路径，直接调用 DeepSeek API，跳过能力协商和预算检查
    // Agent 模式：完整路径，包含能力协商、预算检查等增强功能

    if (!isAgentMode) {
      // ========== Chat 模式：快速路径 ==========
      // 直接调用 DeepSeek API，无额外处理
      const response = await client.sendPrompt(prompt, validatedModel, sendOptions);

      // 流式响应
      if (stream) {
        return createStreamResponse(client, response, validatedModel);
      } else {
        // 非流式响应
        const content = await client.getNonStreamResponse(response);
        return NextResponse.json({
          success: true,
          data: content,
          model: validatedModel,
          mode: 'chat',
          usage: {
            prompt_tokens: Math.ceil(prompt.length / 4),
            completion_tokens: Math.ceil(content.length / 4),
            total_tokens: Math.ceil((prompt.length + content.length) / 4),
          },
        });
      }
    }

    // ========== Agent 模式：完整路径 ==========
    // 初始化管理器
    const capabilityManager = getCapabilityManager(apiKey);
    const budgetGuardian = getBudgetGuardian();

    // 并行执行：能力获取 + token 估算
    const [capabilities, inputTokens] = await Promise.all([
      capabilityManager.getCapabilities(validatedModel),
      Promise.resolve(estimateTokens(prompt)),
    ]);

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

    // Agent 模式：发送请求到 DeepSeek API
    const response = await client.sendPrompt(prompt, validatedModel, sendOptions);

    // 流式响应 - 使用复用的辅助函数
    if (stream) {
      return createStreamResponse(client, response, validatedModel);
    } else {
      // 非流式响应
      const content = await client.getNonStreamResponse(response);

      return NextResponse.json({
        success: true,
        data: content,
        model: validatedModel,
        mode: 'agent',
        usage: {
          prompt_tokens: Math.ceil(prompt.length / 4),
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

