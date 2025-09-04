/**
 * MessageInput - Chat input component
 * Handles message input, quick buttons, and send functionality
 */

'use client';

import React, { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { useSanitizedInput } from '../SecureMessageRenderer';
import { QuickButtonConfig } from '../../../types/quickButtons';

// Icon components
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

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onStopGeneration: () => void;
  isLoading: boolean;
  isSending: boolean;
  quickButtons: QuickButtonConfig[];
  activeButtonId: number | null;
  onQuickButtonClick: (button: QuickButtonConfig) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * MessageInput component for chat input and quick actions
 */
export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onStopGeneration,
  isLoading,
  isSending,
  quickButtons,
  activeButtonId,
  onQuickButtonClick,
  disabled = false,
  placeholder = "输入您的消息...",
}) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = useSanitizedInput(e.target.value);
    setInputValue(value);
    adjustTextareaHeight();
  }, [adjustTextareaHeight]);

  // Handle send message
  const handleSend = useCallback(() => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !isLoading && !isSending) {
      onSendMessage(trimmedValue);
      setInputValue('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [inputValue, isLoading, isSending, onSendMessage]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter: new line (default behavior)
        return;
      } else {
        // Enter: send message
        e.preventDefault();
        handleSend();
      }
    }
  }, [handleSend]);

  // Handle quick button click
  const handleQuickButtonClick = useCallback((button: QuickButtonConfig) => {
    onQuickButtonClick(button);

    // If button has prompt and mode is 'fill', add it to input
    if (button.prompt && button.mode === 'fill') {
      const newValue = inputValue + (inputValue ? '\n' : '') + button.prompt;
      setInputValue(newValue);

      // Focus textarea and adjust height
      setTimeout(() => {
        textareaRef.current?.focus();
        adjustTextareaHeight();
      }, 0);
    }
  }, [inputValue, onQuickButtonClick, adjustTextareaHeight]);

  const canSend = inputValue.trim().length > 0 && !isLoading && !isSending && !disabled;
  const isGenerating = isLoading || isSending;

  return (
    <div className="message-input-container border-t bg-white p-4">
      {/* Quick buttons */}
      {quickButtons.length > 0 && (
        <div className="quick-buttons mb-3 flex flex-wrap gap-2">
          {quickButtons.map((button) => (
            <button
              key={button.id}
              onClick={() => handleQuickButtonClick(button)}
              disabled={disabled || isGenerating}
              className={`
                px-3 py-1.5 text-sm rounded-full border transition-all duration-200
                ${activeButtonId === button.id
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }
                ${disabled || isGenerating
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:shadow-sm'
                }
              `}
              title={button.prompt}
            >
              {button.icon && <span className="mr-1">{button.icon}</span>}
              {button.title}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="input-area flex items-end gap-3">
        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              w-full px-4 py-3 border border-gray-300 rounded-lg resize-none
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
              transition-all duration-200
            `}
            style={{
              minHeight: '48px',
              maxHeight: '200px',
            }}
            rows={1}
          />
          
          {/* Character count (optional) */}
          {inputValue.length > 500 && (
            <div className="absolute bottom-1 right-2 text-xs text-gray-400">
              {inputValue.length}
            </div>
          )}
        </div>

        {/* Send/Stop button */}
        <button
          onClick={isGenerating ? onStopGeneration : handleSend}
          disabled={!isGenerating && (!canSend || disabled)}
          className={`
            flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200
            ${isGenerating
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : canSend && !disabled
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
          title={isGenerating ? '停止生成' : '发送消息 (Enter)'}
        >
          {isGenerating ? <StopIcon /> : <SendIcon />}
        </button>
      </div>

      {/* Input hints */}
      <div className="input-hints mt-2 text-xs text-gray-500 flex justify-between">
        <span>按 Enter 发送，Shift+Enter 换行</span>
        {isGenerating && (
          <span className="text-orange-500">正在生成中，点击停止按钮可中断</span>
        )}
      </div>
    </div>
  );
};

export default MessageInput;
