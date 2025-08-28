/**
 * DeepSeek API 客户端
 * 提供与 DeepSeek API 的集成功能
 */

import type { DeepSeekModel, StreamResponse } from './types';
import { getRequiredEnv } from './utils';

// DeepSeek API 配置
const DEEPSEEK_API_BASE = 'https://api.deepseek.com';
const DEEPSEEK_API_VERSION = 'v1';

/**
 * DeepSeek API 客户端类
 */
export class DeepSeekClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = this.validateApiKeyFormat(apiKey || getRequiredEnv('DEEPSEEK_API_KEY'));
    this.baseUrl = `${DEEPSEEK_API_BASE}/${DEEPSEEK_API_VERSION}`;
  }

  /**
   * 验证API密钥格式
   */
  private validateApiKeyFormat(apiKey: string): string {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('DeepSeek API 密钥无效或为空');
    }
    if (!apiKey.startsWith('sk-')) {
      throw new Error('DeepSeek API 密钥格式不正确，应以sk-开头');
    }
    return apiKey;
  }

  /**
   * 验证和清理输入提示
   */
  private validatePrompt(prompt: string): string {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('提示内容无效或为空');
    }
    const cleanedPrompt = prompt.trim();
    if (cleanedPrompt.length === 0) {
      throw new Error('提示内容不能为空');
    }
    if (cleanedPrompt.length > 200000) {
      throw new Error('提示内容过长，请控制在200,000字符以内');
    }
    return cleanedPrompt;
  }

  /**
   * 发送提示到 DeepSeek API
   * @param prompt - 提示文本
   * @param model - 模型类型
   * @param options - 请求选项
   * @returns 响应流或文本
   */
  async sendPrompt(
    prompt: string,
    model: DeepSeekModel = 'deepseek-chat',
    options: {
      stream?: boolean;
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      timeout?: number;
    } = {}
  ): Promise<Response> {
    // 输入验证
    const validatedPrompt = this.validatePrompt(prompt);
    
    const {
      stream = true,
      temperature = 0.7,
      maxTokens = 32000, // 增加到32K，但加入验证
      topP = 0.9,
      timeout = 60000, // 60秒超时
    } = options;

    // 参数验证
    if (temperature < 0 || temperature > 2) {
      throw new Error('temperature参数必须在0-2之间');
    }
    if (maxTokens < 1 || maxTokens > 128000) {
      throw new Error('maxTokens参数必须在1-128000之间');
    }
    if (topP < 0 || topP > 1) {
      throw new Error('topP参数必须在0-1之间');
    }

    const requestBody = {
      model,
      messages: [
        {
          role: 'user',
          content: validatedPrompt,
        },
      ],
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      stream,
      frequency_penalty: 0,
      presence_penalty: 0,
    };

    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': stream ? 'text/event-stream' : 'application/json',
          'User-Agent': 'EP-Chat/1.0',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // 检查响应状态
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        
        switch (response.status) {
          case 401:
            throw new Error('API密钥无效，请检查配置');
          case 429:
            throw new Error('请求过于频繁，请稍后重试');
          case 402:
            throw new Error('API配额不足，请检查账户余额');
          case 503:
            throw new Error('DeepSeek服务暂时不可用，请稍后重试');
          default:
            throw new Error(`DeepSeek API请求失败 (${response.status}): ${errorMessage}`);
        }
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`请求超时（${timeout}ms），请稍后重试`);
      }
      throw error;
    }

  }

  /**
   * 处理流式响应
   * @param response - 响应对象
   * @param onChunk - 数据块处理回调
   * @param onComplete - 完成回调
   * @param onError - 错误回调
   */
  async handleStreamResponse(
    response: Response,
    onChunk: (content: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    if (!response.body) {
      onError(new Error('响应体为空'));
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          onComplete();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (trimmedLine === '') {continue;}
          if (trimmedLine === 'data: [DONE]') {
            onComplete();
            return;
          }

          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.slice(6);
              const data: StreamResponse = JSON.parse(jsonStr);

              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }

              if (data.choices?.[0]?.finish_reason) {
                onComplete();
                return;
              }
            } catch (parseError) {
              if (process.env.NODE_ENV === 'development') {
                console.warn('解析流数据失败:', parseError);
              }
            }
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error('流处理失败'));
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 获取非流式响应
   * @param response - 响应对象
   * @returns 响应文本
   */
  async getNonStreamResponse(response: Response): Promise<string> {
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * 验证 API 密钥
   * @returns 是否有效
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await this.sendPrompt('Hello', 'deepseek-chat', {
        stream: false,
        maxTokens: 10,
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 获取模型列表
   * @returns 可用模型列表
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('获取模型列表失败');
      }

      const data = await response.json();
      return data.data?.map((model: { id: string }) => model.id) || [];
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('获取模型列表失败:', error);
      }
      return ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'];
    }
  }
}

// 默认客户端实例
let defaultClient: DeepSeekClient | null = null;

/**
 * 获取默认 DeepSeek 客户端实例
 * @returns DeepSeek 客户端实例
 */
export function getDeepSeekClient(): DeepSeekClient {
  if (!defaultClient) {
    defaultClient = new DeepSeekClient();
  }
  return defaultClient;
}

/**
 * 便捷函数：发送提示
 * @param prompt - 提示文本
 * @param model - 模型类型
 * @param options - 选项
 * @returns 响应
 */
export async function sendPrompt(
  prompt: string,
  model: DeepSeekModel = 'deepseek-chat',
  options?: Parameters<DeepSeekClient['sendPrompt']>[2]
): Promise<Response> {
  const client = getDeepSeekClient();
  return client.sendPrompt(prompt, model, options);
}
