/**
 * Markdown格式化工具
 * 智能地将普通文本转换为结构化的markdown格式，提升可读性
 */

import { marked } from 'marked';

export interface MarkdownFormatterOptions {
  enableHeadings: boolean;
  enableLists: boolean;
  enableCodeBlocks: boolean;
  enableEmphasis: boolean;
  enableQuotes: boolean;
  enableLineBreaks: boolean;
  preserveOriginalFormatting: boolean;
}

export const DEFAULT_FORMATTER_OPTIONS: MarkdownFormatterOptions = {
  enableHeadings: true,
  enableLists: true,
  enableCodeBlocks: true,
  enableEmphasis: true,
  enableQuotes: true,
  enableLineBreaks: true,
  preserveOriginalFormatting: true,
};

/**
 * 主要的markdown格式化函数
 */
export function formatTextAsMarkdown(
  text: string,
  options: Partial<MarkdownFormatterOptions> = {}
): string {
  if (!text || typeof text !== 'string') {
    return text || '';
  }

  const opts = { ...DEFAULT_FORMATTER_OPTIONS, ...options };
  
  // 如果已经包含markdown格式，且要保留原格式，则直接返回
  if (opts.preserveOriginalFormatting && hasMarkdownFormatting(text)) {
    return text;
  }

  let formattedText = text;

  // 按顺序应用格式化规则
  if (opts.enableCodeBlocks) {
    formattedText = formatCodeBlocks(formattedText);
  }
  
  if (opts.enableHeadings) {
    formattedText = formatHeadings(formattedText);
  }
  
  if (opts.enableLists) {
    formattedText = formatLists(formattedText);
  }
  
  if (opts.enableEmphasis) {
    formattedText = formatEmphasis(formattedText);
  }
  
  if (opts.enableQuotes) {
    formattedText = formatQuotes(formattedText);
  }
  
  if (opts.enableLineBreaks) {
    formattedText = formatLineBreaks(formattedText);
  }

  return formattedText.trim();
}

/**
 * 检测文本是否已包含markdown格式
 */
function hasMarkdownFormatting(text: string): boolean {
  const markdownPatterns = [
    /^#{1,6}\s/m,           // 标题
    /^\s*[-*+]\s/m,         // 列表
    /^\s*\d+\.\s/m,         // 有序列表
    /```[\s\S]*?```/,       // 代码块
    /`[^`]+`/,              // 内联代码
    /\*\*[^*]+\*\*/,        // 粗体
    /\*[^*]+\*/,            // 斜体
    /^>\s/m,                // 引用
  ];
  
  return markdownPatterns.some(pattern => pattern.test(text));
}

/**
 * 格式化代码块
 */
function formatCodeBlocks(text: string): string {
  // 检测已存在的代码块，不重复处理
  if (/```[\s\S]*?```/.test(text)) {
    return text;
  }

  // 检测多行代码模式（缩进或特定关键词开头）
  // Fixed ReDoS vulnerability by removing nested quantifiers and using atomic groups
  const codeBlockPatterns = [
    // 函数定义
    /(function\s+\w+|def\s+\w+|class\s+\w+|interface\s+\w+|type\s+\w+)[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi,
    // 代码片段（多行，包含编程关键词）- Fixed ReDoS by limiting repetition
    /(?:^|\n)((?:import|export|const|let|var|if|for|while|try|catch)\s+[^\n]*(?:\n(?![\n\s]*$)[^\n]*)*?)(?=\n\n|\n[A-Z]|$)/gi,
    // JSON对象
    /\{[\s\S]*?"[^"]*"[\s\S]*?\}/g,
    // 命令行指令
    /(?:^|\n)((?:\$\s+|npm\s+|yarn\s+|git\s+|docker\s+)[^\n]*?)(?=\n\n|\n[A-Z]|$)/gi,
  ];

  let result = text;
  
  codeBlockPatterns.forEach(pattern => {
    result = result.replace(pattern, (match, code) => {
      if (!code) return match;
      
      // 检测语言类型
      const language = detectCodeLanguage(code);
      
      // 确保代码块前后有空行
      return `\n\`\`\`${language}\n${code.trim()}\n\`\`\`\n`;
    });
  });

  // 格式化内联代码
  result = formatInlineCode(result);

  return result;
}

/**
 * 检测代码语言
 */
