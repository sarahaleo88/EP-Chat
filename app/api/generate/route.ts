/**
 * 生成 API 路由
 * 处理提示生成请求
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDeepSeekClient } from '@/lib/deepseek';
import type { DeepSeekModel } from '@/lib/types';

// 请求体接口
interface GenerateRequest {
  prompt: string;
  model: DeepSeekModel;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}

/**
 * POST 请求处理器
 * @param request - 请求对象
 * @returns 响应
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body: GenerateRequest = await request.json();
    const {
      prompt,
      model = 'deepseek-chat',
      stream = true,
      temperature = 0.7,
      maxTokens = 4000,
    } = body;

    // 验证请求参数
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: '缺少有效的提示内容' },
        { status: 400 }
      );
    }

    if (prompt.length > 50000) {
      return NextResponse.json(
        { error: '提示内容过长，请精简后重试' },
        { status: 400 }
      );
    }

    // 验证模型类型
    const validModels: DeepSeekModel[] = ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'];
    if (!validModels.includes(model)) {
      return NextResponse.json(
        { error: '无效的模型类型' },
        { status: 400 }
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
              console.error('流处理错误:', error);
              const errorData = {
                error: {
                  message: error.message,
                  type: 'stream_error',
                },
              };
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify(errorData)}\n\n`)
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
          'Connection': 'keep-alive',
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
    console.error('生成 API 错误:', error);
    
    // 处理不同类型的错误
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'API 密钥配置错误，请检查环境变量' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: '请求频率过高，请稍后重试' },
          { status: 429 }
        );
      }
      
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'API 配额不足，请检查账户余额' },
          { status: 402 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
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
    return NextResponse.json(
      {
        status: 'error',
        message: '健康检查失败',
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
