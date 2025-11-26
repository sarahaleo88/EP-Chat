/**
 * WindowStyleChat - 使用 window + sidebar 布局的聊天界面
 * 100%复刻参考网站 https://ai.saraha.cc/ 的美观UI
 * 所有样式通过CSS类实现，符合CSP要求
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendPrompt } from '@/lib/deepseek';
import '@/styles/window-style-chat.scss';

type DeepSeekModel = 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// 快速按钮配置接口
interface QuickButtonConfig {
  id: string;
  icon: string;
  name: string;
  prompt: string;
  model: DeepSeekModel;
  action: 'fill' | 'execute'; // 填充输入框 或 直接执行
  enabled: boolean;
}

// 默认快速按钮配置
const DEFAULT_QUICK_BUTTONS: QuickButtonConfig[] = [
  {
    id: 'code-gen',
    icon: '🚀',
    name: '代码生成',
    prompt: '请帮我生成以下代码：\n\n# 需求描述\n[在此描述你的代码需求]\n\n# 技术要求\n- 语言：\n- 框架：\n- 其他要求：',
    model: 'deepseek-coder',
    action: 'fill',
    enabled: true
  },
  {
    id: 'doc-write',
    icon: '📝',
    name: '文档写作',
    prompt: '请帮我撰写以下文档：\n\n# 文档类型\n[技术文档/用户手册/API文档/其他]\n\n# 主题\n[在此描述文档主题]\n\n# 要求\n- 格式：Markdown\n- 风格：专业、清晰',
    model: 'deepseek-chat',
    action: 'fill',
    enabled: true
  },
  {
    id: 'qa',
    icon: '❓',
    name: '问题解答',
    prompt: '我有一个问题需要解答：\n\n# 问题\n[在此描述你的问题]\n\n# 背景\n[相关背景信息]',
    model: 'deepseek-chat',
    action: 'fill',
    enabled: true
  },
  {
    id: 'translate',
    icon: '🌐',
    name: '中英翻译',
    prompt: '请帮我翻译以下内容：\n\n# 原文\n[在此粘贴需要翻译的内容]\n\n# 翻译方向\n中文 → 英文 / 英文 → 中文',
    model: 'deepseek-chat',
    action: 'fill',
    enabled: true
  }
];

// 可选图标列表
const AVAILABLE_ICONS = ['🚀', '📝', '❓', '🌐', '💻', '🔧', '📊', '🎨', '🔍', '💡', '📁', '⚡', '🎯', '📌', '🏷️'];

// Storage keys
const API_KEY_STORAGE_KEY = 'ep-chat-api-key';
const QUICK_BUTTONS_STORAGE_KEY = 'ep-chat-quick-buttons';

export default function WindowStyleChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<DeepSeekModel>('deepseek-chat');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'quickButtons'>('general');
  const [apiKey, setApiKey] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [quickButtons, setQuickButtons] = useState<QuickButtonConfig[]>(DEFAULT_QUICK_BUTTONS);
  const [editingButtonId, setEditingButtonId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load saved settings on mount
  useEffect(() => {
    // Load API key
    const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedKey) {
      setApiKey(savedKey);
      setApiKeySaved(true);
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
  }, []);

  // Save quick buttons when changed
  const saveQuickButtons = useCallback((buttons: QuickButtonConfig[]) => {
    setQuickButtons(buttons);
    localStorage.setItem(QUICK_BUTTONS_STORAGE_KEY, JSON.stringify(buttons));
  }, []);

  // Toggle settings panel
  const toggleSettings = useCallback(() => {
    setShowSettings(prev => !prev);
    setSettingsTab('general');
    setEditingButtonId(null);
  }, []);

  // Save API key
  const handleSaveApiKey = useCallback(() => {
    if (apiKey.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
      setApiKeySaved(true);
    }
  }, [apiKey]);

  // Clear API key
  const handleClearApiKey = useCallback(() => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey('');
    setApiKeySaved(false);
  }, []);

  // Quick button handlers
  const updateQuickButton = useCallback((id: string, updates: Partial<QuickButtonConfig>) => {
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendPrompt(input, selectedModel);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，发送消息时出现错误。请稍后重试。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
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

  const handleQuickStart = (button: QuickButtonConfig) => {
    if (button.action === 'execute') {
      // 直接执行：设置模型，填充输入，并发送
      setSelectedModel(button.model);
      setInput(button.prompt);
      // 使用 setTimeout 确保状态更新后再发送
      setTimeout(() => {
        handleSend();
      }, 100);
    } else {
      // 填充输入框
      setSelectedModel(button.model);
      setInput(button.prompt);
      textareaRef.current?.focus();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <div className="window window-style-chat">
      {/* 侧边栏 */}
      <div className="sidebar">
        <div className="sidebar-content">
          {/* Logo */}
          <h1 className="logo-title">
            🍀 EP Chat
          </h1>

          {/* 新对话按钮 */}
          <div className="new-chat-container">
            <button onClick={handleNewChat} className="new-chat-btn">
              <span>➕</span>
              新对话
            </button>
          </div>

          {/* 模型选择 */}
          <div className="model-selector-container">
            <label>选择模型</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as DeepSeekModel)}
            >
              <option value="deepseek-chat">💬 DeepSeek Chat</option>
              <option value="deepseek-coder">👨‍💻 DeepSeek Coder</option>
              <option value="deepseek-reasoner">🧠 DeepSeek Reasoner</option>
            </select>
          </div>

          {/* 快速开始 */}
          <div className="quick-start-section">
            <h3>快速开始</h3>
            <div className="quick-buttons">
              {quickButtons.filter(btn => btn.enabled).map((button) => (
                <button
                  key={button.id}
                  onClick={() => handleQuickStart(button)}
                  className="quick-btn"
                  title={button.action === 'execute' ? '点击直接执行' : '点击填充输入框'}
                >
                  <span className="icon">{button.icon}</span>
                  <span>{button.name}</span>
                </button>
              ))}
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
                            placeholder="输入提示词模板..."
                            rows={3}
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
                                onChange={(e) => updateQuickButton(button.id, { action: e.target.value as 'fill' | 'execute' })}
                                className="action-select"
                              >
                                <option value="fill">📝 填充输入框</option>
                                <option value="execute">⚡ 直接执行</option>
                              </select>
                            </div>
                          </div>
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
          {/* 头部 - 右上角Monitor和图表图标 */}
          <div className="chat-header">
            <div className="header-left">
              {/* 空白区域或logo */}
            </div>
            <div className="header-right">
              <a href="#" className="monitor-link">
                🚀 Monitor
              </a>
              <button className="chart-btn">
                📊
              </button>
            </div>
          </div>

          {/* 消息区域 */}
          <div className="messages-area">
            {messages.length === 0 ? (
              <div className="welcome-screen">
                {/* 大的青色圆形图标 */}
                <div className="welcome-icon-circle">
                  <span className="clover-icon">🍀</span>
                </div>
                <h2>开始新对话</h2>
                <p>输入您的项目需求，我将为您生成增强的提示词，帮助您获得更好的AI回复</p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message-item ${message.role}`}
                  >
                    <div className={`message-avatar ${message.role}-avatar`}>
                      {message.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className={`message-bubble ${message.role}-bubble`}>
                      {message.content}
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
            <div className="input-hints">
              <span>按 Enter 发送，Shift + Enter 换行</span>
              <span>Powered by DeepSeek</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

