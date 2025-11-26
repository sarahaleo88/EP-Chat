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

// API Key storage key
const API_KEY_STORAGE_KEY = 'ep-chat-api-key';

export default function WindowStyleChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<DeepSeekModel>('deepseek-chat');
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load saved API key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedKey) {
      setApiKey(savedKey);
      setApiKeySaved(true);
    }
  }, []);

  // Toggle settings panel
  const toggleSettings = useCallback(() => {
    setShowSettings(prev => !prev);
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

  const handleQuickStart = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
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
              {[
                { icon: '🚀', text: '代码生成', prompt: '帮我生成一段代码' },
                { icon: '📝', text: '文档写作', prompt: '帮我写一篇文档' },
                { icon: '❓', text: '问题解答', prompt: '我有一个问题' },
                { icon: '🌐', text: '中英翻译', prompt: '帮我翻译这段文字' }
              ].map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickStart(item.prompt)}
                  className="quick-btn"
                >
                  <span className="icon">{item.icon}</span>
                  <span>{item.text}</span>
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
          <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <h2>⚙️ 设置</h2>
              <button className="close-btn" onClick={toggleSettings}>✕</button>
            </div>

            <div className="settings-content">
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

              {/* 提示词设置 */}
              <div className="settings-section">
                <h3>📝 系统提示词</h3>
                <p className="settings-description">
                  自定义 AI 的行为和回复风格
                </p>
                <textarea
                  className="system-prompt-input"
                  placeholder="例如：你是一个专业的编程助手，擅长解释复杂的技术概念..."
                  rows={4}
                />
                <p className="settings-hint">
                  💡 留空则使用默认提示词
                </p>
              </div>
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