function detectCodeLanguage(code: string): string {
  const languagePatterns = [
    { pattern: /(function|const|let|var|=>|import|export)/i, lang: 'javascript' },
    { pattern: /(def|class|import|from|print)/i, lang: 'python' },
    { pattern: /(interface|type|extends|implements)/i, lang: 'typescript' },
    { pattern: /(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)/i, lang: 'sql' },
    { pattern: /(curl|wget|ls|cd|mkdir|rm)/i, lang: 'bash' },
    { pattern: /(\{[\s\S]*?"[^"]*"[\s\S]*?\})/i, lang: 'json' },
    { pattern: /(npm|yarn|git|docker)\s+/i, lang: 'bash' },
  ];

  for (const { pattern, lang } of languagePatterns) {
    if (pattern.test(code)) {
      return lang;
    }
  }

  return '';
}

/**
 * 格式化内联代码
 */
function formatInlineCode(text: string): string {
  // 避免重复格式化已有的内联代码
  if (/`[^`]+`/.test(text)) {
    return text;
  }

  // 匹配技术术语、文件名、变量名等
  const inlineCodePatterns = [
    // 文件扩展名
    /\b\w+\.(js|ts|jsx|tsx|py|css|html|json|md|txt|yml|yaml|xml)\b/g,
    // 技术术语
    /\b(API|HTTP|HTTPS|JSON|XML|CSS|HTML|JavaScript|TypeScript|React|Vue|Angular|Node\.js|npm|yarn|git|GitHub|Docker)\b/g,
    // 变量名模式（驼峰命名或下划线）
    /\b[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*\b/g,
    /\b[a-z]+_[a-z_]+\b/g,
    // HTTP状态码
    /\b[1-5]\d{2}\b/g,
  ];

  let result = text;
  
  inlineCodePatterns.forEach(pattern => {
    result = result.replace(pattern, (match) => {
      // 避免在已有的代码块或内联代码中重复格式化
      if (isInsideCodeBlock(text, match)) {
        return match;
      }
      return `\`${match}\``;
    });
  });

  return result;
}

/**
 * 检查文本是否在代码块内
 */
