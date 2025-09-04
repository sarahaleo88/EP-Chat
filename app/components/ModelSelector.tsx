/**
 * Model Selector Card Component
 * Provides a clickable card popup for quick model switching in the header
 */

'use client';

import { useState, useRef, useEffect, useReducer, useCallback } from 'react';
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
  
  // Add forceUpdate mechanism to ensure re-rendering
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  
  // Track previous selectedModel to detect changes
  const prevSelectedModelRef = useRef(selectedModel);

  // Add CSS animations for smooth 0.3s transitions
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes modalFadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: translate(-50%, -40%) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -40%) scale(1);
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const selectedOption = modelOptions.find(
    option => option.value === selectedModel
  );

  // Enhanced debug: Monitor props changes and force re-render if needed
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {

      // Check if selectedModel changed but component didn't re-render properly
      if (prevSelectedModelRef.current !== selectedModel) {

        forceUpdate();
      }
    }
    
    // Update the ref for next comparison
    prevSelectedModelRef.current = selectedModel;
  }, [selectedModel, selectedOption]);

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

  const handleModelSelect = useCallback((
    model: 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner'
  ) => {
    // Safe development logging
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {

    }

    try {
      onModelChange(model);

      // Safe development logging
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {

      }
    } catch (error) {
      // Safe development logging
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.error('[ModelSelector] Error calling onModelChange:', error);
      }
    }

    setIsOpen(false);

    // Force re-render after selection
    setTimeout(() => {
      forceUpdate();
    }, 50);
  }, [selectedModel, onModelChange]);

  // Add global click handler for automation testing compatibility
  useEffect(() => {
    const handleGlobalClick = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target && target.closest('[data-testid^="model-option-"]')) {
        const modelValue = target.closest('[data-testid^="model-option-"]')?.getAttribute('data-model-value');
        if (modelValue && ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'].includes(modelValue)) {
          // Prevent default and stop propagation
          event.preventDefault();
          event.stopPropagation();

          // Trigger model selection
          handleModelSelect(modelValue as 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner');

          if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {

          }
        }
      }
    };

    // Add both click and mousedown listeners for maximum compatibility
    document.addEventListener('click', handleGlobalClick, true);
    document.addEventListener('mousedown', handleGlobalClick, true);

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
      document.removeEventListener('mousedown', handleGlobalClick, true);
    };
  }, [handleModelSelect]);

  // Add direct DOM manipulation for automation testing
  useEffect(() => {
    const buttons = document.querySelectorAll('[data-testid^="model-option-"]');
    buttons.forEach((button) => {
      const element = button as HTMLElement;
      // Store the original onclick handler
      const originalOnClick = element.onclick;

      // Override with our handler
      element.onclick = (event) => {
        const modelValue = element.getAttribute('data-model-value');
        if (modelValue && ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'].includes(modelValue)) {
          event.preventDefault();
          event.stopPropagation();

          handleModelSelect(modelValue as 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner');

          if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {

          }
        }

        // Also call original handler if it exists
        if (originalOnClick) {
          originalOnClick.call(element, event);
        }
      };
    });

    // Cleanup function
    return () => {
      buttons.forEach((button) => {
        const element = button as HTMLElement;
        element.onclick = null;
      });
    };
  }, [isOpen, handleModelSelect]); // Re-run when modal opens/closes

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
            <span style={{ fontSize: '14px' }}>
              {selectedOption?.icon || '💬'}
            </span>
          </div>
        </button>
      </div>

      {/* Modal Overlay - Optimized for 10vh Height Constraint */}
      {isOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 9999,
            animation: 'modalFadeIn 0.3s ease-out',
          }}
          onClick={() => setIsOpen(false)}
        >
          {/* Ultra-Compact Model Selection Card */}
          <div
            className="relative"
            style={{
              backgroundColor: 'var(--white)',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: 'var(--border-in-light)',
              padding: '12px 16px', // Reduced padding for more compact design
              width: '300px', // Further reduced width for compact design
              maxWidth: '90vw',
              height: 'auto', // Auto height to fit content
              maxHeight: '80vh', // Use viewport height to ensure it fits on screen
              minHeight: '200px', // Minimum usable height
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transform: 'translate(-50%, -40%)', // Move down a bit more to show top content
              position: 'fixed',
              top: '50%',
              left: '50%',
              animation: 'modalSlideIn 0.3s ease-out',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Ultra-Compact Header */}
            <div
              className="flex items-center justify-between"
              style={{
                marginBottom: '12px', // More comfortable spacing
                flexShrink: 0, // Prevent shrinking
              }}
            >
              <h3
                style={{
                  fontSize: '16px', // Larger, more readable title
                  fontWeight: 'bold',
                  color: 'var(--black)',
                  margin: 0,
                  lineHeight: '1.2',
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
                  padding: '2px', // Reduced padding
                  borderRadius: '4px',
                  width: '20px', // Compact size
                  height: '20px',
                  flexShrink: 0,
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
                  width="12" // Reduced icon size for compact design
                  height="12"
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

            {/* Ultra-Compact Model Options */}
            <div
              style={{
                flex: 1, // Take remaining space
                overflowY: 'auto', // Enable scrolling for 10vh constraint
                overflowX: 'hidden',
                paddingRight: '0', // No extra padding needed
              }}
            >
              {modelOptions.map((option, index) => {
                const isSelected = selectedModel === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleModelSelect(option.value);
                    }}
                    onMouseDown={(e) => {
                      // Fallback for cases where onClick might not work
                      e.preventDefault();
                      e.stopPropagation();
                      handleModelSelect(option.value);
                    }}
                    onTouchStart={(e) => {
                      // Mobile touch support
                      e.preventDefault();
                      handleModelSelect(option.value);
                    }}
                    onKeyDown={(e) => {
                      // Keyboard accessibility
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleModelSelect(option.value);
                      }
                    }}
                    // Add data attribute for easier testing
                    data-model-value={option.value}
                    data-testid={`model-option-${option.value}`}
                    className="w-full text-left transition-all duration-200 focus:outline-none"
                    style={{
                      backgroundColor: isSelected
                        ? 'var(--primary)'
                        : 'transparent',
                      color: isSelected ? 'white' : 'var(--black)',
                      // Debug: Add a more visible indicator for selected state
                      boxShadow: isSelected ? '0 0 0 2px var(--primary)' : 'none',
                      border: isSelected
                        ? '1px solid var(--primary)' // Thinner border
                        : '1px solid var(--border-in-light)',
                      borderRadius: '8px', // Slightly larger radius for better appearance
                      padding: '8px 12px', // Reduced padding for more compact buttons
                      margin: index > 0 ? '3px 0 0 0' : '0', // Even tighter spacing for compact design
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      textAlign: 'left', // Ensure text is left-aligned
                      minHeight: '40px', // Further reduced height for compact design
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
                    {/* Icon container - wider to handle emoji differences */}
                    <div
                      style={{
                        width: '24px', // Slightly reduced width while maintaining emoji accommodation
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start', // Left-align icons instead of centering
                        flexShrink: 0,
                        fontSize: '14px', // Slightly smaller icon
                        marginRight: '10px', // Reduced margin for compact design
                      }}
                    >
                      {option.icon}
                    </div>

                    {/* Text content - aligned consistently */}
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start', // Ensure content is left-aligned
                      }}
                    >
                      <div
                        style={{
                          fontSize: '14px', // Compact but readable font size
                          fontWeight: '500', // Medium weight, not too bold
                          marginBottom: '2px', // Slightly more spacing for better readability
                          lineHeight: '1.2',
                          whiteSpace: 'normal', // Allow text wrapping
                          overflow: 'visible', // Show full text
                          wordBreak: 'break-word', // Break long words if needed
                        }}
                      >
                        {option.label}
                      </div>
                      {/* Show description now that we have more space */}
                      <div
                        style={{
                          fontSize: '12px', // Compact description text
                          color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--black-60)',
                          lineHeight: '1.3',
                          whiteSpace: 'normal', // Allow text wrapping for descriptions too
                          overflow: 'visible',
                          wordBreak: 'break-word',
                        }}
                      >
                        {option.description}
                      </div>
                    </div>

                    {/* Compact Selection Indicator */}
                    {isSelected && (
                      <div
                        style={{
                          width: '6px', // Smaller indicator
                          height: '6px',
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

          </div>
        </div>
      )}
    </>
  );
}
