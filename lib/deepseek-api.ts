/**
 * DeepSeek API 集成服务
 * 处理与 DeepSeek API 的通信
 */

export interface DeepSeekMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface DeepSeekApiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface DeepSeekApiError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

/**
 * DeepSeek API 客户端类
 */
export class DeepSeekApiClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.deepseek.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 调用 DeepSeek Chat API
   * @param messages - 消息历史
   * @param model - 模型名称
   * @param options - 可选参数
   * @returns API 响应
   */
  async chat(
    messages: DeepSeekMessage[],
    model: string = 'deepseek-chat',
    options: {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      stream?: boolean;
    } = {}
  ): Promise<DeepSeekApiResponse> {
    const {
      temperature = 0.7,
      max_tokens = 2048,
      top_p = 0.95,
      stream = false,
    } = options;

    const requestBody = {
      model,
      messages,
      temperature,
      max_tokens,
      top_p,
      stream,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData: DeepSeekApiError = await response.json();
        throw new Error(
          errorData.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data: DeepSeekApiResponse = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while calling DeepSeek API');
    }
  }

  /**
   * 验证 API 密钥是否有效
   * @returns 是否有效
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.chat([{ role: 'user', content: 'Hello' }], 'deepseek-chat', {
        max_tokens: 10,
      });
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('API key validation failed:', error);
      }
      return false;
    }
  }
}

/**
 * 创建 DeepSeek API 客户端实例
 * @param apiKey - API 密钥
 * @returns 客户端实例
 */
export function createDeepSeekClient(apiKey: string): DeepSeekApiClient {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('API key is required');
  }
  return new DeepSeekApiClient(apiKey.trim());
}

/**
 * 格式化 API 错误消息
 * @param error - 错误对象
 * @returns 用户友好的错误消息
 */
export function formatApiError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('unauthorized') || message.includes('401')) {
      return '❌ API 密钥无效，请检查您的 DeepSeek API 密钥是否正确';
    }

    if (message.includes('rate limit') || message.includes('429')) {
      return '⏰ API 调用频率超限，请稍后再试';
    }

    if (message.includes('quota') || message.includes('insufficient')) {
      return '💳 API 配额不足，请检查您的账户余额';
    }

    if (message.includes('network') || message.includes('fetch')) {
      return '🌐 网络连接错误，请检查网络连接后重试';
    }

    if (message.includes('timeout')) {
      return '⏱️ 请求超时，请重试';
    }

    return `❌ API 调用失败: ${error.message}`;
  }

  return '❌ 未知错误，请重试';
}

/**
 * 将聊天消息转换为 DeepSeek API 格式
 * @param messages - 应用内消息格式
 * @returns DeepSeek API 消息格式
 */
export function convertToDeepSeekMessages(
  messages: Array<{
    type: 'user' | 'assistant';
    content: string;
  }>
): DeepSeekMessage[] {
  return messages.map(msg => ({
    role: msg.type === 'user' ? 'user' : 'assistant',
    content: msg.content,
  }));
}

/**
 * 估算消息的 token 数量（粗略估算）
 * @param text - 文本内容
 * @returns 估算的 token 数量
 */
export function estimateTokens(text: string): number {
  // 粗略估算：中文字符约 1.5 tokens，英文单词约 1.3 tokens
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = text
    .replace(/[\u4e00-\u9fff]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 0).length;

  return Math.ceil(chineseChars * 1.5 + englishWords * 1.3);
}

/**
 * 检查消息历史是否超过 token 限制
 * @param messages - 消息列表
 * @param maxTokens - 最大 token 数
 * @returns 是否超过限制
 */
export function isTokenLimitExceeded(
  messages: DeepSeekMessage[],
  maxTokens: number = 4000
): boolean {
  const totalTokens = messages.reduce(
    (sum, msg) => sum + estimateTokens(msg.content),
    0
  );
  return totalTokens > maxTokens;
}

/**
 * 截断消息历史以适应 token 限制
 * @param messages - 消息列表
 * @param maxTokens - 最大 token 数
 * @returns 截断后的消息列表
 */
export function truncateMessages(
  messages: DeepSeekMessage[],
  maxTokens: number = 4000
): DeepSeekMessage[] {
  if (!isTokenLimitExceeded(messages, maxTokens)) {
    return messages;
  }

  // 保留最后的消息，从前面开始删除
  const result: DeepSeekMessage[] = [];
  let currentTokens = 0;

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (!message) continue;
    const messageTokens = estimateTokens(message.content);
    if (currentTokens + messageTokens <= maxTokens) {
      result.unshift(message);
      currentTokens += messageTokens;
    } else {
      break;
    }
  }

  return result;
}
