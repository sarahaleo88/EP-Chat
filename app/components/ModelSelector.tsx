/**
 * Model Selector Dropdown Component
 * Provides a clickable dropdown for quick model switching in the header
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = modelOptions.find(
    option => option.value === selectedModel
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleModelSelect = (
    model: 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner'
  ) => {
    onModelChange(model);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
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
        aria-haspopup="listbox"
        title={`当前模型: ${selectedOption?.label}`}
      >
        {/* Model Icon Only - Ultra Compact */}
        <div className="flex items-center justify-center">
          <span style={{ fontSize: '14px' }}>{selectedOption?.icon}</span>
          {/* Minimal dropdown indicator */}
          <svg
            className={cn(
              'w-2.5 h-2.5 ml-0.5 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
            style={{ color: 'var(--black)', opacity: 0.5 }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Minimal Dropdown Menu - Matches Settings Style */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            width: '160px',
            maxWidth: '90vw',
            backgroundColor: 'var(--white)',
            borderRadius: '8px',
            boxShadow: 'var(--card-shadow)',
            border: 'var(--border-in-light)',
          }}
        >
          {/* Ultra-Compact Model Options */}
          <div style={{ padding: '4px 0' }}>
            {modelOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleModelSelect(option.value)}
                className="w-full text-left transition-all duration-150 focus:outline-none"
                style={{
                  backgroundColor:
                    selectedModel === option.value
                      ? 'var(--hover-color)'
                      : 'transparent',
                  borderLeft:
                    selectedModel === option.value
                      ? '3px solid var(--primary)'
                      : '3px solid transparent',
                  color: 'var(--black)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                }}
                onMouseEnter={e => {
                  if (selectedModel !== option.value) {
                    e.currentTarget.style.backgroundColor =
                      'var(--hover-color)';
                  }
                }}
                onMouseLeave={e => {
                  if (selectedModel !== option.value) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                role="option"
                aria-selected={selectedModel === option.value}
              >
                {/* Selection Indicator - Horizontally positioned BEFORE the model name */}
                {selectedModel === option.value && (
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      backgroundColor: 'var(--primary)',
                      borderRadius: '50%',
                      flexShrink: 0,
                    }}
                  />
                )}

                {/* English Name + Icon Format */}
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--black)',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  {option.label} {option.icon}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
