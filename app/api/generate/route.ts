/**
 * 生成 API 路由 - DeepSeek v3.1 升级版
 * 集成能力协商、预算控制和续写功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDeepSeekClient } from '@/lib/deepseek';
import { getCapabilityManager } from '@/lib/model-capabilities';
import { getBudgetGuardian } from '@/lib/budget-guardian';
import { BudgetAwareContinuationEngine } from '@/lib/budget-aware-continuation';
import { formatUserFriendlyError } from '@/lib/error-handler';
import type { DeepSeekModel } from '@/lib/types';

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
  try {
    // 解析请求体
    const body: GenerateRequest = await request.json();
    const {
      prompt,
      model = 'deepseek-v3.1',
      stream = true,
      temperature = 0.7,
      maxTokens = 4000,
      userId = 'anonymous',
      requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      enableBudgetGuard = process.env.EP_LONG_OUTPUT_GUARD === 'on',
      enableContinuation = process.env.EP_AUTO_CONTINUATION === 'true',
    } = body;

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

    // 验证模型类型 - 支持v3.1
    const validModels: DeepSeekModel[] = [
      'deepseek-chat',
      'deepseek-coder',
      'deepseek-reasoner',
      'deepseek-v3.1',
    ];
    if (!validModels.includes(model)) {
      return NextResponse.json({ error: '无效的模型类型' }, { status: 400 });
    }

    // 获取API密钥
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API密钥未配置' },
        { status: 500 }
      );
    }

    // 初始化能力协商和预算系统
    const capabilityManager = getCapabilityManager(apiKey);
    const budgetGuardian = getBudgetGuardian();

    // 获取模型能力
    const capabilities = await capabilityManager.getCapabilities(model);

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
    const response = await client.sendPrompt(prompt, model, {
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
              const friendlyError = formatUserFriendlyError(error, model);
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
        model,
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
    const friendlyError = formatUserFriendlyError(error, model);

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
export async function GET() {
  try {
    // 检查环境变量
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          status: 'error',
          message: '缺少 DEEPSEEK_API_KEY 环境变量',
        },
        { status: 500 }
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

/**
 * 估算文本的token数量（简化版本）
 */
function estimateTokens(text: string): number {
  // 简化估算：中文约1.5字符/token，英文约4字符/token
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const otherChars = text.length - chineseChars;
  return Math.ceil(chineseChars / 1.5 + otherChars / 4);
}
