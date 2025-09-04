/**
 * Model Selector Card Component
 * Provides a clickable card popup for quick model switching in the header
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ModelOption {
  value: 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner';
  label: string;
  icon: string;
  description: string;
}

interface ModelSelectorProps {
  selectedModel: 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner';
  onModelChange: (
    model: 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner'
  ) => void;
  className?: string;
}

const modelOptions: ModelOption[] = [
  {
    value: 'deepseek-chat',
    label: 'DeepSeek Chat',
    icon: '💬',
    description: 'General conversation (30s timeout)',
  },
  {
    value: 'deepseek-coder',
    label: 'DeepSeek Coder',
    icon: '👨‍💻',
    description: 'Code generation (60s timeout)',
  },
  {
    value: 'deepseek-reasoner',
    label: 'DeepSeek Reasoner',
    icon: '🧠',
    description: 'Logical reasoning (2min timeout)',
  },
];

export function ModelSelector({
  selectedModel,
  onModelChange,
  className,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const selectedOption = modelOptions.find(
    option => option.value === selectedModel
  );

  // Close card when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        cardRef.current &&
        !cardRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close card when pressing Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  const handleModelSelect = (
    model: 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner'
  ) => {
    onModelChange(model);
    setIsOpen(false);
  };

  return (
    <>
      <div className={cn('relative', className)} ref={cardRef}>
        {/* Icon-Based Trigger Button - Matches Settings Button Style */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center justify-center transition-all duration-300',
            'bg-white dark:bg-gray-800 border-none outline-none cursor-pointer',
            'overflow-hidden user-select-none',
            'hover:border-primary focus:border-primary',
            isOpen && 'border-primary'
          )}
          style={{
            borderRadius: '8px',
            padding: '6px',
            backgroundColor: 'var(--white)',
            color: 'var(--black)',
            minWidth: '32px',
            minHeight: '32px',
          }}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          title={`当前模型: ${selectedOption?.label}`}
        >
          {/* Model Icon Only - Ultra Compact */}
          <div className="flex items-center justify-center">
            <span style={{ fontSize: '14px' }}>{selectedOption?.icon}</span>
          </div>
        </button>
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(2px)',
          }}
          onClick={() => setIsOpen(false)}
        >
          {/* Model Selection Card */}
          <div
            className="relative animate-in fade-in-0 zoom-in-95 duration-200"
            style={{
              backgroundColor: 'var(--white)',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: 'var(--border-in-light)',
              padding: '20px',
              minWidth: '320px',
              maxWidth: '90vw',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--black)',
                  margin: 0,
                }}
              >
                选择模型
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center transition-all duration-200"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--black)',
                  opacity: 0.6,
                  padding: '4px',
                  borderRadius: '4px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.backgroundColor = 'var(--hover-color)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.opacity = '0.6';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Model Options */}
            <div className="space-y-2">
              {modelOptions.map(option => {
                const isSelected = selectedModel === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => handleModelSelect(option.value)}
                    className="w-full text-left transition-all duration-200 focus:outline-none"
                    style={{
                      backgroundColor: isSelected
                        ? 'var(--primary)'
                        : 'transparent',
                      color: isSelected ? 'white' : 'var(--black)',
                      border: isSelected
                        ? '2px solid var(--primary)'
                        : '2px solid var(--border-in-light)',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'var(--hover-color)';
                        e.currentTarget.style.borderColor = 'var(--primary)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = 'var(--border-in-light)';
                      }
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        fontSize: '20px',
                        flexShrink: 0,
                      }}
                    >
                      {option.icon}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          marginBottom: '2px',
                        }}
                      >
                        {option.label}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          opacity: isSelected ? 0.9 : 0.7,
                          lineHeight: '1.3',
                        }}
                      >
                        {option.description}
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: 'var(--hover-color)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--black)',
                opacity: 0.8,
                lineHeight: '1.4',
              }}
            >
              💡 提示：选择模型后会自动关闭此窗口
            </div>
          </div>
        </div>
      )}
    </>
  );
}
