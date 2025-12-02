/**
 * 快速按钮配置类型定义
 */

// 快速按钮执行模式
export type QuickButtonMode = 'fill' | 'execute' | 'agent';

export interface QuickButtonConfig {
  id: 1 | 2 | 3 | 4;
  icon: string; // 最多2个字符的emoji
  title: string; // 最多8个字符
  prompt: string; // 提示词内容（agent模式下作为systemPrompt）
  model: 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner';
  mode: QuickButtonMode; // 执行模式：fill填充 | execute执行 | agent代理模式
  enabled: boolean; // 是否启用
}

// Agent 配置（运行时视图，用于从 QuickButtonConfig 映射）
export interface AgentConfig {
  id: string;           // 对应按钮 id
  name: string;         // 按钮显示名称
  systemPrompt: string; // 来自 prompt（agent 模式时）
  icon?: string;        // 图标标识
}

// 将快捷按钮配置转换为 Agent 配置的映射函数
export function mapQuickButtonsToAgents(buttons: QuickButtonConfig[]): AgentConfig[] {
  return buttons
    .filter(b => b.enabled && b.mode === 'agent' && b.prompt.trim())
    .map(b => ({
      id: String(b.id),
      name: b.title,
      systemPrompt: b.prompt.trim(),
      icon: b.icon,
    }));
}

// 默认 Agent 系统提示词
const AGENT_PROMPTS = {
  computerButler: `你是一位专业的 Mac 电脑管家助手。你的职责是：
1. 提供 macOS 系统操作指导（快捷键、设置、故障排查）
2. 推荐高效的 Mac 应用和工具
3. 解答系统优化和维护问题
4. 使用简洁、友好的语言，提供可操作的步骤

回答时请：
- 优先提供 macOS 原生解决方案
- 标注具体的快捷键和菜单路径
- 考虑不同 macOS 版本的差异`,

  translator: `你是一位专业的中英双语翻译专家。你的职责是：
1. 准确翻译中文和英文内容
2. 保持原文的语气、风格和专业术语
3. 自动识别输入语言并翻译为另一种语言
4. 对于专业术语，提供原文标注

翻译原则：
- 中文输入 → 翻译为英文
- 英文输入 → 翻译为中文
- 保持格式和标点符号的规范性
- 必要时提供多种翻译选项`,

  inspiration: `你是一位富有创意的灵感激发助手。你的职责是：
1. 提供创新性的思路和观点
2. 帮助用户突破思维定式
3. 从多角度分析问题
4. 激发用户的创造力和想象力

回答时请：
- 提供 3-5 个不同维度的思考方向
- 使用类比、隐喻等方法启发思维
- 鼓励发散性思考
- 保持开放和包容的态度`,

  codingExpert: `你是一位资深的编程专家。你的职责是：
1. 提供高质量的代码解决方案
2. 解释编程概念和最佳实践
3. 帮助调试和优化代码
4. 推荐合适的技术栈和工具

回答时请：
- 提供可运行的代码示例
- 注释关键逻辑和注意事项
- 说明代码的时间/空间复杂度（如适用）
- 考虑代码的可维护性和可扩展性
- 遵循业界标准和最佳实践`,
};

export const DEFAULT_QUICK_BUTTONS: QuickButtonConfig[] = [
  {
    id: 1,
    icon: '💻',
    title: '电脑管家',
    prompt: AGENT_PROMPTS.computerButler,
    model: 'deepseek-chat',
    mode: 'agent',
    enabled: true,
  },
  {
    id: 2,
    icon: '🌐',
    title: '中英互译',
    prompt: AGENT_PROMPTS.translator,
    model: 'deepseek-chat',
    mode: 'agent',
    enabled: true,
  },
  {
    id: 3,
    icon: '💡',
    title: '灵感问答',
    prompt: AGENT_PROMPTS.inspiration,
    model: 'deepseek-chat',
    mode: 'agent',
    enabled: true,
  },
  {
    id: 4,
    icon: '👨‍💻',
    title: '编程专家',
    prompt: AGENT_PROMPTS.codingExpert,
    model: 'deepseek-coder',
    mode: 'agent',
    enabled: true,
  },
];
