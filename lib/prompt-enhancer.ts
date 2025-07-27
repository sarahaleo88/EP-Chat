/**
 * 提示词增强处理模块
 * 用于处理快速按钮与用户输入的组合增强
 */

/**
 * 增强提示词
 * @param rawPrompt 原始组合提示词（按钮提示词 + 用户输入）
 * @returns 增强后的提示词
 */
export async function enhancePrompt(rawPrompt: string): Promise<string> {
  try {
    // 基础清理和格式化
    const cleanedPrompt = rawPrompt.trim();

    if (!cleanedPrompt) {
      return rawPrompt;
    }

    // 简单的增强处理：确保提示词结构清晰
    const enhancedPrompt = formatPromptStructure(cleanedPrompt);

    // 这里可以扩展更复杂的增强逻辑，比如：
    // - 调用专门的增强 API
    // - 本地的语言处理
    // - 上下文优化等

    return enhancedPrompt;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Prompt enhancement failed, using original prompt:', error);
    }
    // 降级策略：返回原始提示词
    return rawPrompt;
  }
}

/**
 * 格式化提示词结构
 * @param prompt 原始提示词
 * @returns 格式化后的提示词
 */
function formatPromptStructure(prompt: string): string {
  // 分离按钮提示词和用户输入
  const lines = prompt.split('\n').filter(line => line.trim());

  if (lines.length <= 1) {
    return prompt;
  }

  // 查找分隔点（通常是空行或明显的内容分界）
  let separatorIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() || '';
    // 如果发现用户输入的开始标志，记录分隔点
    if (
      line &&
      !line.endsWith('：') &&
      !line.endsWith(':') &&
      !line.includes('请') &&
      !line.includes('帮我') &&
      i > 0
    ) {
      separatorIndex = i;
      break;
    }
  }

  if (separatorIndex > 0) {
    const buttonPrompt = lines.slice(0, separatorIndex).join('\n');
    const userInput = lines.slice(separatorIndex).join('\n');

    // 格式化组合
    return `${buttonPrompt}\n\n**用户需求：**\n${userInput}`;
  }

  return prompt;
}

/**
 * 检查提示词是否需要增强
 * @param prompt 提示词
 * @returns 是否需要增强
 */
export function shouldEnhancePrompt(prompt: string): boolean {
  const trimmed = prompt.trim();

  // 基本检查：长度和内容
  if (trimmed.length < 10) {
    return false;
  }

  // 检查是否包含结构化内容
  const hasStructure = trimmed.includes('\n') && trimmed.length > 50;

  return hasStructure;
}

/**
 * 获取增强统计信息
 * @param originalPrompt 原始提示词
 * @param enhancedPrompt 增强后的提示词
 * @returns 增强统计
 */
export function getEnhancementStats(
  originalPrompt: string,
  enhancedPrompt: string
) {
  return {
    originalLength: originalPrompt.length,
    enhancedLength: enhancedPrompt.length,
    improvement: enhancedPrompt.length - originalPrompt.length,
    hasStructure: enhancedPrompt.includes('**用户需求：**'),
    timestamp: new Date().toISOString(),
  };
}
