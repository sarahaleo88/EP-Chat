/**
 * EP 主页面组件 - Chat 风格界面
 * 提供聊天式的提示增强界面，输入在底部，对话历史在顶部
 */

'use client';

import { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
import { IconButton } from './components/ui/button';
import { Card, Popover, CenteredModal } from './components/ui/ui-lib';
import SecureMessageRenderer, { useSanitizedInput } from './components/SecureMessageRenderer';
import {
  createDeepSeekClient,
  convertToDeepSeekMessages,
  truncateMessages,
  type DeepSeekMessage,
} from '../lib/deepseek-api';
import {
  createOptimizedDeepSeekClient,
  OptimizedApiError,
} from '../lib/optimized-deepseek-api';
import {
  createEnhancedDeepSeekClient,
  EnhancedDeepSeekClient,
} from '../lib/enhanced-deepseek-api';
import {
  enhanceReasonerPrompt,
  enhanceCoderPrompt,
} from '../lib/prompt-enhancers';
// 延迟导入模板注册表功能以减少初始包大小
const getTemplateCacheStats = () => import('../lib/template-registry').then(mod => mod.getTemplateCacheStats);
const forceCleanTemplateCache = () => import('../lib/template-registry').then(mod => mod.forceCleanTemplateCache);
const clearTemplateCache = () => import('../lib/template-registry').then(mod => mod.clearTemplateCache);
import { ModelSelector } from './components/ModelSelector';
import { MessageLoadingBubble } from './components/EnhancedLoadingIndicator';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { CopyButton } from './components/CopyButton';
import {
  formatUserFriendlyError,
  shouldAutoRetry,
  getRetryDelay,
} from '../lib/error-handler';
import { useDebouncedCallback } from '../hooks/useDebounce';
import {
  QuickButtonConfig,
  DEFAULT_QUICK_BUTTONS,
} from '../types/quickButtons';
import dynamic from 'next/dynamic';

// 动态导入重型组件以实现代码分割
const PerformanceDashboard = dynamic(
  () => import('./components/PerformanceDashboard').then(mod => ({ default: mod.PerformanceDashboard })),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded"></div>,
    ssr: false,
  }
);

const QuickButtonEditor = dynamic(
  () => import('./components/QuickButtonEditor'),
  {
    loading: () => <div className="animate-pulse bg-gray-200 h-16 rounded"></div>,
    ssr: false,
  }
);
import { SessionManager } from '../lib/session-manager';
import { useErrorHandler } from '../hooks/useErrorHandler';
import ErrorBoundary from './components/ErrorBoundary';
import { enhancePrompt } from '../lib/prompt-enhancer';
import { getCSRFApiClient, csrfPost } from '../lib/csrf-client';
import { useModelState } from './hooks/useModelState';

// 简单的图标组件
const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97L2.46 14.6c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.31.61.22l2.49-1c.52.39 1.06.73 1.69.98l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.25 1.17-.59 1.69-.98l2.49 1c.22.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" />
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
  </svg>
);

const StopIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" />
  </svg>
);

