/**
 * 提示生成器
 * 负责将用户输入和模板配置转换为 Claude Code 提示
 */

import type {
  EpPromptSpec,
  TemplateConfig,
  Language,
  Scenario,
  PromptGenerationOptions,
} from './types';
import { estimateTokens } from './utils';

// 默认生成选项
const DEFAULT_OPTIONS: PromptGenerationOptions = {
  includeMetadata: true,
  maxTokens: 8000,
  temperature: 0.7,
};

// Define the type for I18N texts
interface PromptGeneratorI18nTexts {
  metaHeader: string;
  scenario: string;
  language: string;
  mode: string;
  model: string;
  template: string;
  userInput: string;
  techStack: string;
  features: string;
  inputOutput: string;
  codeRules: string;
  promptInstruction: string;
  tokenWarning: string;
}

// 国际化文本
const I18N_TEXTS: Record<Language, PromptGeneratorI18nTexts> = {
  zh: {
    metaHeader: 'EP 增强提示元数据',
    scenario: '场景',
    language: '语言',
    mode: '模式',
    model: '模型',
    template: '模板',
    userInput: '用户输入',
    techStack: '技术栈',
    features: '功能特性',
    inputOutput: '输入输出',
    codeRules: '代码规范',
    promptInstruction: '请根据以上信息生成完整的项目代码',
    tokenWarning: '警告：提示长度可能超出模型限制',
  },
  en: {
    metaHeader: 'EP Enhanced Prompt Metadata',
    scenario: 'Scenario',
    language: 'Language',
    mode: 'Mode',
    model: 'Model',
    template: 'Template',
    userInput: 'User Input',
    techStack: 'Tech Stack',
    features: 'Features',
    inputOutput: 'Input/Output',
    codeRules: 'Code Rules',
    promptInstruction:
      'Please generate complete project code based on the above information',
    tokenWarning: 'Warning: Prompt length may exceed model limits',
  },
};

/**
 * Get I18N texts for a language with fallback to English
 */
function getI18nTexts(lang: Language): PromptGeneratorI18nTexts {
  return I18N_TEXTS[lang] ?? I18N_TEXTS.en;
}

/**
 * 生成 EP 元数据头部
 * @param spec - 提示规范
 * @param lang - 语言
 * @returns 元数据字符串
 */
function generateMetadataHeader(spec: EpPromptSpec, lang: Language): string {
  const texts = getI18nTexts(lang);

  return `[EP_META]
${texts.metaHeader}
- ${texts.scenario}: ${spec.scenario.toUpperCase()}
- ${texts.language}: ${lang.toUpperCase()}
- ${texts.mode}: ${spec.mode.toUpperCase()}
- ${texts.model}: ${spec.model}
- ${texts.template}: ${spec.template.title}

`;
}

/**
 * 生成模板规范部分
 * @param template - 模板配置
 * @param lang - 语言
 * @returns 规范字符串
 */
function generateTemplateSpec(
  template: TemplateConfig,
  lang: Language
): string {
  const texts = getI18nTexts(lang);

  let spec = `## ${texts.techStack}\n`;
  spec += `- ${texts.language}: ${template.spec.tech.language}\n`;
  spec += `- Framework: ${template.spec.tech.framework}\n\n`;

  spec += `## ${texts.features}\n`;
  template.spec.features.forEach((feature: string, index: number) => {
    spec += `${index + 1}. ${feature}\n`;
  });
  spec += '\n';

  spec += `## ${texts.inputOutput}\n`;
  spec += `- Input: ${template.spec.io.input}\n`;
  spec += `- Output: ${template.spec.io.output}\n\n`;

  spec += `## ${texts.codeRules}\n`;
  template.spec.codeRules.forEach((rule: string, index: number) => {
    spec += `${index + 1}. ${rule}\n`;
  });
  spec += '\n';

  return spec;
}

/**
 * 生成用户输入部分
 * @param userInput - 用户输入
 * @param lang - 语言
 * @returns 用户输入字符串
 */
function generateUserInputSection(userInput: string, lang: Language): string {
  const texts = getI18nTexts(lang);

  return `## ${texts.userInput}\n${userInput.trim()}\n\n`;
}

/**
 * 生成最终指令
 * @param spec - 提示规范
 * @param lang - 语言
 * @returns 指令字符串
 */
