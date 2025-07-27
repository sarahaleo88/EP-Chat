/**
 * 对话框式UI界面
 * 基于ChatGPT风格的现代化对话界面
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { DeepSeekModel } from '@/lib/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatInterfaceProps {
  className?: string;
}

export function ChatInterface({ className }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<DeepSeekModel>('deepseek-chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 自动调整输入框高度
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // 模拟AI回复
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `这是一个基于 ${model} 模型的回复示例。您的消息："${userMessage.content}" 已收到。`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col h-screen bg-gradient-to-br from-shamrock-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900',
        className
      )}
    >
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-shamrock-400 to-shamrock-600 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2Z" />
              <path d="M4 10C2.9 10 2 10.9 2 12C2 13.1 2.9 14 4 14C5.1 14 6 13.1 6 12C6 10.9 5.1 10 4 10Z" />
              <path d="M20 10C18.9 10 18 10.9 18 12C18 13.1 18.9 14 20 14C21.1 14 22 13.1 22 12C22 10.9 21.1 10 20 10Z" />
              <path d="M12 18C10.9 18 10 18.9 10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20C14 18.9 13.1 18 12 18Z" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              EP Chat
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enhanced Prompt Assistant
            </p>
          </div>
        </div>

        {/* 模型选择器和导航 */}
        <div className="flex items-center space-x-3">
          <select
            value={model}
            onChange={e => setModel(e.target.value as DeepSeekModel)}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-shamrock-500 focus:border-transparent"
          >
            <option value="deepseek-chat">💬 Chat</option>
            <option value="deepseek-coder">👨‍💻 Coder</option>
            <option value="deepseek-reasoner">🧠 Reasoner</option>
          </select>

          <a
            href="/"
            className="p-2 text-gray-500 hover:text-shamrock-600 dark:text-gray-400 dark:hover:text-shamrock-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="返回主页"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"
              />
            </svg>
          </a>

          <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            // 全新现代化欢迎界面
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
              {/* 主标题区域 */}
              <div className="text-center mb-16">
                <div className="relative mb-8">
                  {/* 背景装饰光晕 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-shamrock-400/30 via-blue-500/20 to-purple-500/30 rounded-full blur-3xl scale-150 animate-pulse"></div>

                  {/* 主图标 */}
                  <div className="relative w-28 h-28 bg-gradient-to-br from-shamrock-400 via-shamrock-500 to-shamrock-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-shamrock-500/30 transform hover:scale-105 transition-transform duration-300">
                    <svg viewBox="0 0 24 24" fill="white" className="w-14 h-14">
                      <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2Z" />
                      <path d="M4 10C2.9 10 2 10.9 2 12C2 13.1 2.9 14 4 14C5.1 14 6 13.1 6 12C6 10.9 5.1 10 4 10Z" />
                      <path d="M20 10C18.9 10 18 10.9 18 12C18 13.1 18.9 14 20 14C21.1 14 22 13.1 22 12C22 10.9 21.1 10 20 10Z" />
                      <path d="M12 18C10.9 18 10 18.9 10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20C14 18.9 13.1 18 12 18Z" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>

                    {/* 动态光环效果 */}
                    <div className="absolute inset-0 bg-white/10 rounded-3xl animate-ping"></div>
                    <div className="absolute -inset-2 bg-gradient-to-r from-shamrock-400/50 to-blue-500/50 rounded-3xl blur-md animate-pulse"></div>
                  </div>
                </div>

                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-shamrock-600 to-blue-600 dark:from-white dark:via-shamrock-400 dark:to-blue-400 bg-clip-text text-transparent mb-6 animate-fade-in">
                  EP Chat
                </h1>
                <p className="text-2xl text-gray-600 dark:text-gray-300 mb-4 font-light">
                  Enhanced Prompt Assistant
                </p>
                <p className="text-lg text-gray-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
                  基于 DeepSeek 的智能对话助手，帮助您生成高质量的提示词，提升
                  AI 交互体验
                </p>
              </div>

              {/* 功能特性卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto mb-16">
                {[
                  {
                    icon: '🚀',
                    title: '快速生成',
                    desc: '一键生成专业提示词，提升工作效率',
                    color: 'from-blue-500 to-blue-600',
                    bgColor:
                      'group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20',
                    prompt: '帮我生成一个专业的代码审查提示词',
                  },
                  {
                    icon: '🎯',
                    title: '精准优化',
                    desc: '针对性改进提示效果，确保准确性',
                    color: 'from-purple-500 to-purple-600',
                    bgColor:
                      'group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20',
                    prompt: '帮我优化这个提示词的准确性和清晰度',
                  },
                  {
                    icon: '💡',
                    title: '创意灵感',
                    desc: '激发无限创作可能，突破思维局限',
                    color: 'from-orange-500 to-orange-600',
                    bgColor:
                      'group-hover:bg-orange-50 dark:group-hover:bg-orange-900/20',
                    prompt: '给我一些创意写作的提示词灵感',
                  },
                  {
                    icon: '⚡',
                    title: '效率提升',
                    desc: '大幅提高工作效率，节省宝贵时间',
                    color: 'from-shamrock-500 to-shamrock-600',
                    bgColor:
                      'group-hover:bg-shamrock-50 dark:group-hover:bg-shamrock-900/20',
                    prompt: '帮我设计一个提高工作效率的AI助手',
                  },
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(item.prompt)}
                    className={`group relative p-8 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 hover:border-transparent hover:shadow-2xl hover:shadow-shamrock-500/10 transition-all duration-500 hover:-translate-y-2 ${item.bgColor}`}
                  >
                    {/* 悬停时的背景渐变 */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-500`}
                    ></div>

                    <div className="relative">
                      <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    {/* 箭头指示器 */}
                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
                      <svg
                        className="w-6 h-6 text-shamrock-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>

              {/* 底部状态和提示 */}
              <div className="text-center space-y-6">
                <div className="inline-flex items-center space-x-3 px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-gray-200 dark:border-gray-700 shadow-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      AI 已就绪
                    </span>
                  </div>
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    支持中英文对话
                  </span>
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    实时响应
                  </span>
                </div>

                <p className="text-gray-500 dark:text-gray-400">
                  💬 在下方输入框开始对话，或点击上方卡片快速开始
                </p>
              </div>
            </div>
          ) : (
            // 消息列表
            messages.map(message => (
              <div
                key={message.id}
                className={cn(
                  'flex space-x-4',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-shamrock-400 to-shamrock-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                      <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2Z" />
                      <path d="M4 10C2.9 10 2 10.9 2 12C2 13.1 2.9 14 4 14C5.1 14 6 13.1 6 12C6 10.9 5.1 10 4 10Z" />
                      <path d="M20 10C18.9 10 18 10.9 18 12C18 13.1 18.9 14 20 14C21.1 14 22 13.1 22 12C22 10.9 21.1 10 20 10Z" />
                      <path d="M12 18C10.9 18 10 18.9 10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20C14 18.9 13.1 18 12 18Z" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-3xl px-4 py-3 rounded-2xl',
                    message.role === 'user'
                      ? 'bg-shamrock-500 text-white ml-12'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                  )}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div
                    className={cn(
                      'text-xs mt-2 opacity-70',
                      message.role === 'user'
                        ? 'text-white'
                        : 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-gray-600 dark:text-gray-300"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>
            ))
          )}

          {/* 加载指示器 */}
          {isLoading && (
            <div className="flex space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-shamrock-400 to-shamrock-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                  <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2Z" />
                  <path d="M4 10C2.9 10 2 10.9 2 12C2 13.1 2.9 14 4 14C5.1 14 6 13.1 6 12C6 10.9 5.1 10 4 10Z" />
                  <path d="M20 10C18.9 10 18 10.9 18 12C18 13.1 18.9 14 20 14C21.1 14 22 13.1 22 12C22 10.9 21.1 10 20 10Z" />
                  <path d="M12 18C10.9 18 10 18.9 10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20C14 18.9 13.1 18 12 18Z" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区域 */}
      <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl px-4 py-4 shadow-2xl">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入您的消息... (Shift + Enter 换行)"
                className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-shamrock-500 focus:border-transparent resize-none min-h-[52px] max-h-[200px]"
                rows={1}
              />
              <div className="absolute right-3 bottom-3 text-xs text-gray-400 dark:text-gray-500">
                {input.length}/2000
              </div>
            </div>

            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={cn(
                'p-3 rounded-2xl transition-all duration-200',
                input.trim() && !isLoading
                  ? 'bg-shamrock-500 hover:bg-shamrock-600 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              )}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span>支持 Markdown 格式</span>
              <span>•</span>
              <span>Powered by DeepSeek</span>
            </div>
            <div>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                Enter
              </kbd>{' '}
              发送
              <span className="mx-2">•</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                Shift + Enter
              </kbd>{' '}
              换行
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
