/**
 * EP (Enhanced Prompt) 核心类型定义
 * 定义了整个应用的数据结构和接口
 */

import { z } from 'zod';

// Zod schemas for runtime validation
export const LanguageSchema = z.enum(['zh', 'en']);
export const ScenarioSchema = z.enum(['code', 'web']);
export const ModeSchema = z.enum(['full', 'minimal']);
export const DeepSeekModelSchema = z.enum([
  'deepseek-chat',
  'deepseek-coder',
  'deepseek-reasoner',
  'deepseek-v3.1'
]);

// TypeScript types derived from Zod schemas
export type Language = z.infer<typeof LanguageSchema>;
export type Scenario = z.infer<typeof ScenarioSchema>;
export type Mode = z.infer<typeof ModeSchema>;
export type DeepSeekModel = z.infer<typeof DeepSeekModelSchema>;

// Zod schema for TemplateConfig
export const TemplateConfigSchema = z.object({
  schemaVersion: z.string().min(1, 'Schema version is required'),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  scenario: ScenarioSchema,
  lang: LanguageSchema,
  mode: ModeSchema,
  spec: z.object({
    tech: z.object({
      language: z.string().min(1, 'Language is required'),
      framework: z.string().min(1, 'Framework is required'),
    }),
    features: z.array(z.string()).min(1, 'At least one feature is required'),
    io: z.object({
      input: z.string().min(1, 'Input description is required'),
      output: z.string().min(1, 'Output description is required'),
    }),
    codeRules: z.array(z.string()),
  }),
});

// TypeScript interface derived from Zod schema
export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;

// Zod schema for EpPromptSpec
export const EpPromptSpecSchema = z.object({
  scenario: ScenarioSchema,
  lang: LanguageSchema,
  mode: ModeSchema,
  template: TemplateConfigSchema,
  userInput: z.string().min(1, 'User input is required').max(10000, 'User input too long'),
  model: DeepSeekModelSchema,
});

// Zod schema for ApiResponse
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.string().optional(),
  error: z.string().optional(),
  stream: z.boolean().optional(),
});

// TypeScript interfaces derived from Zod schemas
export type EpPromptSpec = z.infer<typeof EpPromptSpecSchema>;
export type ApiResponse = z.infer<typeof ApiResponseSchema>;

// Zod schema for StreamResponse
export const StreamResponseSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  object: z.string().min(1, 'Object type is required'),
  created: z.number().int().positive('Created timestamp must be positive'),
  model: z.string().min(1, 'Model is required'),
  choices: z.array(z.object({
    index: z.number().int().nonnegative('Index must be non-negative'),
    delta: z.object({
      content: z.string().optional(),
      role: z.string().optional(),
    }),
    finish_reason: z.string().optional(),
  })),
});

// TypeScript interface derived from Zod schema
export type StreamResponse = z.infer<typeof StreamResponseSchema>;

// 模板注册表接口
export interface TemplateRegistry {
  [scenario: string]: {
    [templateId: string]: TemplateConfig;
  };
}

// 组件状态接口
export interface AppState {
  scenario: Scenario;
  templateId: string;
  model: DeepSeekModel;
  lang: Language;
  mode: Mode;
  isLoading: boolean;
  error: string | null;
}

// 组件动作接口
export interface AppActions {
  setScenario: (scenario: Scenario) => void;
  setTemplateId: (templateId: string) => void;
  setModel: (model: DeepSeekModel) => void;
  setLang: (lang: Language) => void;
  setMode: (mode: Mode) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// 上下文接口
export interface AppContextType extends AppState, AppActions {}

// 模板选择器选项接口
export interface TemplateOption {
  id: string;
  title: string;
  scenario: Scenario;
  description?: string;
}

// 模型选项接口
export interface ModelOption {
  id: DeepSeekModel;
  name: string;
  description: string;
  icon: string;
}

// 错误类型
export class EpError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'EpError';
  }
}

// 模板验证结果接口
export interface TemplateValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// 提示生成选项接口
export interface PromptGenerationOptions {
  includeMetadata: boolean;
  maxTokens: number;
  temperature: number;
}

// 国际化文本接口
export interface I18nTexts {
  zh: Record<string, string>;
  en: Record<string, string>;
}

// Runtime validation functions
export const validateDeepSeekModel = (model: unknown): DeepSeekModel => {
  try {
    return DeepSeekModelSchema.parse(model);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new EpError(
        `Invalid DeepSeek model: ${error.issues.map(e => e.message).join(', ')}`,
        'INVALID_MODEL',
        { model, errors: error.issues }
      );
    }
    throw error;
  }
};

export const validateTemplateConfig = (config: unknown): TemplateConfig => {
  try {
    return TemplateConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new EpError(
        `Invalid template configuration: ${error.issues.map(e => e.message).join(', ')}`,
        'INVALID_TEMPLATE_CONFIG',
        { config, errors: error.issues }
      );
    }
    throw error;
  }
};

export const validateEpPromptSpec = (spec: unknown): EpPromptSpec => {
  try {
    return EpPromptSpecSchema.parse(spec);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new EpError(
        `Invalid prompt specification: ${error.issues.map(e => e.message).join(', ')}`,
        'INVALID_PROMPT_SPEC',
        { spec, errors: error.issues }
      );
    }
    throw error;
  }
};

export const validateApiResponse = (response: unknown): ApiResponse => {
  try {
    return ApiResponseSchema.parse(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new EpError(
        `Invalid API response: ${error.issues.map(e => e.message).join(', ')}`,
        'INVALID_API_RESPONSE',
        { response, errors: error.issues }
      );
    }
    throw error;
  }
};

export const validateStreamResponse = (response: unknown): StreamResponse => {
  try {
    return StreamResponseSchema.parse(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new EpError(
        `Invalid stream response: ${error.issues.map(e => e.message).join(', ')}`,
        'INVALID_STREAM_RESPONSE',
        { response, errors: error.issues }
      );
    }
    throw error;
  }
};

// Safe validation functions that return validation results instead of throwing
export const safeValidateDeepSeekModel = (model: unknown): { success: true; data: DeepSeekModel } | { success: false; error: z.ZodError } => {
  const result = DeepSeekModelSchema.safeParse(model);
  return result.success ? { success: true, data: result.data } : { success: false, error: result.error };
};

export const safeValidateTemplateConfig = (config: unknown): { success: true; data: TemplateConfig } | { success: false; error: z.ZodError } => {
  const result = TemplateConfigSchema.safeParse(config);
  return result.success ? { success: true, data: result.data } : { success: false, error: result.error };
};

export const safeValidateEpPromptSpec = (spec: unknown): { success: true; data: EpPromptSpec } | { success: false; error: z.ZodError } => {
  const result = EpPromptSpecSchema.safeParse(spec);
  return result.success ? { success: true, data: result.data } : { success: false, error: result.error };
};

export const safeValidateApiResponse = (response: unknown): { success: true; data: ApiResponse } | { success: false; error: z.ZodError } => {
  const result = ApiResponseSchema.safeParse(response);
  return result.success ? { success: true, data: result.data } : { success: false, error: result.error };
};

export const safeValidateStreamResponse = (response: unknown): { success: true; data: StreamResponse } | { success: false; error: z.ZodError } => {
  const result = StreamResponseSchema.safeParse(response);
  return result.success ? { success: true, data: result.data } : { success: false, error: result.error };
};