function generateFinalInstruction(spec: EpPromptSpec, lang: Language): string {
  const texts = getI18nTexts(lang);

  let instruction = `## ${texts.promptInstruction}\n\n`;

  // 根据场景添加特定指令
  if (spec.scenario === 'code') {
    if (lang === 'zh') {
      instruction += `请生成一个完整的、可运行的代码项目，包括：
1. 完整的源代码文件
2. 配置文件（package.json、tsconfig.json 等）
3. 单元测试
4. README 文档
5. 使用示例

要求：
- 代码必须完整且可直接运行
- 包含详细的中文注释
- 遵循最佳实践和代码规范
- 提供完整的类型定义（如果使用 TypeScript）`;
    } else {
      instruction += `Please generate a complete, runnable code project including:
1. Complete source code files
2. Configuration files (package.json, tsconfig.json, etc.)
3. Unit tests
4. README documentation
5. Usage examples

Requirements:
- Code must be complete and directly runnable
- Include detailed comments
- Follow best practices and coding standards
- Provide complete type definitions (if using TypeScript)`;
    }
  } else if (spec.scenario === 'web') {
    if (lang === 'zh') {
      instruction += `请生成一个完整的 Web 应用项目，包括：
1. 完整的前端代码
2. 响应式设计
3. 组件化架构
4. 状态管理
5. 样式文件
6. 构建配置
7. 部署说明

要求：
- 应用必须完整且可直接运行
- 支持移动端适配
- 包含详细的中文注释
- 遵循现代 Web 开发最佳实践`;
    } else {
      instruction += `Please generate a complete web application project including:
1. Complete frontend code
2. Responsive design
3. Component architecture
4. State management
5. Style files
6. Build configuration
7. Deployment instructions

Requirements:
- Application must be complete and directly runnable
- Support mobile adaptation
- Include detailed comments
- Follow modern web development best practices`;
    }
  }

  return instruction;
}

/**
 * 优化提示长度
 * @param prompt - 原始提示
 * @param maxTokens - 最大 token 数
 * @returns 优化后的提示
 */
function optimizePromptLength(prompt: string, maxTokens: number): string {
  const currentTokens = estimateTokens(prompt);

  if (currentTokens <= maxTokens) {
    return prompt;
  }

  // 简单的截断策略，实际项目中可以实现更智能的优化
  const ratio = maxTokens / currentTokens;
  const targetLength = Math.floor(prompt.length * ratio * 0.9); // 留 10% 缓冲

  return prompt.substring(0, targetLength) + '\n\n[提示已截断以适应长度限制]';
}

/**
 * 生成完整的 Claude Code 提示
 * @param spec - 提示规范
 * @param options - 生成选项
 * @returns 生成的提示字符串
 */
export function generatePrompt(
  spec: EpPromptSpec,
  options: Partial<PromptGenerationOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { template, userInput, lang } = spec;

  let prompt = '';

  // 添加元数据头部
  if (opts.includeMetadata) {
    prompt += generateMetadataHeader(spec, lang);
  }

  // 添加模板规范
  prompt += generateTemplateSpec(template, lang);

  // 添加用户输入
  if (userInput.trim()) {
    prompt += generateUserInputSection(userInput, lang);
  }

  // 添加最终指令
  prompt += generateFinalInstruction(spec, lang);

  // 优化长度
  prompt = optimizePromptLength(prompt, opts.maxTokens);

  return prompt;
}

/**
 * 验证提示规范
 * @param spec - 提示规范
 * @returns 验证结果
 */
export function validatePromptSpec(spec: EpPromptSpec): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 检查必需字段
  if (!spec.scenario) {errors.push('缺少场景类型');}
  if (!spec.lang) {errors.push('缺少语言设置');}
  if (!spec.mode) {errors.push('缺少模式设置');}
  if (!spec.template) {errors.push('缺少模板配置');}
  if (!spec.model) {errors.push('缺少模型设置');}

  // 检查用户输入
  if (!spec.userInput || !spec.userInput.trim()) {
    warnings.push('用户输入为空，将使用模板默认配置');
  }

  // 检查输入长度
  if (spec.userInput && spec.userInput.length > 5000) {
    warnings.push('用户输入过长，可能影响生成质量');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 获取提示预览
 * @param spec - 提示规范
 * @param maxLength - 最大预览长度
 * @returns 提示预览
 */
export function getPromptPreview(
  spec: EpPromptSpec,
  maxLength: number = 500
): string {
  const prompt = generatePrompt(spec, { includeMetadata: false });

  if (prompt.length <= maxLength) {
    return prompt;
  }

  // Account for the "..." suffix to ensure total length doesn't exceed maxLength
  return prompt.substring(0, maxLength - 3) + '...';
}

/**
 * 计算提示统计信息
 * @param prompt - 提示文本
 * @returns 统计信息
 */
export function getPromptStats(prompt: string): {
  characters: number;
  words: number;
  lines: number;
  estimatedTokens: number;
} {
  return {
    characters: prompt.length,
    words: prompt.split(/\s+/).filter(word => word.length > 0).length,
    lines: prompt.split('\n').length,
    estimatedTokens: estimateTokens(prompt),
  };
}
