'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  PaperAirplaneIcon as Send,
  PlusIcon as Plus,
  HomeIcon as Home,
  UserIcon as User,
  ClipboardDocumentIcon as Copy
} from '@heroicons/react/24/outline';
import { sendPrompt } from '@/lib/deepseek';
import { cn } from '@/lib/utils';

// 自定义 Bot 图标组件
const Bot = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2Z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 10C2.9 10 2 10.9 2 12C2 13.1 2.9 14 4 14C5.1 14 6 13.1 6 12C6 10.9 5.1 10 4 10Z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 10C18.9 10 18 10.9 18 12C18 13.1 18.9 14 20 14C21.1 14 22 13.1 22 12C22 10.9 21.1 10 20 10Z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18C10.9 18 10 18.9 10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20C14 18.9 13.1 18 12 18Z" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

type DeepSeekModel = 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
}

interface NextChatInterfaceProps {
  className?: string;
}

export default function NextChatInterface({ className = '' }: NextChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<DeepSeekModel>('deepseek-chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendPrompt(input.trim(), model, {
        maxTokens: 2000,
        temperature: 0.7,
        stream: false,
      });

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '抱歉，我无法生成回复。';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content,
        timestamp: new Date(),
        model,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('生成失败:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，生成过程中出现了错误。请稍后重试。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className={cn('flex h-screen bg-gray-50 dark:bg-gray-900', className)}>
      {/* 左侧边栏 - NextChat 风格 */}
      <div className="flex flex-col w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        {/* 侧边栏头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-shamrock-500 to-shamrock-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2Z" />
                <path d="M4 10C2.9 10 2 10.9 2 12C2 13.1 2.9 14 4 14C5.1 14 6 13.1 6 12C6 10.9 5.1 10 4 10Z" />
                <path d="M20 10C18.9 10 18 10.9 18 12C18 13.1 18.9 14 20 14C21.1 14 22 13.1 22 12C22 10.9 21.1 10 20 10Z" />
                <path d="M12 18C10.9 18 10 18.9 10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20C14 18.9 13.1 18 12 18Z" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">EP Chat</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Enhanced Prompt</p>
            </div>
          </div>
          
          <a
            href="/"
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="返回主页"
          >
            <Home className="w-5 h-5" />
          </a>
        </div>

        {/* 新对话按钮 */}
        <div className="p-4">
          <button
            onClick={clearChat}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-shamrock-500 hover:bg-shamrock-600 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>新对话</span>
          </button>
        </div>

        {/* 模型选择 */}
        <div className="px-4 pb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            选择模型
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as DeepSeekModel)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-shamrock-500 focus:border-transparent"
          >
            <option value="deepseek-chat">💬 DeepSeek Chat</option>
            <option value="deepseek-coder">👨‍💻 DeepSeek Coder</option>
            <option value="deepseek-reasoner">🧠 DeepSeek Reasoner</option>
          </select>
        </div>

        {/* 快速开始 */}
        <div className="flex-1 px-4 pb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">快速开始</h3>
          <div className="space-y-2">
            {[
              { icon: '🚀', title: '代码生成', prompt: '帮我生成一个React组件' },
              { icon: '📝', title: '文档写作', prompt: '帮我写一份技术文档' },
              { icon: '🎯', title: '问题解答', prompt: '解释一下这个技术概念' },
              { icon: '💡', title: '创意灵感', prompt: '给我一些创意想法' },
            ].map((item, index) => (
              <button
                key={index}
                onClick={() => setInput(item.prompt)}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors group"
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">
                  {item.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col">
        {/* 聊天头部 */}
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {model === 'deepseek-chat' && '💬 通用对话模式'}
              {model === 'deepseek-coder' && '👨‍💻 代码生成模式'}
              {model === 'deepseek-reasoner' && '🧠 推理分析模式'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {messages.length} 条消息
            </span>
          </div>
        </div>

        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto smooth-scroll">
          {messages.length === 0 ? (
            // 欢迎界面 - NextChat 风格
            <div className="flex flex-col items-center justify-center h-full px-4">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-shamrock-500 to-shamrock-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                    <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2Z" />
                    <path d="M4 10C2.9 10 2 10.9 2 12C2 13.1 2.9 14 4 14C5.1 14 6 13.1 6 12C6 10.9 5.1 10 4 10Z" />
                    <path d="M20 10C18.9 10 18 10.9 18 12C18 13.1 18.9 14 20 14C21.1 14 22 13.1 22 12C22 10.9 21.1 10 20 10Z" />
                    <path d="M12 18C10.9 18 10 18.9 10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20C14 18.9 13.1 18 12 18Z" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  开始新对话
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  选择一个话题开始，或者直接在下方输入您的问题
                </p>
              </div>

              {/* 示例对话 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
                {[
                  { icon: '💻', title: '编程助手', desc: '代码生成、调试、优化' },
                  { icon: '📚', title: '学习伙伴', desc: '知识解答、概念解释' },
                  { icon: '✍️', title: '写作助手', desc: '文档、邮件、创意写作' },
                  { icon: '🎨', title: '创意灵感', desc: '头脑风暴、创意想法' },
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(`作为${item.title}，${item.desc}`)}
                    className="p-4 text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-shamrock-300 dark:hover:border-shamrock-600 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1 group-hover:text-shamrock-600 dark:group-hover:text-shamrock-400">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // 消息列表
            <div className="px-4 py-6">
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex space-x-4 message-enter',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-shamrock-500 to-shamrock-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    
                    <div
                      className={cn(
                        'chat-bubble px-4 py-3 rounded-2xl',
                        message.role === 'user'
                          ? 'user bg-shamrock-500 text-white ml-12'
                          : 'assistant bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                      )}
                    >
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                      
                      {message.role === 'assistant' && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {message.model}
                          </span>
                          <button
                            onClick={() => copyMessage(message.content)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                            title="复制"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex space-x-4 justify-start">
                    <div className="w-8 h-8 bg-gradient-to-br from-shamrock-500 to-shamrock-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="chat-bubble assistant bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-2xl">
                      <div className="flex items-center space-x-3">
                        <div className="loading-dots">
                          <div className="bg-shamrock-500"></div>
                          <div className="bg-shamrock-500"></div>
                          <div className="bg-shamrock-500"></div>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">正在思考...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入消息..."
                className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-shamrock-500 focus:border-transparent resize-none min-h-[52px] max-h-[200px]"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={cn(
                  'absolute right-2 top-2 p-2 rounded-xl transition-all duration-200',
                  input.trim() && !isLoading
                    ? 'bg-shamrock-500 hover:bg-shamrock-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                )}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
              <span>按 Enter 发送，Shift + Enter 换行</span>
              <span>Powered by DeepSeek</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
