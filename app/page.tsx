/**
 * EP 主页面组件 - Chat 风格界面
 * 提供聊天式的提示增强界面，输入在底部，对话历史在顶部
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { IconButton } from './components/ui/button';
import { Card, Popover, CenteredModal } from './components/ui/ui-lib';
import { createDeepSeekClient, formatApiError, convertToDeepSeekMessages, truncateMessages, type DeepSeekMessage } from '../lib/deepseek-api';
import { createOptimizedDeepSeekClient, OptimizedApiError } from '../lib/optimized-deepseek-api';
import { enhanceReasonerPrompt, enhanceCoderPrompt } from '../lib/prompt-enhancers';
import { ModelSelector } from './components/ModelSelector';
import { MessageLoadingBubble } from './components/EnhancedLoadingIndicator';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { CopyButton } from './components/CopyButton';
import { formatUserFriendlyError, shouldAutoRetry, getRetryDelay } from '../lib/error-handler';
import { useDebouncedCallback } from '../hooks/useDebounce';

// 简单的图标组件
const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97L2.46 14.6c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.31.61.22l2.49-1c.52.39 1.06.73 1.69.98l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.25 1.17-.59 1.69-.98l2.49 1c.22.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
  </svg>
);



// 消息类型定义
interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  isApiResponse?: boolean; // 标识是否为 API 响应
  isStreaming?: boolean; // 标识是否正在流式传输
}

/**
 * EP 主页面组件 - Chat 风格界面
 * @returns JSX 元素
 */
