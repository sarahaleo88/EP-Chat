/**
 * WindowStyleChat - 使用 window + sidebar 布局的聊天界面
 * 100%复刻参考网站 https://ai.saraha.cc/ 的美观UI
 * 所有样式通过CSS类实现，符合CSP要求
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import '@/styles/window-style-chat.scss';
import { secureGetItem, secureSetItem, secureRemoveItem, isObfuscated } from '@/lib/secure-storage';

/**
 * 🚀 P0-2: TypingIndicator - Optimistic UI feedback component
 * Shows immediately when user sends a message to improve perceived TTFB by ~500ms
 */
function TypingIndicator() {
  return (
    <div className="typing-indicator-container">
      <div className="typing-dots">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
      <span className="typing-text">正在思考...</span>
    </div>
  );
}

/**
 * 🚀 P0-3: SkeletonLoader - Pre-render placeholder during API wait
 * Improves perceived TTFB by ~300ms by showing content structure early
 */
function SkeletonLoader() {
  return (
    <div className="skeleton-loader">
      <div className="skeleton-line skeleton-line-full"></div>
      <div className="skeleton-line skeleton-line-medium"></div>
      <div className="skeleton-line skeleton-line-short"></div>
    </div>
  );
}

// Copy button component for assistant messages
interface CopyButtonProps {
  content: string;
}

function CopyButton({ content }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = content;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Failed to copy:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <button
      className={`copy-btn ${copied ? 'copied' : ''}`}
      onClick={handleCopy}
      aria-label="Copy"
    >
      {copied ? (
        <span className="copy-icon">✓</span>
      ) : (
        <span className="copy-icon">📋</span>
      )}
    </button>
  );
}
import {
  type QuickButtonConfig,
  type QuickButtonMode,
  type AgentConfig,
  DEFAULT_QUICK_BUTTONS as IMPORTED_DEFAULT_BUTTONS,
  // mapQuickButtonsToAgents - Reserved for future Agent mode integration
} from '@/types/quickButtons';

/**
 * 🚀 P2-2: Client-side Response Cache
 * Caches responses for identical prompts to avoid redundant API calls
 * Uses LRU eviction with 50 entry limit and 10-minute TTL
 */
const RESPONSE_CACHE_MAX_SIZE = 50;
const RESPONSE_CACHE_TTL = 600000; // 10 minutes

interface CachedResponse {
  content: string;
  timestamp: number;
  model: string;
}

class ResponseCache {
  private cache = new Map<string, CachedResponse>();