function isInsideCodeBlock(fullText: string, target: string): boolean {
  const index = fullText.indexOf(target);
  if (index === -1) return false;
  
  const beforeText = fullText.substring(0, index);
  const codeBlockStarts = (beforeText.match(/```/g) || []).length;
  
  return codeBlockStarts % 2 === 1; // 奇数表示在代码块内
}

/**
 * 格式化标题
 */
function formatHeadings(text: string): string {
  // 避免重复格式化已有标题
  if (/^#{1,6}\s/m.test(text)) {
    return text;
  }

  let result = text;

  // 检测标题模式
  const headingPatterns = [
    // 问题或主题（以问号结尾的句子）
    { pattern: /^([^?\n]{10,80}\?)$/gm, level: 2 },
    // 步骤或章节（数字开头）
    { pattern: /^(\d+[\.\)]\s*[^?\n]{5,60})$/gm, level: 3 },
    // 重要声明（全大写单词开头）
    { pattern: /^([A-Z]{2,}[^?\n]{5,60})$/gm, level: 2 },
    // 总结性语句（包含"总结"、"结论"等关键词）
    { pattern: /^((?:总结|结论|概述|要点|核心|关键)[^?\n]{5,60})$/gm, level: 2 },
  ];

  headingPatterns.forEach(({ pattern, level }) => {
    result = result.replace(pattern, (match, title) => {
      const prefix = '#'.repeat(level);
      return `${prefix} ${title.trim()}`;
    });
  });

  return result;
}

/**
 * 格式化列表
 */
function formatLists(text: string): string {
  // 避免重复格式化已有列表
  if (/^\s*[-*+]\s/m.test(text) || /^\s*\d+\.\s/m.test(text)) {
    return text;
  }

  let result = text;

  // 检测列表模式
  // Note: listPatterns is used for future list detection features
  // Keeping it for now as it's part of the planned functionality
  const listPatterns = [
    // 数字序号列表
    /^(\d+[\.\)]\s*.+)$/gm,
    // 破折号或点开头的项目
    /^([-•·]\s*.+)$/gm,
    // 多个短句（每行一个要点）
    /^([^.\n]{10,80}[。！])$/gm,
  ];

  // 检测连续的列表项
  const lines = result.split('\n');
  const processedLines: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] || '').trim();
    
    if (!line) {
      processedLines.push(lines[i] || '');
      inList = false;
      continue;
    }

    // 检测是否为列表项
    const isListItem = isLineListItem(line);
    
    if (isListItem) {
      if (!inList) {
        // 开始新列表，前面加空行
        if (processedLines.length > 0 && (processedLines[processedLines.length - 1] || '').trim()) {
          processedLines.push('');
        }
        inList = true;
      }
      
      // 格式化为markdown列表项
      const formattedItem = formatListItem(line);
      processedLines.push(formattedItem);
    } else {
      if (inList) {
        // 列表结束，后面加空行
        processedLines.push('');
        inList = false;
      }
      processedLines.push(lines[i] || '');
    }
  }

  return processedLines.join('\n');
}

/**
 * 判断是否为列表项
 */
function isLineListItem(line: string): boolean {
  const listItemPatterns = [
    /^\d+[\.\)]\s*.+/,           // 数字列表
    /^[-•·]\s*.+/,               // 符号列表
    /^[A-Za-z]\)\s*.+/,          // 字母列表
    /^(?:首先|其次|然后|最后|另外|此外).+/, // 中文序列词
    /^(?:First|Second|Third|Next|Finally|Also).+/i, // 英文序列词
  ];

  return listItemPatterns.some(pattern => pattern.test(line));
}

/**
 * 格式化单个列表项
 */
function formatListItem(line: string): string {
  // 如果已经是markdown格式，直接返回
  if (/^\s*[-*+]\s/.test(line)) {
    return line;
  }

  // 移除原有的序号或符号
  const cleanLine = line
    .replace(/^\d+[\.\)]\s*/, '')
    .replace(/^[-•·]\s*/, '')
    .replace(/^[A-Za-z]\)\s*/, '')
    .replace(/^(?:首先|其次|然后|最后|另外|此外)[，：]\s*/, '')
    .replace(/^(?:First|Second|Third|Next|Finally|Also)[,:]\s*/i, '');

  return `- ${cleanLine}`;
}

/**
 * 格式化强调文本
 */
function formatEmphasis(text: string): string {
  // 避免重复格式化
  if (/\*\*[^*]+\*\*/.test(text) || /\*[^*]+\*/.test(text)) {
    return text;
  }

  let result = text;

  // 重要关键词加粗
  const boldPatterns = [
    /\b(重要|关键|核心|主要|注意|警告|错误|成功|失败)\b/g,
    /\b(Important|Key|Core|Main|Note|Warning|Error|Success|Failed)\b/gi,
    /\b(API|HTTP|HTTPS|JSON|XML)\b/g,
  ];

  boldPatterns.forEach(pattern => {
    result = result.replace(pattern, '**$1**');
  });

  // 技术术语斜体
  const italicPatterns = [
    /\b(参数|配置|选项|属性|方法|函数)\b/g,
    /\b(parameter|config|option|property|method|function)\b/gi,
  ];

  italicPatterns.forEach(pattern => {
    result = result.replace(pattern, '*$1*');
  });

  return result;
}

/**
 * 格式化引用
 */
function formatQuotes(text: string): string {
  // 避免重复格式化
  if (/^>\s/m.test(text)) {
    return text;
  }

  let result = text;

  // 检测引用模式
  const quotePatterns = [
    // 引号包围的内容
    /^"([^"]+)"$/gm,
    /^'([^']+)'$/gm,
    // 注意事项
    /^(注意：.+)$/gm,
    /^(Note:.+)$/gmi,
    // 提示信息
    /^(提示：.+)$/gm,
    /^(Tip:.+)$/gmi,
  ];

  quotePatterns.forEach(pattern => {
    result = result.replace(pattern, '> $1');
  });

  return result;
}

/**
 * 🎯 优化冒号显示 - 去掉冒号，直接在要解释的词后面解释
 */
function optimizeColonDisplay(text: string): string {
  let result = text;

  // 处理列表项中的冒号格式：将"术语：解释"改为"术语 解释"
  result = result.replace(/^(\s*[•\-\*]\s*)([^：\n]+)：\s*(.+)$/gm, '$1$2 $3');

  // 处理段落中的冒号格式：将"概念：解释"改为"概念 解释"
  result = result.replace(/([A-Za-z\u4e00-\u9fa5]+)：\s*([^。！？\n]+)/g, '$1 $2');

  // 处理标题后的冒号：将"标题："改为"标题"
  result = result.replace(/^(#{1,6}\s*[^：\n]+)：\s*$/gm, '$1');

  return result;
}

/**
 * 智能格式化换行和段落 - 优化信息密度
 */
function formatLineBreaks(text: string): string {
  let result = text;

  // 1. 首先优化冒号显示
  result = optimizeColonDisplay(result);

  // 2. 合并多个连续空行为两个空行（保留真正的段落分隔）
  result = result.replace(/\n{3,}/g, '\n\n');

  // 3. 移除句号后的强制换行逻辑，让相关句子保持在同一段落内
  // 原逻辑：result = result.replace(/([。！？])\n([A-Za-z\u4e00-\u9fa5])/g, '$1\n\n$2');
  // 新逻辑：只在真正需要分段的地方分段

  // 4. 智能段落分段：只在以下情况下保留或添加段落分隔
  // - 已存在的双换行符（明确的段落分隔）
  // - 标题前后（# ## ###）
  // - 列表开始前
  // - 代码块前后

  // 保留标题前的段落分隔
  result = result.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2');

  // 保留列表前的段落分隔（但不强制）
  result = result.replace(/([。！？])\n([•\-\*]\s|[0-9]+\.\s)/g, '$1\n\n$2');

  // 保留代码块前后的段落分隔
  result = result.replace(/([^\n])\n(```)/g, '$1\n\n$2');
  result = result.replace(/(```[^\n]*)\n([A-Za-z\u4e00-\u9fa5])/g, '$1\n\n$2');

  return result;
}

/**
 * 快速格式化函数（使用默认选项）
 */
export function quickFormatMarkdown(text: string): string {
  return formatTextAsMarkdown(text);
}

/**
 * 仅格式化代码的函数
 */
export function formatCodeOnly(text: string): string {
  return formatTextAsMarkdown(text, {
    enableHeadings: false,
    enableLists: false,
    enableCodeBlocks: true,
    enableEmphasis: false,
    enableQuotes: false,
    enableLineBreaks: false,
  });
}

/**
 * 仅格式化列表的函数
 */
export function formatListsOnly(text: string): string {
  return formatTextAsMarkdown(text, {
    enableHeadings: false,
    enableLists: true,
    enableCodeBlocks: false,
    enableEmphasis: false,
    enableQuotes: false,
    enableLineBreaks: true,
  });
}

/**
 * 智能格式化函数 - 根据内容类型自动选择最佳格式化策略
 */
export function smartFormatMarkdown(text: string): string {
  if (!text || typeof text !== 'string') {
    return text || '';
  }

  // 分析文本内容特征
  const analysis = analyzeTextContent(text);

  // 根据分析结果选择格式化选项
  const options: Partial<MarkdownFormatterOptions> = {
    enableHeadings: analysis.hasHeadingLikeContent,
    enableLists: analysis.hasListLikeContent,
    enableCodeBlocks: analysis.hasCodeLikeContent,
    enableEmphasis: analysis.hasEmphasisWords,
    enableQuotes: analysis.hasQuoteLikeContent,
    enableLineBreaks: analysis.needsBetterLineBreaks,
    preserveOriginalFormatting: true,
  };

  return formatTextAsMarkdown(text, options);
}

/**
 * 分析文本内容特征
 */
interface TextAnalysis {
  hasHeadingLikeContent: boolean;
  hasListLikeContent: boolean;
  hasCodeLikeContent: boolean;
  hasEmphasisWords: boolean;
  hasQuoteLikeContent: boolean;
  needsBetterLineBreaks: boolean;
  contentType: 'code' | 'explanation' | 'list' | 'mixed' | 'simple';
}

function analyzeTextContent(text: string): TextAnalysis {
  const lines = text.split('\n');
  const wordCount = text.split(/\s+/).length;

  // 检测各种内容特征
  const hasHeadingLikeContent = /^[^?\n]{10,80}[？?]$/m.test(text) ||
                               /^[A-Z]{2,}[^?\n]{5,60}$/m.test(text) ||
                               /^(?:总结|结论|概述|要点|核心|关键)[^?\n]{5,60}$/m.test(text);

  const hasListLikeContent = lines.filter(line => isLineListItem(line.trim())).length >= 2;

  const hasCodeLikeContent = /(?:function|const|let|var|def|class|import|export|SELECT|INSERT|npm|git|docker)/i.test(text) ||
                            /\{[\s\S]*?"[^"]*"[\s\S]*?\}/.test(text) ||
                            /\w+\.(js|ts|jsx|tsx|py|css|html|json|md)/.test(text);

  const hasEmphasisWords = /\b(?:重要|关键|核心|主要|注意|警告|错误|成功|失败|Important|Key|Core|Main|Note|Warning|Error|Success|Failed)\b/i.test(text);

  const hasQuoteLikeContent = /^["'].*["']$/m.test(text) ||
                             /^(?:注意：|提示：|Note:|Tip:)/mi.test(text);

  const needsBetterLineBreaks = lines.length > 3 && wordCount > 50;

  // 确定内容类型
  let contentType: TextAnalysis['contentType'] = 'simple';
  if (hasCodeLikeContent && hasListLikeContent) {
    contentType = 'mixed';
  } else if (hasCodeLikeContent) {
    contentType = 'code';
  } else if (hasListLikeContent) {
    contentType = 'list';
  } else if (wordCount > 30) {
    contentType = 'explanation';
  }

  return {
    hasHeadingLikeContent,
    hasListLikeContent,
    hasCodeLikeContent,
    hasEmphasisWords,
    hasQuoteLikeContent,
    needsBetterLineBreaks,
    contentType,
  };
}

/**
 * 预设格式化配置
 */
export const FORMATTER_PRESETS = {
  // 最小格式化 - 只处理最基本的格式
  minimal: {
    enableHeadings: false,
    enableLists: false,
    enableCodeBlocks: true,
    enableEmphasis: false,
    enableQuotes: false,
    enableLineBreaks: false,
    preserveOriginalFormatting: true,
  },

  // 代码优先 - 专注于代码格式化
  codeFirst: {
    enableHeadings: true,
    enableLists: false,
    enableCodeBlocks: true,
    enableEmphasis: false,
    enableQuotes: false,
    enableLineBreaks: true,
    preserveOriginalFormatting: true,
  },

  // 文档格式 - 适合长文档
  document: {
    enableHeadings: true,
    enableLists: true,
    enableCodeBlocks: true,
    enableEmphasis: true,
    enableQuotes: true,
    enableLineBreaks: true,
    preserveOriginalFormatting: true,
  },

  // 聊天优化 - 适合聊天消息
  chat: {
    enableHeadings: false,
    enableLists: true,
    enableCodeBlocks: true,
    enableEmphasis: true,
    enableQuotes: false,
    enableLineBreaks: true,
    preserveOriginalFormatting: true,
  },
} as const;

/**
 * 使用预设配置格式化文本
 */
export function formatWithPreset(
  text: string,
  preset: keyof typeof FORMATTER_PRESETS
): string {
  return formatTextAsMarkdown(text, FORMATTER_PRESETS[preset]);
}

/**
 * 将markdown文本转换为HTML
 */
export function markdownToHtml(markdownText: string): string {
  if (!markdownText || typeof markdownText !== 'string') {
    return markdownText || '';
  }

  try {
    // 配置marked选项 - 优化换行处理以提高信息密度
    marked.setOptions({
      breaks: false,       // 禁用单换行符转换为<br>，让文本自然流动
      gfm: true,          // 支持GitHub风格markdown
      // sanitize选项在新版本中已移除，由DOMPurify处理
    });

    // 使用同步版本的marked.parse
    return marked.parse(markdownText) as string;
  } catch (error) {
    console.warn('Markdown to HTML conversion failed:', error);
    return markdownText;
  }
}

/**
 * 完整的格式化和转换流程：文本 -> markdown -> HTML
 */
export function formatTextToHtml(
  text: string,
  options: Partial<MarkdownFormatterOptions> = {}
): string {
  // 第一步：格式化为markdown
  const markdownText = formatTextAsMarkdown(text, options);

  // 第二步：转换为HTML
  return markdownToHtml(markdownText);
}

/**
 * 使用预设配置的完整格式化流程
 */
export function formatPresetToHtml(
  text: string,
  preset: keyof typeof FORMATTER_PRESETS
): string {
  const markdownText = formatWithPreset(text, preset);
  return markdownToHtml(markdownText);
}
