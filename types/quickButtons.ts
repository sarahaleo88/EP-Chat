/**
 * 快速按钮配置类型定义
 */

export interface QuickButtonConfig {
  id: 1 | 2 | 3 | 4;
  icon: string; // 最多2个字符的emoji
  title: string; // 最多8个字符
  prompt: string; // 提示词内容
  model: 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner';
  mode: 'fill' | 'execute'; // 执行模式
  enabled: boolean; // 是否启用
}

export const DEFAULT_QUICK_BUTTONS: QuickButtonConfig[] = [
  {
    id: 1,
    icon: '🚀',
    title: '代码生成',
    prompt: '请帮我生成以下功能的代码：\n\n',
    model: 'deepseek-coder',
    mode: 'execute',
    enabled: true,
  },
  {
    id: 2,
    icon: '📝',
    title: '文档写作',
    prompt: '请帮我撰写以下主题的技术文档：\n\n',
    model: 'deepseek-chat',
    mode: 'fill',
    enabled: true,
  },
  {
    id: 3,
    icon: '❓',
    title: '问题解答',
    prompt: '请对以下问题进行详细解答：\n\n',
    model: 'deepseek-reasoner',
    mode: 'execute',
    enabled: true,
  },
  {
    id: 4,
    icon: '🌐',
    title: '中英翻译',
    prompt: '请将以下内容进行中英文对照翻译：\n\n',
    model: 'deepseek-chat',
    mode: 'fill',
    enabled: true,
  },
];