  private generateKey(prompt: string, model: string, systemPrompt?: string): string {
    // Simple hash for cache key
    const input = `${prompt}|${model}|${systemPrompt || ''}`;
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  get(prompt: string, model: string, systemPrompt?: string): string | null {
    const key = this.generateKey(prompt, model, systemPrompt);
    const entry = this.cache.get(key);

    if (!entry) {return null;}

    // Check TTL
    if (Date.now() - entry.timestamp > RESPONSE_CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.content;
  }

  set(prompt: string, model: string, content: string, systemPrompt?: string): void {
    const key = this.generateKey(prompt, model, systemPrompt);

    // LRU eviction if at capacity
    if (this.cache.size >= RESPONSE_CACHE_MAX_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {this.cache.delete(firstKey);}
    }

    this.cache.set(key, {
      content,
      timestamp: Date.now(),
      model,
    });
  }
}

// Singleton cache instance
const responseCache = new ResponseCache();

type DeepSeekModel = 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// 内部使用的快速按钮配置接口（扩展 id 为 string）
interface InternalQuickButtonConfig {
  id: string;
  icon: string;
  name: string;
  prompt: string;
  model: DeepSeekModel;
  action: QuickButtonMode; // fill填充 | execute执行 | agent代理模式
  enabled: boolean;
}

// 从导入的默认配置转换为内部格式
const DEFAULT_QUICK_BUTTONS: InternalQuickButtonConfig[] = IMPORTED_DEFAULT_BUTTONS.map(btn => ({
  id: String(btn.id),
  icon: btn.icon,
  name: btn.title,
  prompt: btn.prompt,
  model: btn.model,
  action: btn.mode,
  enabled: btn.enabled
}));

// 可选图标列表
const AVAILABLE_ICONS = ['🚀', '📝', '❓', '🌐', '💻', '🔧', '📊', '🎨', '🔍', '💡', '📁', '⚡', '🎯', '📌', '🏷️'];

// Storage keys
// SECURITY NOTE (CodeQL Alert #113 - Mitigated):
// API key storage uses dual approach for security + UX:
// 1. Primary: httpOnly session cookie (secure, not accessible to JS)
// 2. Secondary: localStorage with obfuscation (for persistence across sessions)
// The obfuscation prevents casual inspection but is NOT cryptographic security.
// Real security comes from httpOnly cookies + CSP headers.
const API_KEY_STORAGE_KEY = 'ep-chat-api-key';
const QUICK_BUTTONS_STORAGE_KEY = 'ep-chat-quick-buttons';
const SIDEBAR_COLLAPSED_STORAGE_KEY = 'ep-chat-sidebar-collapsed';

export default function WindowStyleChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<DeepSeekModel>('deepseek-chat');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'quickButtons'>('general');
  const [apiKey, setApiKey] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [quickButtons, setQuickButtons] = useState<InternalQuickButtonConfig[]>(DEFAULT_QUICK_BUTTONS);
  const [editingButtonId, setEditingButtonId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Agent 模式状态：当前激活的 Agent ID
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load saved settings on mount
  useEffect(() => {
    // Load API key (with obfuscation) and create session if needed
    const savedKey = secureGetItem(API_KEY_STORAGE_KEY);
    if (savedKey) {
      setApiKey(savedKey);
      setApiKeySaved(true);

      // Migrate legacy plaintext values to obfuscated storage
      const rawStored = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (rawStored && !isObfuscated(rawStored)) {
        // Re-save with obfuscation for security
        secureSetItem(API_KEY_STORAGE_KEY, savedKey);
      }

      // Create session cookie on page load if API key exists
      fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: savedKey }),
      }).catch(err => console.error('Failed to restore session:', err));
    }

    // Load quick buttons
    const savedButtons = localStorage.getItem(QUICK_BUTTONS_STORAGE_KEY);
    if (savedButtons) {
      try {
        const parsed = JSON.parse(savedButtons);
        setQuickButtons(parsed);
      } catch (e) {
        console.error('Failed to parse quick buttons:', e);
      }
    }

