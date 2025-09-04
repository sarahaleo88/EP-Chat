/**
 * ChatContainer - Main chat layout component
 * Handles the overall chat interface layout and message display
 */

'use client';

import React, { useRef, useEffect } from 'react';
import SecureMessageRenderer from '../SecureMessageRenderer';
import { MessageLoadingBubble } from '../EnhancedLoadingIndicator';
import { CopyButton } from '../CopyButton';

// Message type definition
export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  isApiResponse?: boolean;
  isStreaming?: boolean;
}

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  currentError: string | null;
  onClearError: () => void;
}

/**
 * ChatContainer component for displaying chat messages
 */
export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isLoading,
  isSending,
  currentError,
  onClearError,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="chat-container flex-1 overflow-y-auto p-4 space-y-4">
      {/* Welcome message when no messages */}
      {messages.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            欢迎使用 EP-Chat
          </h3>
          <p className="text-sm text-gray-500">
            开始对话，体验智能提示增强功能
          </p>
        </div>
      )}

      {/* Messages */}
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.type === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[80%] rounded-lg px-4 py-2 ${
              message.type === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-900 border'
            }`}
          >
            {/* Message content */}
            <div className="message-content">
              {message.type === 'assistant' ? (
                <SecureMessageRenderer content={message.content} />
              ) : (
                <div className="whitespace-pre-wrap">{message.content}</div>
              )}
            </div>

            {/* Message metadata */}
            <div className="flex items-center justify-between mt-2 text-xs opacity-70">
              <span>
                {message.timestamp.toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {message.model && (
                  <span className="ml-2 px-1 py-0.5 bg-black bg-opacity-10 rounded text-xs">
                    {message.model}
                  </span>
                )}
              </span>
              
              {/* Copy button for assistant messages */}
              {message.type === 'assistant' && (
                <CopyButton
                  content={message.content}
                  className="ml-2 opacity-50 hover:opacity-100"
                />
              )}
            </div>

            {/* Streaming indicator */}
            {message.isStreaming && (
              <div className="mt-2 flex items-center text-xs opacity-70">
                <div className="animate-pulse flex space-x-1">
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                  <div className="w-1 h-1 bg-current rounded-full"></div>
                </div>
                <span className="ml-2">正在生成...</span>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Loading indicator */}
      {(isLoading || isSending) && (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100 border">
            <MessageLoadingBubble />
          </div>
        </div>
      )}

      {/* Error display */}
      {currentError && (
        <div className="flex justify-center">
          <div className="max-w-[80%] rounded-lg px-4 py-2 bg-red-50 border border-red-200 text-red-700">
            <div className="flex items-center justify-between">
              <span className="text-sm">{currentError}</span>
              <button
                onClick={onClearError}
                className="ml-2 text-red-500 hover:text-red-700"
                aria-label="清除错误"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatContainer;