const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
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
function HomePage() {
  // 聊天式应用状态
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentError, setCurrentError] = useState<string | null>(null);

  // 移动端侧边栏状态
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // 关闭移动端侧边栏的处理函数 - 使用 useCallback 优化
  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
    // 恢复背景滚动
    document.body.classList.remove('mobile-sidebar-open');
  }, []);

  // 打开移动端侧边栏的处理函数
  const openMobileSidebar = () => {
    setIsMobileSidebarOpen(true);
    // 防止背景滚动穿透
    document.body.classList.add('mobile-sidebar-open');
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const optimizedClientRef = useRef<ReturnType<
    typeof createOptimizedDeepSeekClient
  > | null>(null);

  // 增强版 API 客户端引用（支持长文本和自动续写）
  const enhancedClientRef = useRef<EnhancedDeepSeekClient | null>(null);

  // 设置相关状态
  const [apiKey, setApiKey] = useState('');
  
  // 使用定制Hook管理模型状态
  const { selectedModel, handleModelChange, isInitialized } = useModelState();

  // Debug: Monitor selectedModel changes with enhanced logging
  useEffect(() => {
    // Safe development logging
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {

    }
  }, [selectedModel, isInitialized]);
  const [showPerformanceDashboard, setShowPerformanceDashboard] =
    useState(false);
  const [sessionAuthenticated, setSessionAuthenticated] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  // 发送/停止按钮状态
  const [isSending, setIsSending] = useState(false);
  const [currentAbortController, setCurrentAbortController] =
    useState<AbortController | null>(null);

  // 缓存管理状态
  const [cacheStats, setCacheStats] = useState<{
    api: {
      size: number;
      maxSize: number;
      utilization: number;
      expiredEntries: number;
      lastCleanup?: number;
    } | null;
    template: {
      size: number;
      maxSize: number;
      utilization: number;
      expiredEntries: number;
      lastCleanup?: number;
    } | null;
  } | null>(null);
  const [showCacheSection, setShowCacheSection] = useState(false);

  // 快速按钮状态
  const [quickButtons, setQuickButtons] = useState<QuickButtonConfig[]>(
    DEFAULT_QUICK_BUTTONS
  );
  const [activeButtonId, setActiveButtonId] = useState<number | null>(null);

  // 集中式错误处理
  const {
    handleError,
    handleApiError,
    handleComponentError,
    handleAsyncError,
    clearError,
    lastError
  } = useErrorHandler();

  // 安全的用户输入清理 - 直接调用Hook（已内置useMemo优化）
  const sanitizedUserInput = useSanitizedInput(userInput);

  // 优化消息列表渲染 - 使用 useMemo 避免不必要的重新计算
  const sortedMessages = useMemo(() => {
    return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [messages]);

  // 计算是否可以发送消息 - 使用 useMemo 优化
  const canSendMessage = useMemo(() => {
    return sanitizedUserInput.trim().length > 0 && !isLoading && !isSending;
  }, [sanitizedUserInput, isLoading, isSending]);

  // 计算当前会话状态 - 使用 useMemo 优化
  const sessionStatus = useMemo(() => {
    return {
      hasApiKey: sessionAuthenticated || apiKey.trim().length > 0,
      isReady: !sessionLoading && (sessionAuthenticated || apiKey.trim().length > 0),
      isLoading: sessionLoading,
    };
  }, [sessionAuthenticated, apiKey, sessionLoading]);

  // 快速按钮工具函数
  const loadQuickButtons = useCallback((): QuickButtonConfig[] => {
    try {
      // 确保只在客户端运行
      if (typeof window === 'undefined') {
        return DEFAULT_QUICK_BUTTONS;
      }

      const raw = localStorage.getItem('ep-chat-quick-buttons');
      if (!raw) {
        return DEFAULT_QUICK_BUTTONS;
      }

      const parsed = JSON.parse(raw);
      // 数据校验和修复逻辑
      if (!Array.isArray(parsed) || parsed.length !== 4) {
        return DEFAULT_QUICK_BUTTONS;
      }

      return parsed.map((btn: Partial<QuickButtonConfig>, index: number) => ({
        ...DEFAULT_QUICK_BUTTONS[index],
        ...btn,
        id: (index + 1) as 1 | 2 | 3 | 4,
      }) as QuickButtonConfig);
    } catch (error) {
      handleComponentError(error, 'loadQuickButtons', {
        action: 'load_quick_buttons_config'
      });
      return DEFAULT_QUICK_BUTTONS;
    }
  }, [handleComponentError]);

  const saveQuickButtons = (buttons: QuickButtonConfig[]) => {
    try {
      localStorage.setItem('ep-chat-quick-buttons', JSON.stringify(buttons));
    } catch (error) {
      handleComponentError(error, 'saveQuickButtons', {
        action: 'save_quick_buttons_config'
      });
    }
  };

  // 自动滚动到底部 - 使用 useCallback 优化
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [sortedMessages, scrollToBottom]);

  // 重置发送状态（当用户开始输入新内容时）
  const resetSendingState = useCallback(() => {
    if (isSending) {
      setIsSending(false);
      setCurrentAbortController(null);
    }
  }, [isSending]);

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
    return (
      text.startsWith('请翻译以下内容：') ||
      text.toLowerCase().includes('translate') ||
      text.includes('翻译')
    );
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
   * 注意：超时配置现在由 API 客户端内部根据模型动态处理
   */
  const getOptimizedClient = useCallback(() => {
    // Always recreate client if model or API key changed to ensure correct timeout
    if (!optimizedClientRef.current && apiKey.trim()) {

      optimizedClientRef.current = createOptimizedDeepSeekClient(
        apiKey.trim(),
        {
          maxRetries: 3,
          retryDelay: 1000,
          cacheSize: 50,
          cacheTtl: 3600000,
          // timeout is now handled dynamically by the API client based on model
        }
      );
    }
    return optimizedClientRef.current;
  }, [apiKey]);

  /**
   * 获取或创建增强版 API 客户端（支持长文本和自动续写）
   */
  const getEnhancedClient = useCallback(() => {
    if (!enhancedClientRef.current && apiKey.trim()) {
      if (process.env.NODE_ENV === 'development') {

      }
      enhancedClientRef.current = createEnhancedDeepSeekClient(
        apiKey.trim(),
        selectedModel
      );
    }
    return enhancedClientRef.current;
  }, [apiKey, selectedModel]);

  /**
   * 发送消息 - 模型特定的处理逻辑（优化版本）
   */
  const handleSendInternal = useCallback(
    async (inputText: string, attempt: number = 0) => {
      if (!inputText.trim() || isLoading || isSending) {
        return;
      }

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
      setIsSending(true);
      setRetryCount(attempt);

      // 创建新的 AbortController（如果是第一次尝试）
      if (attempt === 0) {
        const abortController = new AbortController();
        setCurrentAbortController(abortController);
      }

      try {
        let responseContent: string = ''; // Initialize with empty string
        let isApiResponse = false;

        // 根据选择的模型决定处理方式 - 所有模型都调用 API
        if (
          selectedModel === 'deepseek-chat' ||
          selectedModel === 'deepseek-coder' ||
          selectedModel === 'deepseek-reasoner'
        ) {
          // 所有 DeepSeek 模型: 调用实际 API
          if (!apiKey.trim()) {
            const modelName =
              selectedModel === 'deepseek-chat'
                ? 'Chat'
                : selectedModel === 'deepseek-coder'
                  ? 'Coder'
                  : 'Reasoner';
            responseContent = `❌ **API 密钥未配置**

请在设置中配置您的 DeepSeek API 密钥后再使用 ${modelName} 模式。

💡 **如何获取 API 密钥：**
1. 访问 [DeepSeek 官网](https://platform.deepseek.com/)
2. 注册并登录账户
3. 在 API 管理页面创建新的 API 密钥
4. 将密钥粘贴到设置中的 API 密钥字段

🔧 **所有模型都支持 API 调用：**
- **DeepSeek Chat** - 通用对话和问答
- **DeepSeek Coder** - 代码生成和编程帮助
- **DeepSeek Reasoner** - 逻辑推理和分析`;
          } else {
            try {
              // 获取优化的 API 客户端
              const optimizedClient = getOptimizedClient();
              if (!optimizedClient) {
                throw new Error('无法创建 API 客户端，请检查 API 密钥');
              }

              // 准备消息历史（包含当前消息）
              const allMessages =
                attempt === 0
                  ? [...messages, userMessage]
                  : [...messages.slice(0, -1), userMessage];
              const apiMessages = convertToDeepSeekMessages(allMessages);
              const truncatedMessages = truncateMessages(apiMessages, 3000);

              // 调用优化的 DeepSeek API，使用选择的模型
              const response = await optimizedClient.chat(
                truncatedMessages,
                selectedModel,
                {
                  temperature: 0.7,
                  max_tokens: 2048,
                }
              );

              responseContent =
                response.choices[0]?.message?.content ||
                '抱歉，没有收到有效的响应。';
              isApiResponse = true;
            } catch (error) {
              // 使用集中式错误处理
              const errorResult = handleApiError(error, {
                model: selectedModel,
                action: 'chat_completion',
                endpoint: '/api/generate',
                userId: 'anonymous',
                additionalData: { attempt, inputText: inputText.substring(0, 100) }
              });

              // 检查是否应该自动重试
              if (errorResult.shouldRetry && attempt < 3) {
                setIsLoading(false);
                const retryDelay = errorResult.retryDelay || 1000;

                setTimeout(() => {
                  handleSendInternal(inputText, attempt + 1);
                }, retryDelay);
                return;
              }

              responseContent = errorResult.userMessage;
              setCurrentError(errorResult.errorId);
            }
          }
        } else {
          // Fallback for unexpected model types
          responseContent = `❌ **不支持的模型类型**

当前选择的模型 "${selectedModel}" 不受支持。请选择以下模型之一：
- DeepSeek Chat
- DeepSeek Coder
- DeepSeek Reasoner`;
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
        // 使用集中式错误处理
        const errorResult = handleComponentError(error, 'handleSendInternal', {
          action: 'send_message_wrapper',
          model: selectedModel,
          additionalData: { inputText: inputText.substring(0, 100) }
        });

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: errorResult.userMessage,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        setIsSending(false);
        setCurrentAbortController(null);
      }
    },
    [isLoading, isSending, selectedModel, apiKey, messages, getOptimizedClient, handleApiError, handleComponentError]
  );

  // 优化的消息项组件 - 使用 memo 防止不必要的重新渲染
  const MessageItem = memo(({ message }: { message: Message }) => (
    <div
      key={message.id}
      className="chat-message"
      style={{
        display: 'flex',
        justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          maxWidth: '70%',
          padding: '12px 16px',
          borderRadius: '18px',
          backgroundColor: message.type === 'user' ? 'var(--primary)' : 'white',
          color: message.type === 'user' ? 'white' : 'var(--black)',
          border: message.type === 'assistant' ? '1px solid var(--border)' : 'none',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          position: 'relative',
        }}
      >
        {message.type === 'assistant' ? (
          <SecureMessageRenderer content={message.content} />
        ) : (
          <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
        )}

        <div
          style={{
            fontSize: '11px',
            opacity: 0.7,
            marginTop: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>
            {message.timestamp.toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {message.model && (
              <span
                style={{
                  marginLeft: '8px',
                  padding: '2px 6px',
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                  fontSize: '10px',
                }}
              >
                {message.model}
              </span>
            )}
          </span>
          {message.type === 'assistant' && (
            <CopyButton
              content={message.content}
              style={{ marginLeft: '8px', opacity: 0.5 }}
            />
          )}
        </div>

        {message.isStreaming && (
          <div
            style={{
              marginTop: '8px',
              fontSize: '11px',
              opacity: 0.7,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '2px',
                marginRight: '6px',
              }}
            >
              <div
                style={{
                  width: '4px',
                  height: '4px',
                  backgroundColor: 'currentColor',
                  borderRadius: '50%',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
              <div
                style={{
                  width: '4px',
                  height: '4px',
                  backgroundColor: 'currentColor',
                  borderRadius: '50%',
                  animation: 'pulse 1.5s ease-in-out infinite 0.5s',
                }}
              />
              <div
                style={{
                  width: '4px',
                  height: '4px',
                  backgroundColor: 'currentColor',
                  borderRadius: '50%',
                  animation: 'pulse 1.5s ease-in-out infinite 1s',
                }}
              />
            </div>
            正在生成...
          </div>
        )}
      </div>
    </div>
  ));

  MessageItem.displayName = 'MessageItem';

  // 增强版发送函数 - 支持条件增强链路
  const handleSend = useCallback(async () => {
    const trimmedInput = sanitizedUserInput.trim();
    if (!trimmedInput || isLoading || isSending) {
      return;
    }

    // 输入长度验证
    if (trimmedInput.length > 50000) { // 50K字符限制
      setCurrentError('输入内容过长，请控制在50,000字符以内');
      return;
    }

    const activeButton = quickButtons.find(btn => btn.id === activeButtonId);

    try {
      let processedInput = trimmedInput;
      let modelToUse = selectedModel;
      let displayContent = trimmedInput; // 用于显示的用户消息内容

      // 条件增强处理
      if (activeButton && activeButton.enabled) {
        const combinedPrompt = `${activeButton.prompt}\n\n${userInput}`.trim();
        processedInput = await enhancePrompt(combinedPrompt);
        modelToUse = activeButton.model;
        // 显示增强后的内容给用户看
        displayContent = `🚀 **${activeButton.title}模式**\n\n${userInput.trim()}`;
      }

      // 添加用户消息
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: displayContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setUserInput('');
      setIsLoading(true);
      setIsSending(true);

      // 创建新的 AbortController
      const abortController = new AbortController();
      setCurrentAbortController(abortController);

      if (
        modelToUse === 'deepseek-chat' ||
        modelToUse === 'deepseek-coder' ||
        modelToUse === 'deepseek-reasoner'
      ) {
        if (!apiKey.trim()) {
          const modelName =
            modelToUse === 'deepseek-chat'
              ? 'Chat'
              : modelToUse === 'deepseek-coder'
                ? 'Coder'
                : 'Reasoner';
          const responseContent = `❌ **API 密钥未配置**

请在设置中配置您的 DeepSeek API 密钥后再使用 ${modelName} 模式。`;

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: responseContent,
            timestamp: new Date(),
            model: modelToUse,
            isApiResponse: false,
          };

          setMessages(prev => [...prev, assistantMessage]);
        } else {
          try {
            const client = getOptimizedClient();

            // 构建消息历史 - 使用处理后的输入
            const messagesForApi = [
              ...messages,
              {
                ...userMessage,
                content: processedInput, // 使用增强后的内容调用 API
              },
            ];
            const apiMessages = convertToDeepSeekMessages(messagesForApi);
            const truncatedMessages = truncateMessages(apiMessages, 3000);

            // Create streaming assistant message
            const streamingMessageId = (Date.now() + 1).toString();
            const streamingMessage: Message = {
              id: streamingMessageId,
              type: 'assistant',
              content: '',
              timestamp: new Date(),
              model: modelToUse,
              isApiResponse: true,
              isStreaming: true,
            };

            setMessages(prev => [...prev, streamingMessage]);

            // 检查是否启用长文本守护
            const useLongOutputGuard = process.env.NEXT_PUBLIC_EP_LONG_OUTPUT_GUARD !== 'off';

            if (useLongOutputGuard) {
              // 使用增强版客户端处理长文本
              const enhancedClient = getEnhancedClient();
              if (enhancedClient) {
                await enhancedClient.chatStreamEnhanced(
                  truncatedMessages.map(m => ({ role: m.role, content: m.content })),
                  {
                    temperature: 0.7,
                    maxTokens: 8192, // 增加到8K输出
                    topP: 0.95,
                    maxContinuations: 5,
                    onChunk: (content: string, metadata) => {
                      setMessages(prev =>
                        prev.map(msg =>
                          msg.id === streamingMessageId
                            ? { ...msg, content: msg.content + content }
                            : msg
                        )
                      );
                    },
                    onContinuation: (context) => {
                      if (process.env.NODE_ENV === 'development') {

                      }
                      // 可以在这里显示续写提示
                    },
                    onComplete: (metadata) => {
                      if (process.env.NODE_ENV === 'development') {

                      }
                      setMessages(prev =>
                        prev.map(msg =>
                          msg.id === streamingMessageId
                            ? { ...msg, isStreaming: false }
                            : msg
                        )
                      );
                      setIsLoading(false);
                      setIsSending(false);
                      setCurrentAbortController(null);
                      setActiveButtonId(null);
                    },
                    onError: error => {
                      // 使用集中式错误处理
                      const errorResult = handleApiError(error, {
                        model: modelToUse,
                        action: 'streaming_chat',
                        endpoint: '/api/generate',
                        additionalData: { streamingMessageId }
                      });

                      setMessages(prev =>
                        prev.map(msg =>
                          msg.id === streamingMessageId
                            ? {
                                ...msg,
                                content: errorResult.userMessage,
                                isStreaming: false,
                              }
                            : msg
                        )
                      );
                      setIsLoading(false);
                      setIsSending(false);
                      setCurrentAbortController(null);
                      setActiveButtonId(null);
                    },
                  }
                );
              }
            } else {
              // 使用传统的流式API
              await client?.chatStream(truncatedMessages, modelToUse, {
                temperature: 0.7,
                max_tokens: 2048,
                onChunk: (content: string) => {
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === streamingMessageId
                        ? { ...msg, content: msg.content + content }
                        : msg
                    )
                  );
                },
                onComplete: () => {
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === streamingMessageId
                        ? { ...msg, isStreaming: false }
                        : msg
                    )
                  );
                  setIsLoading(false);
                  setIsSending(false);
                  setCurrentAbortController(null);
                  setActiveButtonId(null);
                },
                onError: error => {
                  // 使用用户友好的错误格式化
                  const friendlyError = formatUserFriendlyError(error, modelToUse);
                  // 移除控制台错误日志，避免向用户显示技术性信息
                  const errorContent = `❌ **${friendlyError.title}**

${friendlyError.message}

💡 **建议：**
${friendlyError.suggestion}

${friendlyError.retryable ? '您可以重新发送消息重试。' : '请检查设置后重试。'}`;

                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === streamingMessageId
                        ? {
                            ...msg,
                            content: errorContent,
                            isStreaming: false,
                          }
                        : msg
                    )
                  );
                  setIsLoading(false);
                  setIsSending(false);
                  setCurrentAbortController(null);
                  setActiveButtonId(null);
                },
              });
            }

            // Early return for streaming - loading state handled in callbacks
            return;
          } catch (error) {
            // 使用用户友好的错误格式化
            const friendlyError = formatUserFriendlyError(error, modelToUse);
            const responseContent = `❌ **${friendlyError.title}**

${friendlyError.message}

💡 **建议：**
${friendlyError.suggestion}

${friendlyError.retryable ? '您可以重新发送消息重试。' : '请检查设置后重试。'}`;

            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              type: 'assistant',
              content: responseContent,
              timestamp: new Date(),
              model: modelToUse,
              isApiResponse: false,
            };
            setMessages(prev => [...prev, assistantMessage]);
          }
        }
      } else {
        // Fallback for unexpected model types
        const responseContent = `❌ **不支持的模型类型**

当前选择的模型 "${modelToUse}" 不受支持。请选择以下模型之一：
- DeepSeek Chat
- DeepSeek Coder
- DeepSeek Reasoner`;

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: responseContent,
          timestamp: new Date(),
          model: modelToUse,
          isApiResponse: false,
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      // 移除控制台错误日志，避免向用户显示技术性信息
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '生成失败，请重试。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsSending(false);
      setCurrentAbortController(null);
      // 重置高亮状态
      setActiveButtonId(null);
    }
  }, [
    sanitizedUserInput,
    userInput, // 保留原始输入用于条件增强
    isLoading,
    isSending,
    selectedModel,
    apiKey,
    messages,
    activeButtonId,
    quickButtons,
    getOptimizedClient,
    getEnhancedClient,
  ]);

  // 防抖处理的发送函数 - 优化为200ms提升响应速度
  const debouncedHandleSend = useDebouncedCallback(
    () => handleSendInternal(userInput),
    200,
    [userInput]
  );

  /**
   * 快速按钮点击处理 - 更新为高亮模式
   */
  const handleQuickButtonClick = useCallback(
    (btn: QuickButtonConfig) => {
      if (!btn.enabled || isLoading || isSending) {
        return;
      }

      // 设置高亮状态
      setActiveButtonId(btn.id);

      // 聚焦输入框，让用户输入补充内容
      textareaRef.current?.focus();

      // 不再直接填充或执行，等待用户输入后发送
    },
    [isLoading, isSending]
  );

  /**
   * 停止当前的 AI 响应生成
   */
  const handleStop = useCallback(() => {
    if (currentAbortController) {
      currentAbortController.abort();
    }

    // 如果有优化客户端，也调用其 cancel 方法
    const client = getOptimizedClient();
    if (client) {
      client.cancel();
    }

    // 如果有增强版客户端，也调用其 cancel 方法
    const enhancedClient = getEnhancedClient();
    if (enhancedClient) {
      enhancedClient.cancel();
    }

    // 重置状态
    setIsSending(false);
    setIsLoading(false);
    setCurrentAbortController(null);

    // 标记最后一条消息为被中断（如果是流式消息）
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      if (
        lastMessage &&
        lastMessage.type === 'assistant' &&
        lastMessage.isStreaming
      ) {
        return prev.map((msg, index) =>
          index === prev.length - 1
            ? {
                ...msg,
                content: msg.content + '\n\n*[响应已被用户中断]*',
                isStreaming: false,
              }
            : msg
        );
      }
      return prev;
    });
  }, [currentAbortController, getOptimizedClient, getEnhancedClient]);

  /**
   * 处理键盘事件
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isSending) {
        handleStop();
      } else {
        handleSend();
      }
    }
  };

  /**
   * 清除对话历史
   */
  const clearChat = () => {
    setMessages([]);
    // 重置高亮状态
    setActiveButtonId(null);

    // Smart cache cleanup on new conversation
    performSmartCacheCleanup();
  };

  /**
   * 智能缓存清理 - 仅在需要时清理
   */
  const performSmartCacheCleanup = useCallback(async () => {
    try {
      let cleanupPerformed = false;

      // Check API cache health
      const client = getOptimizedClient();
      if (client) {
        const stats = client.getCacheStats();

        // Cleanup if cache is >80% full OR has >25% expired entries
        const shouldCleanupApi =
          stats.utilization > 80 ||
          (stats.expiredEntries > 0 &&
            stats.expiredEntries / stats.size > 0.25);

        if (shouldCleanupApi) {
          const result = client.forceCleanup();

          cleanupPerformed = true;
        }
      }

      // Check template cache health
      try {
        const getStats = await getTemplateCacheStats();
        const templateStats = getStats();
        const shouldCleanupTemplate =
          templateStats.utilization > 80 || templateStats.expiredEntries > 10;

        if (shouldCleanupTemplate) {
          const forceClean = await forceCleanTemplateCache();
          const result = forceClean();
          if (process.env.NODE_ENV === 'development') {

          }
          cleanupPerformed = true;
        }
      } catch (error) {
        console.warn('Template cache check failed:', error);
      }

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Smart cache cleanup failed:', error);
      }
    }
  }, [getOptimizedClient]);

  /**
   * 获取缓存统计信息
   */
  const loadCacheStats = useCallback(async () => {
    try {
      const client = getOptimizedClient();
      const apiStats = client ? client.getCacheStats() : null;

      // 异步加载模板统计
      let templateStats = null;
      try {
        const getStats = await getTemplateCacheStats();
        templateStats = getStats();
      } catch (error) {
        console.warn('Failed to load template stats:', error);
      }

      setCacheStats({
        api: apiStats,
        template: templateStats,
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load cache stats:', error);
      }
    }
  }, [getOptimizedClient]);

  /**
   * 清理所有缓存
   */
  const clearAllCaches = useCallback(async () => {
    try {
      // 清理 API 缓存
      const client = getOptimizedClient();
      if (client) {
        client.clearCache();
      }

      // 清理模板缓存
      try {
        const clearCache = await clearTemplateCache();
        clearCache();
      } catch (error) {
        console.warn('Failed to clear template cache:', error);
      }

      // 重新加载统计信息
      loadCacheStats();

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to clear caches:', error);
      }
    }
  }, [getOptimizedClient, loadCacheStats]);

  /**
   * 清理过期缓存
   */
  const cleanExpiredCaches = useCallback(async () => {
    try {
      // 清理 API 缓存中的过期条目
      const client = getOptimizedClient();
      let apiCleaned = 0;
      if (client) {
        const result = client.forceCleanup();
        apiCleaned = result.cleaned;
      }

      // 清理模板缓存中的过期条目
      let templateResult = null;
      try {
        const forceClean = await forceCleanTemplateCache();
        templateResult = forceClean();
      } catch (error) {
        console.warn('Failed to force clean template cache:', error);
      }

      // 重新加载统计信息
      loadCacheStats();

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to clean expired caches:', error);
      }
    }
  }, [getOptimizedClient, loadCacheStats]);

  /**
   * 保存设置 - 使用 useCallback 优化
   */
  const saveSettings = useCallback(async () => {
    // 保存 API key 到安全会话
    if (apiKey.trim()) {
      const result = await SessionManager.createSession(apiKey.trim());
      if (result.success) {
        setSessionAuthenticated(true);
        // 移除任何遗留的 localStorage API key
        localStorage.removeItem('deepseek-api-key');
      } else {
        console.error('Failed to create secure session:', result.error);
        // 显示错误消息给用户
        alert('Failed to save API key securely. Please try again.');
        return;
      }
    }
    // 模型状态由useModelState Hook管理，不需要手动保存

    // 关闭设置面板
    setShowSettings(false);

    // 在移动端设备上，保存设置后自动关闭侧边栏
    if (window.innerWidth <= 768) {
      closeMobileSidebar();
    }

    // Log success in development only
    if (process.env.NODE_ENV === 'development') {

    }
  }, [apiKey, selectedModel, setSessionAuthenticated, closeMobileSidebar]);

  /**
   * 加载设置和初始化会话
   */
  useEffect(() => {
    let isMounted = true; // 用于检查组件是否仍然挂载
    const initAbortController = new AbortController();

    const initializeSession = async () => {
      if (!isMounted) {
        return;
      }

      setSessionLoading(true);

      try {
        // 首先检查是否有有效的会话
        const sessionStatus = await SessionManager.validateSession();

        if (!isMounted || initAbortController.signal.aborted) {
          return;
        }

        if (sessionStatus.authenticated && sessionStatus.hasApiKey) {
          setSessionAuthenticated(true);
          setApiKey('***'); // 显示占位符，实际密钥在服务端
        } else {
          // 尝试从 localStorage 迁移
          const migrationResult = await SessionManager.migrateFromLocalStorage();

          if (!isMounted || initAbortController.signal.aborted) return;

          if (migrationResult.success && migrationResult.migrated) {
            setSessionAuthenticated(true);
            setApiKey('***'); // 显示占位符
          } else {
            // 检查是否有遗留的 localStorage API key
            const savedApiKey = localStorage.getItem('deepseek-api-key');
            if (savedApiKey && isMounted) {
              setApiKey(savedApiKey);
            }
          }
        }

        if (!isMounted || initAbortController.signal.aborted) return;

        // 模型状态现在由useModelState Hook管理，不需要在这里初始化

        // 加载快速按钮配置
        const loadedButtons = loadQuickButtons();
        setQuickButtons(loadedButtons);
      } catch (error) {
        if (!initAbortController.signal.aborted) {
          handleAsyncError(error, 'session_initialization', {
            component: 'HomePage',
            additionalData: { aborted: initAbortController.signal.aborted }
          });
        }
      } finally {
        if (isMounted) {
          setSessionLoading(false);
        }
      }
    };

    initializeSession();

    // 清理函数
    return () => {
      isMounted = false;
      initAbortController.abort();
    };
  }, [handleAsyncError, loadQuickButtons]);

  /**
   * 清理客户端引用当 API 密钥或模型改变时
   */
  useEffect(() => {
    // 创建一个 AbortController 来管理这个 effect 的清理
    const effectAbortController = new AbortController();

    if (process.env.NODE_ENV === 'development') {

    }

    // Cancel any ongoing requests before clearing
    if (optimizedClientRef.current) {
      try {
        optimizedClientRef.current.cancel();
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Client] Error canceling previous requests:', error);
        }
      }
    }
    optimizedClientRef.current = null;

    // Cancel and clear enhanced client
    if (enhancedClientRef.current) {
      try {
        enhancedClientRef.current.cancel();
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Enhanced Client] Error canceling previous requests:', error);
        }
      }
    }
    enhancedClientRef.current = null;

    // 清理函数
    return () => {
      if (process.env.NODE_ENV === 'development') {

      }

      // 中止任何正在进行的操作
      effectAbortController.abort();

      // 确保客户端被正确清理
      if (optimizedClientRef.current) {
        try {
          optimizedClientRef.current.cancel();
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[Cleanup] Error canceling optimized client:', error);
          }
        }
        optimizedClientRef.current = null;
      }

      if (enhancedClientRef.current) {
        try {
          enhancedClientRef.current.cancel();
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[Cleanup] Error canceling enhanced client:', error);
          }
        }
        enhancedClientRef.current = null;
      }
    };
  }, [apiKey, selectedModel]);

  /**
   * 组件卸载时清理资源
   */
  useEffect(() => {
    return () => {
      if (process.env.NODE_ENV === 'development') {

      }

      // 清理 AbortController
      if (currentAbortController) {
        try {
          currentAbortController.abort();
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[Cleanup] Error aborting controller:', error);
          }
        }
      }

      // 清理客户端
      const client = optimizedClientRef.current;
      if (client) {
        try {
          client.cancel();
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[Cleanup] Error canceling optimized client:', error);
          }
        }
      }

      // 清理增强版客户端
      const enhancedClient = enhancedClientRef.current;
      if (enhancedClient) {
        try {
          enhancedClient.dispose();
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[Cleanup] Error disposing enhanced client:', error);
          }
        }
      }

      // 清理移动端侧边栏状态
      try {
        document.body.classList.remove('mobile-sidebar-open');
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Cleanup] Error removing mobile sidebar class:', error);
        }
      }

      // 清理引用
      optimizedClientRef.current = null;
      enhancedClientRef.current = null;
    };
  }, [currentAbortController]);

  return (
    <ErrorBoundary
      onError={(error, errorInfo, errorId) => {
        handleComponentError(error, 'HomePage', {
          action: 'render',
          additionalData: { errorId, componentStack: errorInfo.componentStack }
        });
      }}
    >
      <div className="window">
      {/* 移动端侧边栏遮罩层 */}
      {isMobileSidebarOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={closeMobileSidebar}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            display: 'block',
            cursor: 'pointer',
          }}
          role="button"
          aria-label="关闭侧边栏"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
              closeMobileSidebar();
            }
          }}
        />
      )}

      {/* 侧边栏 */}
      <div className={`sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div style={{ padding: '20px' }}>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '20px',
              color: '#ffffff', // Improved contrast for dark sidebar
            }}
          >
            🍀 EP Chat
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

          {/* 快速开始选项 - 动态渲染 */}
          <div style={{ marginTop: '30px' }}>
            <h3
              style={{
                fontSize: '16px',
                marginBottom: '15px',
                color: '#ffffff',
              }}
            >
              快速开始
            </h3>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              {quickButtons
                .filter(btn => btn.enabled)
                .map(btn => {
                  const isActive = activeButtonId === btn.id;
                  return (
                    <button
                      key={btn.id}
                      onClick={() => handleQuickButtonClick(btn)}
                      disabled={isLoading || isSending}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px',
                        background: isActive ? 'var(--primary)' : 'transparent',
                        border: isActive ? '1px solid #38BDF8' : 'none',
                        borderRadius: '8px',
                        cursor:
                          isLoading || isSending ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        color: isActive
                          ? 'white'
                          : isLoading || isSending
                            ? 'var(--text-color-secondary)'
                            : '#e2e8f0',
                        transition: 'all 0.15s ease-in-out',
                        opacity: isLoading || isSending ? 0.5 : 1,
                        boxShadow: isActive ? '0 0 0 1px #38BDF8' : 'none',
                      }}
                      onMouseEnter={e => {
                        if (!isLoading && !isSending && !isActive) {
                          e.currentTarget.style.backgroundColor =
                            'rgba(255, 255, 255, 0.1)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                      title={`${btn.title} - 点击激活增强模式`}
                    >
                      <span style={{ fontSize: '16px' }}>{btn.icon}</span>
                      <span>{btn.title}</span>
                      {isActive && (
                        <span style={{ fontSize: '12px', color: '#38BDF8' }}>
                          ✨
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* 设置按钮 - 底部 */}
          <div
            style={{
              marginTop: 'auto',
              padding: '20px',
              borderTop: 'var(--border-in-light)',
            }}
          >
            <CenteredModal
              open={showSettings}
              onClose={() => setShowSettings(false)}
              content={
                <div style={{ padding: '20px', minWidth: '300px' }}>
                  <h3
                    style={{
                      marginBottom: '15px',
                      fontSize: '16px',
                      fontWeight: '600',
                    }}
                  >
                    设置
                  </h3>

                  {/* DeepSeek API 配置 */}
                  <div style={{ marginBottom: '20px' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      DeepSeek API Key
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      placeholder="输入您的 DeepSeek API Key"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: 'var(--border-in-light)',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'var(--gray)',
                        color: 'var(--black)',
                      }}
                    />
                  </div>

                  {/* 模型选择 */}
                  <div style={{ marginBottom: '15px' }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      选择模型
                    </label>
                    <select
                      value={selectedModel}
                      onChange={e =>
                        handleModelChange(
                          e.target.value as
                            | 'deepseek-chat'
                            | 'deepseek-coder'
                            | 'deepseek-reasoner'
                        )
                      }
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: 'var(--border-in-light)',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'var(--gray)',
                        color: 'var(--black)',
                      }}
                    >
                      <option value="deepseek-chat">
                        💬 DeepSeek Chat (通用对话)
                      </option>
                      <option value="deepseek-coder">
                        👨‍💻 DeepSeek Coder (代码生成)
                      </option>
                      <option value="deepseek-reasoner">
                        🧠 DeepSeek Reasoner (逻辑推理)
                      </option>
                    </select>
                  </div>

                  {/* 快速按钮配置区域 */}
                  <div
                    style={{
                      marginBottom: '20px',
                      borderTop: '1px solid var(--border-in-light)',
                      paddingTop: '15px',
                    }}
                  >
                    <h4
                      style={{
                        marginBottom: '15px',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      快速按钮配置
                    </h4>

                    {quickButtons.map((btn, index) => (
                      <QuickButtonEditor
                        key={btn.id}
                        data={btn}
                        onChange={updatedBtn => {
                          const newButtons = [...quickButtons];
                          newButtons[index] = updatedBtn;
                          setQuickButtons(newButtons);
                          saveQuickButtons(newButtons);
                        }}
                      />
                    ))}

                    <button
                      onClick={() => {
                        setQuickButtons(DEFAULT_QUICK_BUTTONS);
                        saveQuickButtons(DEFAULT_QUICK_BUTTONS);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--gray)',
                        color: 'var(--black)',
                        border: '1px solid var(--border-in-light)',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        marginTop: '10px',
                      }}
                    >
                      重置为默认配置
                    </button>
                  </div>

                  {/* 缓存管理部分 */}
                  <div
                    style={{
                      marginBottom: '20px',
                      borderTop: '1px solid var(--border-in-light)',
                      paddingTop: '15px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        marginBottom: '10px',
                      }}
                      onClick={() => {
                        setShowCacheSection(!showCacheSection);
                        if (!showCacheSection) {
                          loadCacheStats();
                        }
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>
                        缓存管理
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--gray)' }}>
                        {showCacheSection ? '▼' : '▶'}
                      </span>
                    </div>

                    {showCacheSection && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-color-secondary)',
                        }}
                      >
                        {cacheStats && (
                          <div style={{ marginBottom: '10px' }}>
                            <div style={{ marginBottom: '5px' }}>
                              <strong>API 缓存:</strong>{' '}
                              {cacheStats.api?.size || 0}/
                              {cacheStats.api?.maxSize || 0}(
                              {(cacheStats.api?.utilization || 0).toFixed(1)}%)
                              {(cacheStats.api?.expiredEntries || 0) > 0 && (
                                <span style={{ color: '#f59e0b' }}>
                                  {' '}
                                  | {cacheStats.api?.expiredEntries} 过期
                                </span>
                              )}
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                              <strong>模板缓存:</strong>{' '}
                              {cacheStats.template?.size || 0}/
                              {cacheStats.template?.maxSize || 0}(
                              {(cacheStats.template?.utilization || 0).toFixed(
                                1
                              )}
                              %)
                              {(cacheStats.template?.expiredEntries || 0) > 0 && (
                                <span style={{ color: '#f59e0b' }}>
                                  {' '}
                                  | {cacheStats.template?.expiredEntries} 过期
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <button
                            onClick={cleanExpiredCaches}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer',
                            }}
                          >
                            清理过期
                          </button>
                          <button
                            onClick={clearAllCaches}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer',
                            }}
                          >
                            清空所有
                          </button>
                          <button
                            onClick={loadCacheStats}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: 'var(--gray)',
                              color: 'var(--black)',
                              border: '1px solid var(--border-in-light)',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer',
                            }}
                          >
                            刷新
                          </button>
                        </div>
                      </div>
                    )}
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
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor =
                        'rgb(23, 117, 137)';
                    }}
                    onMouseLeave={e => {
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
          }}
        >
          {/* 聊天头部 */}
          <div
            className="chat-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 20px',
              borderBottom: 'var(--border-in-light)',
              backgroundColor: 'var(--white)',
            }}
          >
            {/* 移动端汉堡菜单按钮 */}
            <button
              className="mobile-hamburger-menu"
              onClick={() => isMobileSidebarOpen ? closeMobileSidebar() : openMobileSidebar()}
              style={{
                display: 'none', // Hidden by default, shown on mobile via CSS
                background: 'none',
                border: '1px solid var(--border-in-light)',
                borderRadius: '6px',
                padding: '8px',
                cursor: 'pointer',
                color: 'var(--primary)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={isMobileSidebarOpen ? '关闭菜单' : '打开菜单'}
            >
              {isMobileSidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
            </button>

            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
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
                  gap: '4px',
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
                  gap: '4px',
                }}
                title="性能监控"
              >
                📊 性能
              </button>
              <span style={{ fontSize: '12px', color: 'var(--gray)' }}>
                {sortedMessages.length} 条消息
              </span>
            </div>
          </div>

          {/* 消息区域 - 聊天式布局 */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '20px',
              backgroundColor: 'var(--gray)',
            }}
          >
            {sortedMessages.length === 0 ? (
              // 欢迎界面
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: 'var(--primary)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                    fontSize: '32px',
                  }}
                >
                  🍀
                </div>
                <h2
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    marginBottom: '10px',
                    color: 'var(--black)',
                  }}
                >
                  开始新对话
                </h2>
                <p
                  style={{
                    fontSize: '16px',
                    color: 'var(--gray)',
                    maxWidth: '400px',
                    lineHeight: '1.5',
                  }}
                >
                  输入您的项目需求，我将为您生成增强的提示词，帮助您获得更好的AI回复
                </p>
              </div>
            ) : (
              // 消息列表 - 使用优化的排序和渲染
              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {sortedMessages.map(message => (
                  <div
                    key={message.id}
                    className="chat-message"
                    style={{
                      display: 'flex',
                      marginBottom: '20px',
                      justifyContent:
                        message.type === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '15px 20px',
                        borderRadius:
                          message.type === 'user'
                            ? '18px 18px 4px 18px'
                            : '18px 18px 18px 4px',
                        backgroundColor:
                          message.type === 'user'
                            ? 'var(--primary)'
                            : 'var(--white)',
                        color:
                          message.type === 'user' ? 'white' : 'var(--black)',
                        boxShadow:
                          message.type === 'user'
                            ? '0 2px 12px rgba(34, 197, 94, 0.3)'
                            : '0 2px 8px rgba(0,0,0,0.1)',
                        position: 'relative',
                        border:
                          message.type === 'assistant'
                            ? '1px solid var(--border-in-light)'
                            : 'none',
                      }}
                    >
                      <SecureMessageRenderer
                        content={message.content}
                        isStreaming={message.isStreaming}
                        className="text-sm leading-relaxed whitespace-pre-wrap"
                      />

                      {message.type === 'assistant' && (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '10px',
                            paddingTop: '10px',
                            borderTop: '1px solid var(--border-in-light)',
                          }}
                        >
                          <span
                            style={{ fontSize: '12px', color: 'var(--gray)' }}
                          >
                            {message.isApiResponse ? (
                              <>
                                🤖 AI 回复 -{' '}
                                {message.model === 'deepseek-chat'
                                  ? 'DeepSeek Chat'
                                  : message.model}
                              </>
                            ) : (
                              <>
                                {message.model === 'deepseek-coder' &&
                                  '👨‍💻 代码生成提示'}
                                {message.model === 'deepseek-reasoner' &&
                                  '🧠 逻辑推理提示'}
                                {(!message.model ||
                                  message.model === 'deepseek-chat') &&
                                  '💬 增强提示'}
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

                {isLoading && !sortedMessages.some(m => m.isStreaming) && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                      marginBottom: '20px',
                    }}
                  >
                    <MessageLoadingBubble model={selectedModel} />
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          {/* 输入区域 - 固定在底部 */}
          <div
            style={{
              borderTop: 'var(--border-in-light)',
              backgroundColor: 'var(--white)',
              padding: '20px',
            }}
          >
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ position: 'relative' }}>
                <textarea
                  ref={textareaRef}
                  value={userInput}
                  onChange={e => {
                    setUserInput(e.target.value);
                    // 当用户开始输入时，如果正在发送状态，重置状态
                    if (isSending && e.target.value !== userInput) {
                      resetSendingState();
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  onFocus={resetSendingState}
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
                    transition: 'all 0.2s ease-in-out',
                  }}
                  disabled={isLoading}
                />
                <button
                  onClick={isSending ? handleStop : handleSend}
                  disabled={!isSending && (!userInput.trim() || isLoading)}
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
                    backgroundColor: isSending
                      ? 'rgb(107, 114, 128)' // gray-500 for softer stop state
                      : userInput.trim() && !isLoading
                        ? 'var(--primary)'
                        : 'var(--gray)', // teal primary for send state
                    color:
                      isSending || (userInput.trim() && !isLoading)
                        ? 'white'
                        : 'var(--text-color-secondary)',
                    cursor:
                      isSending || (userInput.trim() && !isLoading)
                        ? 'pointer'
                        : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                  title={isSending ? '停止生成' : '发送消息'}
                >
                  {isSending ? <StopIcon /> : <SendIcon />}
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '10px',
                  fontSize: '12px',
                  color: 'var(--gray)',
                }}
              >
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
    </ErrorBoundary>
  );
}

// 使用 React.memo 优化主组件，防止不必要的重新渲染
export default memo(HomePage);
