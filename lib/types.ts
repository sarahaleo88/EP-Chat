/**
 * EP (Enhanced Prompt) 核心类型定义
 * 定义了整个应用的数据结构和接口
 */

// 支持的语言类型
export type Language = 'zh' | 'en';

// 支持的场景类型
export type Scenario = 'code' | 'web';

// 支持的模式类型
export type Mode = 'full' | 'minimal';

// DeepSeek 模型类型
export type DeepSeekModel =
  | 'deepseek-chat'
  | 'deepseek-coder'
  | 'deepseek-reasoner';

// 模板配置接口
export interface TemplateConfig {
  schemaVersion: string;
  title: string;
  scenario: Scenario;
  lang: Language;
  mode: Mode;
  spec: {
    tech: {
      language: string;
      framework: string;
    };
    features: string[];
    io: {
      input: string;
      output: string;
    };
    codeRules: string[];
  };
}

// EP 提示规范接口
export interface EpPromptSpec {
  scenario: Scenario;
  lang: Language;
  mode: Mode;
  template: TemplateConfig;
  userInput: string;
  model: DeepSeekModel;
}

// API 响应接口
export interface ApiResponse {
  success: boolean;
  data?: string;
  error?: string;
  stream?: boolean;
}

// 流式响应接口
export interface StreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason?: string;
  }>;
}

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