export default function HomePage() {
  // 聊天式应用状态
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const optimizedClientRef = useRef<ReturnType<typeof createOptimizedDeepSeekClient> | null>(null);

  // 设置相关状态
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState<'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner'>('deepseek-chat');
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * 检测文本语言
   */
  const detectLanguage = (text: string): 'chinese' | 'english' => {
    // 简单的中文检测：包含中文字符
    const chineseRegex = /[\u4e00-\u9fff]/;
    return chineseRegex.test(text) ? 'chinese' : 'english';
  };

  /**
   * 判断是否为翻译请求
   */
  const isTranslationRequest = (text: string): boolean => {
    return text.startsWith('请翻译以下内容：') ||
           text.toLowerCase().includes('translate') ||
           text.includes('翻译');
  };

  /**
   * 提取要翻译的实际内容
   */
  const extractTranslationContent = (text: string): string => {
    if (text.startsWith('请翻译以下内容：')) {
      return text.replace('请翻译以下内容：', '').trim();
    }
    // 处理其他翻译触发词
    if (text.toLowerCase().includes('translate:')) {
      return text.replace(/.*translate:\s*/i, '').trim();
    }
    if (text.includes('翻译：')) {
      return text.replace(/.*翻译：\s*/, '').trim();
    }
    return text.trim();
  };

  /**
   * 获取或创建优化的 API 客户端
   */
  const getOptimizedClient = useCallback(() => {
    if (!optimizedClientRef.current && apiKey.trim()) {
      optimizedClientRef.current = createOptimizedDeepSeekClient(apiKey.trim(), {
        timeout: 30000,
        maxRetries: 3,
        retryDelay: 1000,
        cacheSize: 50,
        cacheTtl: 3600000
      });
    }
    return optimizedClientRef.current;
  }, [apiKey]);

  /**
   * 发送消息 - 模型特定的处理逻辑（优化版本）
   */
  const handleSendInternal = useCallback(async (inputText: string, attempt: number = 0) => {
    if (!inputText.trim() || isLoading) return;

    // 清除之前的错误
    setCurrentError(null);

    // 添加用户消息（只在第一次尝试时添加）
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    if (attempt === 0) {
      setMessages(prev => [...prev, userMessage]);
      setUserInput('');
    }
    setIsLoading(true);
    setRetryCount(attempt);

    try {
      let responseContent: string;
      let isApiResponse = false;

      // 根据选择的模型决定处理方式
      if (selectedModel === 'deepseek-chat') {
        // DeepSeek Chat: 调用实际 API
        if (!apiKey.trim()) {
          responseContent = `❌ **API 密钥未配置**

请在设置中配置您的 DeepSeek API 密钥后再使用 Chat 模式。

💡 **如何获取 API 密钥：**
1. 访问 [DeepSeek 官网](https://platform.deepseek.com/)
2. 注册并登录账户
3. 在 API 管理页面创建新的 API 密钥
4. 将密钥粘贴到设置中的 API 密钥字段

🔧 **其他选择：**
- 使用 **DeepSeek Coder** 模式获取代码生成提示
- 使用 **DeepSeek Reasoner** 模式获取逻辑推理提示`;
        } else {
          try {
            // 获取优化的 API 客户端
            const optimizedClient = getOptimizedClient();
            if (!optimizedClient) {
              throw new Error('无法创建 API 客户端，请检查 API 密钥');
            }

            // 准备消息历史（包含当前消息）
            const allMessages = attempt === 0 ? [...messages, userMessage] : [...messages.slice(0, -1), userMessage];
            const apiMessages = convertToDeepSeekMessages(allMessages);
            const truncatedMessages = truncateMessages(apiMessages, 3000);

            // 调用优化的 DeepSeek API
            const response = await optimizedClient.chat(truncatedMessages, 'deepseek-chat', {
              temperature: 0.7,
              max_tokens: 2048
            });

            responseContent = response.choices[0]?.message?.content || '抱歉，没有收到有效的响应。';
            isApiResponse = true;
          } catch (error) {
            // 使用优化的错误处理
            const friendlyError = formatUserFriendlyError(error);

            // 检查是否应该自动重试
            if (shouldAutoRetry(error, attempt, 3)) {
              setIsLoading(false);
              const retryDelay = getRetryDelay(error);

              setTimeout(() => {
                handleSendInternal(inputText, attempt + 1);
              }, retryDelay);
              return;
            }

            responseContent = `❌ **${friendlyError.title}**

${friendlyError.message}

💡 **建议：**
${friendlyError.suggestion}

${friendlyError.retryable ? '您可以点击重试按钮再次尝试。' : '请检查设置后重试。'}`;
            setCurrentError(friendlyError.title);
          }
        }
      } else {
        // DeepSeek Reasoner/Coder: 生成增强提示
        let enhancedPrompt: string;

        // 检查是否为翻译请求
        if (isTranslationRequest(userMessage.content)) {
          // 提取要翻译的实际内容
          const textToTranslate = extractTranslationContent(userMessage.content);

          // 如果没有实际内容需要翻译，提示用户
          if (!textToTranslate) {
            enhancedPrompt = `# 翻译提示

请在"请翻译以下内容："后面输入您需要翻译的文本。

## 使用方法
- 输入中文，我将翻译成英文
- 输入英文，我将翻译成中文

## 示例
请翻译以下内容：Hello, how are you?
请翻译以下内容：你好，最近怎么样？`;
          } else {
            // 检测语言并生成翻译提示
            const detectedLang = detectLanguage(textToTranslate);

            if (detectedLang === 'chinese') {
              enhancedPrompt = `# 中译英翻译

## 原文（中文）
${textToTranslate}

## 翻译要求
请将以上中文内容翻译成地道的英文，要求：
1. 保持原文的语义和语调
2. 使用自然流畅的英文表达
3. 注意文化背景的适当转换
4. 保持专业术语的准确性

## 英文翻译
[请在此处提供英文翻译]`;
            } else {
              enhancedPrompt = `# 英译中翻译

## 原文（英文）
${textToTranslate}

## 翻译要求
请将以上英文内容翻译成地道的中文，要求：
1. 保持原文的语义和语调
2. 使用自然流畅的中文表达
3. 注意文化背景的适当转换
4. 保持专业术语的准确性

## 中文翻译
[请在此处提供中文翻译]`;
            }
          }
        } else {
          // 根据选择的模型生成不同的提示
          if (selectedModel === 'deepseek-coder') {
            enhancedPrompt = enhanceCoderPrompt(userMessage.content);
          } else if (selectedModel === 'deepseek-reasoner') {
            enhancedPrompt = enhanceReasonerPrompt(userMessage.content);
          } else {
            // 这种情况不应该发生，因为 deepseek-chat 在上面已经处理了
            enhancedPrompt = `# 提示增强

## 用户输入
${userMessage.content}

## 增强提示
请根据以上内容提供有帮助的回复。`;
          }
        }

        responseContent = enhancedPrompt;
      }

      // 添加助手回复
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        model: selectedModel,
        isApiResponse: isApiResponse,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('生成失败:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '生成失败，请重试。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, selectedModel, apiKey, messages, getOptimizedClient]);

  // 简化的发送函数（临时修复）
  const handleSend = useCallback(async () => {
    if (!userInput.trim() || isLoading) return;

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: userInput.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      // 简化的处理逻辑
      let responseContent: string;
      let isApiResponse = false;

      if (selectedModel === 'deepseek-chat') {
        if (!apiKey.trim()) {
          responseContent = `❌ **API 密钥未配置**

请在设置中配置您的 DeepSeek API 密钥后再使用 Chat 模式。`;
        } else {
          try {
            const client = getOptimizedClient();
            const allMessages = [...messages, userMessage];
            const apiMessages = convertToDeepSeekMessages(allMessages);
            const truncatedMessages = truncateMessages(apiMessages, 3000);

            // Create streaming assistant message
            const streamingMessageId = (Date.now() + 1).toString();
            const streamingMessage: Message = {
              id: streamingMessageId,
              type: 'assistant',
              content: '',
              timestamp: new Date(),
              model: selectedModel,
              isApiResponse: true,
              isStreaming: true,
            };

            setMessages(prev => [...prev, streamingMessage]);

            // Use streaming API
            await client?.chatStream(truncatedMessages, 'deepseek-chat', {
              temperature: 0.7,
              max_tokens: 2048,
              onChunk: (content: string) => {
                setMessages(prev => prev.map(msg =>
                  msg.id === streamingMessageId
                    ? { ...msg, content: msg.content + content }
                    : msg
                ));
              },
              onComplete: () => {
                setMessages(prev => prev.map(msg =>
                  msg.id === streamingMessageId
                    ? { ...msg, isStreaming: false }
                    : msg
                ));
                setIsLoading(false);
              },
              onError: (error) => {
                console.error('Streaming error:', error);
                const errorContent = formatApiError(error);
                setMessages(prev => prev.map(msg =>
                  msg.id === streamingMessageId
                    ? {
                        ...msg,
                        content: errorContent + '\n\n💡 *提示：您可以重新发送消息重试*',
                        isStreaming: false
                      }
                    : msg
                ));
                setIsLoading(false);
              }
            });

            // Early return for streaming - loading state handled in callbacks
            return;
          } catch (error) {
            responseContent = formatApiError(error);
          }
        }
      } else {
        // 其他模型的处理逻辑
        if (selectedModel === 'deepseek-coder') {
          responseContent = enhanceCoderPrompt(userMessage.content);
        } else if (selectedModel === 'deepseek-reasoner') {
          responseContent = enhanceReasonerPrompt(userMessage.content);
        } else {
          responseContent = `# 提示增强

## 用户输入
${userMessage.content}

## 增强提示
请根据以上内容提供有帮助的回复。`;
        }
      }

      // 添加助手回复
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        model: selectedModel,
        isApiResponse: isApiResponse,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('生成失败:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '生成失败，请重试。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading, selectedModel, apiKey, messages]);

  // 防抖处理的发送函数 - 优化为200ms提升响应速度
  const debouncedHandleSend = useDebouncedCallback(
    () => handleSendInternal(userInput),
    200,
    [userInput]
  );



  /**
   * 处理键盘事件
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * 清除对话历史
   */
  const clearChat = () => {
    setMessages([]);
  };

  /**
   * 保存设置
   */
  const saveSettings = () => {
    // 保存到 localStorage
    if (apiKey.trim()) {
      localStorage.setItem('deepseek-api-key', apiKey.trim());
    }
    localStorage.setItem('selected-model', selectedModel);

    // 关闭设置面板
    setShowSettings(false);

    // 可以添加成功提示
    console.log('设置已保存');
  };

  /**
   * 加载设置
   */
  useEffect(() => {
    const savedApiKey = localStorage.getItem('deepseek-api-key');
    const savedModel = localStorage.getItem('selected-model') as 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner';

    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    if (savedModel) {
      setSelectedModel(savedModel);
    }
  }, []);

  /**
   * 清理客户端引用当 API 密钥改变时
   */
  useEffect(() => {
    optimizedClientRef.current = null;
  }, [apiKey]);

  return (
    <div className="window">
      {/* 侧边栏 */}
      <div className="sidebar">
        <div style={{ padding: '20px' }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '20px',
            color: '#ffffff' // Improved contrast for dark sidebar
          }}>
            🍀 EP - Enhanced Prompt
          </h1>

          <div style={{ marginBottom: '20px' }}>
            <IconButton
              icon={<SendIcon />}
              text="新对话"
              type="primary"
              onClick={clearChat}
              style={{ width: '100%', marginBottom: '10px' }}
            />


          </div>

          {/* 快速开始选项 */}
          <div style={{ marginTop: '30px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#ffffff' }}>
              快速开始
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { icon: '🚀', title: '代码生成', prompt: '帮我生成一个React组件' },
                { icon: '📝', title: '文档写作', prompt: '帮我写一份技术文档' },
                { icon: '🎯', title: '问题解答', prompt: '解释一下这个技术概念' },
                { icon: '🌐', title: '中英文翻译', prompt: '请翻译以下内容：' },
              ].map((item, index) => (
                <button
                  key={index}
                  onClick={() => setUserInput(item.prompt)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#e2e8f0', // Improved contrast for dark sidebar
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{item.icon}</span>
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 设置按钮 - 底部 */}
          <div style={{
            marginTop: 'auto',
            padding: '20px',
            borderTop: 'var(--border-in-light)'
          }}>
            <CenteredModal
              open={showSettings}
              onClose={() => setShowSettings(false)}
              content={
                <div style={{ padding: '20px', minWidth: '300px' }}>
                  <h3 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>设置</h3>

                  {/* DeepSeek API 配置 */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      DeepSeek API Key
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="输入您的 DeepSeek API Key"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: 'var(--border-in-light)',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'var(--gray)',
                        color: 'var(--black)'
                      }}
                    />
                  </div>

                  {/* 模型选择 */}
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      选择模型
                    </label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value as 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner')}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: 'var(--border-in-light)',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'var(--gray)',
                        color: 'var(--black)'
                      }}
                    >
                      <option value="deepseek-chat">💬 DeepSeek Chat (通用对话)</option>
                      <option value="deepseek-coder">👨‍💻 DeepSeek Coder (代码生成)</option>
                      <option value="deepseek-reasoner">🧠 DeepSeek Reasoner (逻辑推理)</option>
                    </select>
                  </div>

                  <button
                    onClick={saveSettings}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      backgroundColor: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgb(23, 117, 137)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--primary)';
                    }}
                  >
                    保存设置
                  </button>
                </div>
              }
            >
              <IconButton
                icon={<SettingsIcon />}
                text="设置"
                onClick={() => setShowSettings(!showSettings)}
                style={{ width: '100%' }}
              />
            </CenteredModal>
          </div>
        </div>
      </div>

      {/* 主聊天区域 */}
      <div className="window-content">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh'
        }}>
          {/* 聊天头部 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 20px',
            borderBottom: 'var(--border-in-light)',
            backgroundColor: 'var(--white)'
          }}>
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setShowPerformanceMonitor(true)}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-in-light)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Performance Monitor"
              >
                🚀 Monitor
              </button>

              <button
                onClick={() => setShowPerformanceDashboard(true)}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-in-light)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  color: 'var(--gray)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="性能监控"
              >
                📊 性能
              </button>
              <span style={{ fontSize: '12px', color: 'var(--gray)' }}>
                {messages.length} 条消息
              </span>
            </div>
          </div>

          {/* 消息区域 - 聊天式布局 */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '20px',
            backgroundColor: 'var(--gray)'
          }}>
            {messages.length === 0 ? (
              // 欢迎界面
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: 'var(--primary)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  fontSize: '32px'
                }}>
                  🍀
                </div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                  color: 'var(--black)'
                }}>
                  开始新对话
                </h2>
                <p style={{
                  fontSize: '16px',
                  color: 'var(--gray)',
                  maxWidth: '400px',
                  lineHeight: '1.5'
                }}>
                  输入您的项目需求，我将为您生成增强的提示词，帮助您获得更好的AI回复
                </p>
              </div>
            ) : (
              // 消息列表
              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="chat-message"
                    style={{
                      display: 'flex',
                      marginBottom: '20px',
                      justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '15px 20px',
                        borderRadius: message.type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        backgroundColor: message.type === 'user' ? 'var(--primary)' : 'var(--white)',
                        color: message.type === 'user' ? 'white' : 'var(--black)',
                        boxShadow: message.type === 'user'
                          ? '0 2px 12px rgba(34, 197, 94, 0.3)'
                          : '0 2px 8px rgba(0,0,0,0.1)',
                        position: 'relative',
                        border: message.type === 'assistant' ? '1px solid var(--border-in-light)' : 'none'
                      }}
                    >
                      <div style={{
                        fontSize: '14px',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {message.content}
                        {message.isStreaming && (
                          <span style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '14px',
                            backgroundColor: 'var(--primary)',
                            marginLeft: '2px',
                            animation: 'blink 1s infinite'
                          }}>|</span>
                        )}
                      </div>

                      {message.type === 'assistant' && (
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '10px',
                          paddingTop: '10px',
                          borderTop: '1px solid var(--border-in-light)'
                        }}>
                          <span style={{ fontSize: '12px', color: 'var(--gray)' }}>
                            {message.isApiResponse ? (
                              <>🤖 AI 回复 - {message.model === 'deepseek-chat' ? 'DeepSeek Chat' : message.model}</>
                            ) : (
                              <>
                                {message.model === 'deepseek-coder' && '👨‍💻 代码生成提示'}
                                {message.model === 'deepseek-reasoner' && '🧠 逻辑推理提示'}
                                {(!message.model || message.model === 'deepseek-chat') && '💬 增强提示'}
                              </>
                            )}
                          </span>
                          <CopyButton
                            content={message.content}
                            size="md"
                            variant="icon"
                            style={{
                              color: 'var(--gray)',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && !messages.some(m => m.isStreaming) && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    marginBottom: '20px'
                  }}>
                    <MessageLoadingBubble />
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          {/* 输入区域 - 固定在底部 */}
          <div style={{
            borderTop: 'var(--border-in-light)',
            backgroundColor: 'var(--white)',
            padding: '20px'
          }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ position: 'relative' }}>
                <textarea
                  ref={textareaRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入您的项目需求..."
                  className="chat-input"
                  style={{
                    width: '100%',
                    minHeight: '52px',
                    maxHeight: '200px',
                    padding: '15px 60px 15px 20px',
                    border: '2px solid var(--border-in-light)',
                    borderRadius: '26px',
                    fontSize: '14px',
                    resize: 'none',
                    backgroundColor: 'var(--gray)',
                    color: 'var(--black)',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!userInput.trim() || isLoading}
                  className="send-button"
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '36px',
                    height: '36px',
                    borderRadius: '18px',
                    border: 'none',
                    backgroundColor: userInput.trim() && !isLoading ? 'var(--primary)' : 'var(--gray)',
                    color: userInput.trim() && !isLoading ? 'white' : 'var(--text-color-secondary)',
                    cursor: userInput.trim() && !isLoading ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  title="发送消息"
                >
                  <SendIcon />
                </button>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '10px',
                fontSize: '12px',
                color: 'var(--gray)'
              }}>
                <span>按 Enter 发送，Shift + Enter 换行</span>
                <span>Powered by DeepSeek</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Dashboard */}
      <PerformanceDashboard
        isOpen={showPerformanceDashboard}
        onClose={() => setShowPerformanceDashboard(false)}
      />

      {/* Performance Monitor */}
      <PerformanceMonitor
        isOpen={showPerformanceMonitor}
        onClose={() => setShowPerformanceMonitor(false)}
        apiKey={apiKey}
      />
    </div>
  );
}