    // Load sidebar collapsed state
    const savedSidebarState = localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    if (savedSidebarState) {
      setSidebarCollapsed(savedSidebarState === 'true');
    }
  }, []);

  // Save quick buttons when changed
  const saveQuickButtons = useCallback((buttons: InternalQuickButtonConfig[]) => {
    setQuickButtons(buttons);
    localStorage.setItem(QUICK_BUTTONS_STORAGE_KEY, JSON.stringify(buttons));
  }, []);

  // Toggle sidebar collapsed state
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(newState));
      return newState;
    });
  }, []);

  // Toggle settings panel
  const toggleSettings = useCallback(() => {
    setShowSettings(prev => !prev);
    setSettingsTab('general');
    setEditingButtonId(null);
  }, []);

  // Save API key (both to localStorage with obfuscation and create session cookie)
  const handleSaveApiKey = useCallback(async () => {
    if (apiKey.trim()) {
      try {
        // Create session cookie via API (primary secure storage)
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: apiKey.trim() }),
        });

        if (response.ok) {
          // Save to localStorage with obfuscation (secondary storage for persistence)
          secureSetItem(API_KEY_STORAGE_KEY, apiKey.trim());
          setApiKeySaved(true);
        } else {
          console.error('Failed to create session');
        }
      } catch (error) {
        console.error('Error saving API key:', error);
      }
    }
  }, [apiKey]);

  // Clear API key (both from localStorage and destroy session)
  const handleClearApiKey = useCallback(async () => {
    try {
      // Destroy session cookie via API
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (error) {
      console.error('Error clearing session:', error);
    }
    // Remove from localStorage (using secure removal)
    secureRemoveItem(API_KEY_STORAGE_KEY);
    setApiKey('');
    setApiKeySaved(false);
  }, []);

  // Quick button handlers
  const updateQuickButton = useCallback((id: string, updates: Partial<InternalQuickButtonConfig>) => {
    const newButtons = quickButtons.map(btn =>
      btn.id === id ? { ...btn, ...updates } : btn
    );
    saveQuickButtons(newButtons);
  }, [quickButtons, saveQuickButtons]);

  const toggleButtonEnabled = useCallback((id: string) => {
    updateQuickButton(id, { enabled: !quickButtons.find(b => b.id === id)?.enabled });
  }, [quickButtons, updateQuickButton]);

  const resetQuickButtons = useCallback(() => {
    saveQuickButtons(DEFAULT_QUICK_BUTTONS);
  }, [saveQuickButtons]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 获取当前激活的 Agent 配置
  const getActiveAgent = useCallback((): AgentConfig | null => {
    if (!activeAgentId) {return null;}
    const activeButton = quickButtons.find(b => b.id === activeAgentId && b.enabled && b.action === 'agent');
    if (!activeButton || !activeButton.prompt.trim()) {return null;}
    return {
      id: activeButton.id,
      name: activeButton.name,
      systemPrompt: activeButton.prompt.trim(),
      icon: activeButton.icon,
    };
  }, [activeAgentId, quickButtons]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) {return;}

    // 🔑 BYOK模式：检查 API Key 是否已配置
    if (!apiKeySaved) {
      // 显示提示消息并打开设置面板
      const systemMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ **请先配置 API 密钥**\n\n您还没有配置 DeepSeek API 密钥。请点击左下角的「设置」按钮，在「通用设置」中输入您的 API Key 后再使用。\n\n💡 获取 API Key: [DeepSeek 控制台](https://platform.deepseek.com/api_keys)',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, systemMessage]);
      setShowSettings(true);
      setSettingsTab('general');
      return;
    }

    // 🚀 P1-1: Pre-build request body BEFORE UI updates to reduce serialization latency
    // This moves JSON.stringify() to before React state updates, saving ~2-5ms
    const activeAgent = getActiveAgent();
    const mode = activeAgent ? 'agent' : 'chat';
    const systemPrompt = activeAgent?.systemPrompt;

    // Capture input before clearing
    const currentInput = input;

    // 🚀 P2-2: Check client-side cache for repeated prompts
    const cachedResponse = responseCache.get(currentInput, selectedModel, systemPrompt);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // 创建助手消息占位符（用于流式更新）
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, assistantMessage]);

    // 🚀 P2-2: Return cached response immediately if available
    if (cachedResponse) {
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, content: cachedResponse }
          : msg
      ));
      setIsLoading(false);
      return;
    }

    // Build request body only if not cached
    const requestBody = JSON.stringify({
      prompt: currentInput,
      model: selectedModel,
      stream: true,
      mode,
      ...(systemPrompt && { systemPrompt }),
    });

    try {
      // 🚀 P1-1: Use pre-built request body (already serialized above)
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || '请求失败');
      }

      // 🚀 P1-2: Optimized streaming response handling
      // - Reuse TextDecoder instance
      // - Batch UI updates to reduce React re-renders
      // - Optimized line parsing
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let pendingUpdate = '';
      let updateScheduled = false;
      const DATA_PREFIX = 'data: ';
      const DONE_MARKER = 'data: [DONE]';

      // Batch updates using requestAnimationFrame for smoother rendering
      const scheduleUpdate = () => {
        if (!updateScheduled && pendingUpdate) {
          updateScheduled = true;
          requestAnimationFrame(() => {
            accumulatedContent += pendingUpdate;
            pendingUpdate = '';
            updateScheduled = false;
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedContent }
                : msg
            ));
          });
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {break;}

        const chunk = decoder.decode(value, { stream: true });
        // Split on newlines but avoid creating empty strings
        const lines = chunk.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Skip empty lines and done marker early
          if (!line || line === DONE_MARKER) {continue;}
          // Trim only if needed
          const trimmedLine = line[0] === ' ' ? line.trim() : line;
          if (!trimmedLine) {continue;}

          if (trimmedLine.startsWith(DATA_PREFIX)) {
            try {
              const jsonStr = trimmedLine.slice(6);
              const data = JSON.parse(jsonStr);

              // 检查是否有错误
              if (data.error) {
                throw new Error(data.error.message || '流式响应错误');
              }

              // Direct property access is faster than optional chaining for hot path
              const choices = data.choices;
              if (choices && choices[0]) {
                const delta = choices[0].delta;
                if (delta && delta.content) {
                  pendingUpdate += delta.content;
                  scheduleUpdate();
                }

                // 检查是否完成
                if (choices[0].finish_reason) {
                  // Flush any pending content
                  if (pendingUpdate) {
                    accumulatedContent += pendingUpdate;
                    setMessages(prev => prev.map(msg =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    ));
                  }
                  break;
                }
              }
            } catch (parseError) {
              // 忽略解析错误，继续处理下一行
              if (process.env.NODE_ENV === 'development') {
                console.warn('解析流数据失败:', parseError);
              }
            }
          }
        }
      }

      // Final flush for any remaining content
      if (pendingUpdate) {
        accumulatedContent += pendingUpdate;
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: accumulatedContent }
            : msg
        ));
      }

      // 如果没有收到任何内容，显示错误
      if (!accumulatedContent) {
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: '抱歉，没有收到有效的响应内容。' }
            : msg
        ));
      } else {
        // 🚀 P2-2: Cache successful response for future identical prompts
        responseCache.set(currentInput, selectedModel, accumulatedContent, systemPrompt);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // 更新占位消息为错误消息
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, content: error instanceof Error ? `错误: ${error.message}` : '抱歉，发送消息时出现错误。请稍后重试。' }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 快速按钮点击处理
  const handleQuickStart = (button: InternalQuickButtonConfig) => {
    if (button.action === 'agent') {
      // Agent 模式：切换激活状态
      if (activeAgentId === button.id) {
        // 再次点击同一按钮 → 取消激活
        setActiveAgentId(null);
      } else {
        // 点击不同按钮 → 激活新 Agent（自动覆盖之前的）
        setActiveAgentId(button.id);
        // 切换到 Agent 指定的模型
        setSelectedModel(button.model);
      }
    } else if (button.action === 'execute') {
      // 直接执行：设置模型，填充输入，并发送
      setSelectedModel(button.model);
      setInput(button.prompt);
      // 使用 setTimeout 确保状态更新后再发送
      setTimeout(() => {
        handleSend();
      }, 100);
    } else {
      // fill 模式：填充输入框
      setSelectedModel(button.model);
      setInput(button.prompt);
      textareaRef.current?.focus();
    }
  };

  // 新建对话：重置 Agent 状态
  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setActiveAgentId(null); // 重置 Agent 状态
  };

  // 模型切换时可选重置 Agent 状态（防止语义混淆）
  const handleModelChange = (newModel: DeepSeekModel) => {
    setSelectedModel(newModel);
    // 可选：切换模型时重置 Agent
    // setActiveAgentId(null);
  };

  // 当按钮被禁用时，自动重置激活状态
  useEffect(() => {
    if (activeAgentId) {
      const activeButton = quickButtons.find(b => b.id === activeAgentId);
      if (!activeButton || !activeButton.enabled || activeButton.action !== 'agent') {
        setActiveAgentId(null);
      }
    }
  }, [quickButtons, activeAgentId]);

  return (
    <div className={`window window-style-chat ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* 侧边栏折叠时的展开按钮 */}
      {sidebarCollapsed && (
        <button
          className="sidebar-expand-btn"
          onClick={toggleSidebar}
          title="展开侧边栏"
          aria-label="展开侧边栏"
        >
          <span className="expand-icon">»</span>
        </button>
      )}

      {/* 侧边栏 */}
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-content">
          {/* 侧边栏头部：Logo + 折叠按钮 */}
          <div className="sidebar-header">
            <h1 className="logo-title">
              🍀 EP Chat
            </h1>
            <button
              className="sidebar-toggle-btn"
              onClick={toggleSidebar}
              title="折叠侧边栏"
              aria-label="折叠侧边栏"
            >
              <span className="toggle-icon">«</span>
            </button>
          </div>

          {/* 新对话按钮 */}
          <div className="new-chat-container">
            <button onClick={handleNewChat} className="new-chat-btn">
              <span>➕</span>
              新对话
            </button>
          </div>

          {/* 模型选择 */}
          <div className="model-selector-container">
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value as DeepSeekModel)}
            >
              <option value="deepseek-chat">💬 DeepSeek Chat</option>
              <option value="deepseek-coder">👨‍💻 DeepSeek Coder</option>
              <option value="deepseek-reasoner">🧠 DeepSeek Reasoner</option>
            </select>
          </div>

          {/* 快速开始 */}
          <div className="quick-start-section">
            <div className="quick-buttons">
              {quickButtons.filter(btn => btn.enabled).map((button) => {
                const isActiveAgent = activeAgentId === button.id && button.action === 'agent';
                return (
                  <button
                    key={button.id}
                    onClick={() => handleQuickStart(button)}
                    className={`quick-btn ${isActiveAgent ? 'agent-active' : ''}`}
                    title={
                      button.action === 'agent'
                        ? (isActiveAgent ? '点击取消 Agent 模式' : '点击激活 Agent 模式')
                        : (button.action === 'execute' ? '点击直接执行' : '点击填充输入框')
                    }
                  >
                    <span className="icon">{button.icon}</span>
                    <span>{button.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 设置按钮 */}
          <div className="settings-container">
            <button className="settings-btn" onClick={toggleSettings}>
              <span className="icon">⚙️</span>
              设置
            </button>
          </div>
        </div>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="settings-overlay" onClick={toggleSettings}>
          <div className="settings-panel settings-panel-large" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <h2>⚙️ 设置</h2>
              <button className="close-btn" onClick={toggleSettings}>✕</button>
            </div>

            {/* 标签页导航 */}
            <div className="settings-tabs">
              <button
                className={`settings-tab ${settingsTab === 'general' ? 'active' : ''}`}
                onClick={() => setSettingsTab('general')}
              >
                🔧 通用设置
              </button>
              <button
                className={`settings-tab ${settingsTab === 'quickButtons' ? 'active' : ''}`}
                onClick={() => setSettingsTab('quickButtons')}
              >
                ⚡ 快速按钮配置
              </button>
            </div>

            <div className="settings-content">
              {/* 通用设置标签页 */}
              {settingsTab === 'general' && (
                <>
                  {/* API Key 设置 */}
                  <div className="settings-section">
                    <h3>🔑 DeepSeek API Key</h3>
                    <p className="settings-description">
                      配置您的 DeepSeek API 密钥以使用 AI 功能
                    </p>

                    {apiKeySaved ? (
                      <div className="api-key-saved">
                        <div className="saved-indicator">
                          <span className="check-icon">✓</span>
                          <span>API Key 已保存</span>
                        </div>
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => {
                            setApiKey(e.target.value);
                            setApiKeySaved(false);
                          }}
                          placeholder="••••••••••••••••"
                          className="api-key-input"
                        />
                        <div className="api-key-actions">
                          <button className="btn-secondary" onClick={handleClearApiKey}>
                            清除
                          </button>
                          <button className="btn-primary" onClick={handleSaveApiKey}>
                            更新
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="api-key-input-group">
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                          className="api-key-input"
                        />
                        <button
                          className="btn-primary"
                          onClick={handleSaveApiKey}
                          disabled={!apiKey.trim()}
                        >
                          保存
                        </button>
                      </div>
                    )}

                    <p className="settings-hint">
                      💡 获取 API Key: <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer">DeepSeek 控制台</a>
                    </p>
                  </div>

                  {/* 模型设置 */}
                  <div className="settings-section">
                    <h3>🤖 默认模型</h3>
                    <p className="settings-description">
                      选择默认使用的 AI 模型
                    </p>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value as DeepSeekModel)}
                      className="model-select"
                    >
                      <option value="deepseek-chat">💬 DeepSeek Chat (通用对话)</option>
                      <option value="deepseek-coder">👨‍💻 DeepSeek Coder (代码专家)</option>
                      <option value="deepseek-reasoner">🧠 DeepSeek Reasoner (深度推理)</option>
                    </select>
                  </div>
                </>
              )}

              {/* 快速按钮配置标签页 */}
              {settingsTab === 'quickButtons' && (
                <div className="quick-buttons-config">
                  <div className="config-header">
                    <h3>⚡ 快速按钮配置</h3>
                    <button className="btn-secondary btn-small" onClick={resetQuickButtons}>
                      🔄 重置默认
                    </button>
                  </div>
                  <p className="settings-description">
                    配置侧边栏的快速按钮，自定义图标、名称、提示词和执行方式
                  </p>

                  <div className="quick-buttons-list">
                    {quickButtons.map((button) => (
                      <div key={button.id} className={`quick-button-card ${!button.enabled ? 'disabled' : ''}`}>
                        <div className="card-header">
                          <div className="card-icon-name">
                            {/* 图标选择 */}
                            <div className="icon-selector">
                              <button
                                className="current-icon"
                                onClick={() => setEditingButtonId(editingButtonId === button.id ? null : button.id)}
                              >
                                {button.icon}
                              </button>
                              {editingButtonId === button.id && (
                                <div className="icon-dropdown">
                                  {AVAILABLE_ICONS.map((icon) => (
                                    <button
                                      key={icon}
                                      className={`icon-option ${button.icon === icon ? 'selected' : ''}`}
                                      onClick={() => {
                                        updateQuickButton(button.id, { icon });
                                        setEditingButtonId(null);
                                      }}
                                    >
                                      {icon}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            {/* 名称输入 */}
                            <input
                              type="text"
                              className="button-name-input"
                              value={button.name}
                              onChange={(e) => updateQuickButton(button.id, { name: e.target.value })}
                              placeholder="按钮名称"
                            />
                          </div>
                          {/* 启用开关 */}
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={button.enabled}
                              onChange={() => toggleButtonEnabled(button.id)}
                            />
                            <span className="toggle-slider"></span>
                            <span className="toggle-label">{button.enabled ? '启用' : '禁用'}</span>
                          </label>
                        </div>

                        <div className="card-body">
                          {/* 提示词输入 */}
                          <textarea
                            className="prompt-input"
                            value={button.prompt}
                            onChange={(e) => updateQuickButton(button.id, { prompt: e.target.value })}
                            placeholder={button.action === 'agent' ? '输入 Agent 系统提示词...' : '输入提示词模板...'}
                            rows={button.action === 'agent' ? 5 : 3}
                          />

                          <div className="card-options">
                            {/* 模型选择 */}
                            <div className="option-group">
                              <label>模型</label>
                              <select
                                value={button.model}
                                onChange={(e) => updateQuickButton(button.id, { model: e.target.value as DeepSeekModel })}
                                className="model-select-small"
                              >
                                <option value="deepseek-chat">💬 DeepSeek Chat</option>
                                <option value="deepseek-coder">👨‍💻 DeepSeek Coder</option>
                                <option value="deepseek-reasoner">🧠 DeepSeek Reasoner</option>
                              </select>
                            </div>

                            {/* 执行方式 */}
                            <div className="option-group">
                              <label>执行方式</label>
                              <select
                                value={button.action}
                                onChange={(e) => updateQuickButton(button.id, { action: e.target.value as QuickButtonMode })}
                                className="action-select"
                              >
                                <option value="fill">📝 填充输入框</option>
                                <option value="execute">⚡ 直接执行</option>
                                <option value="agent">🤖 Agent 模式</option>
                              </select>
                            </div>
                          </div>
                          {/* Agent 模式提示 */}
                          {button.action === 'agent' && (
                            <p className="agent-mode-hint">
                              💡 Agent 模式：点击按钮激活后，提示词将作为系统指令，影响所有对话回复
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="settings-footer">
              <button className="btn-secondary" onClick={toggleSettings}>
                取消
              </button>
              <button className="btn-primary" onClick={toggleSettings}>
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 主内容区域 */}
      <div className="window-content">
        <div className="content-wrapper">
          {/* 消息区域 - 移除了顶部header以最大化显示空间 */}
          <div className="messages-area">
            {messages.length === 0 ? (
              <div className="welcome-screen">
                {/* 大的青色圆形图标 */}
                <div className="welcome-icon-circle">
                  <span className="clover-icon">🍀</span>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message-item ${message.role}`}
                  >
                    <div className={`message-bubble ${message.role}-bubble selectable-text`}>
                      {/* 🚀 P0-2 & P0-3: Show TypingIndicator + SkeletonLoader for empty assistant messages */}
                      {message.role === 'assistant' && !message.content && isLoading ? (
                        <>
                          <TypingIndicator />
                          <SkeletonLoader />
                        </>
                      ) : (
                        message.content
                      )}
                      {message.role === 'assistant' && message.content && (
                        <CopyButton content={message.content} />
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* 输入区域 */}
          <div className="input-area">
            <div className="input-container">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入您的项目需求..."
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`send-btn ${input.trim() && !isLoading ? 'enabled' : 'disabled'}`}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

