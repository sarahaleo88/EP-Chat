/**
 * Enhanced Copy Button Component
 * Provides copy functionality with visual feedback and error handling
 */

'use client';

import { useState, useCallback } from 'react';

interface CopyButtonProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  showText?: boolean;
}

// Copy icon component
const CopyIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" />
  </svg>
);

// Success check icon
const CheckIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
  </svg>
);

export function CopyButton({
  content,
  className = '',
  style = {},
  size = 'md',
  variant = 'icon',
  showText = false,
}: CopyButtonProps) {
  const [copyState, setCopyState] = useState<
    'idle' | 'copying' | 'success' | 'error'
  >('idle');

  // Size configurations
  const sizeConfig = {
    sm: { iconSize: 14, padding: '4px', fontSize: '11px' },
    md: { iconSize: 16, padding: '6px', fontSize: '12px' },
    lg: { iconSize: 18, padding: '8px', fontSize: '13px' },
  };

  const config = sizeConfig[size];

  const handleCopy = useCallback(async () => {
    if (copyState === 'copying') return;

    setCopyState('copying');

    try {
      // Clean content - remove markdown formatting if needed
      const cleanContent = content
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
        .replace(/`(.*?)`/g, '$1') // Remove inline code markdown
        .replace(/#{1,6}\s/g, '') // Remove headers
        .trim();

      // Try modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(cleanContent);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = cleanContent;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (!successful) {
          throw new Error('Fallback copy failed');
        }
      }

      setCopyState('success');

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setCopyState('idle');
      }, 2000);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Copy failed:', error);
      }
      setCopyState('error');

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setCopyState('idle');
      }, 3000);
    }
  }, [content, copyState]);

  // Get button text based on state
  const getButtonText = () => {
    switch (copyState) {
      case 'copying':
        return '复制中...';
      case 'success':
        return '已复制!';
      case 'error':
        return '复制失败';
      default:
        return '复制';
    }
  };

  // Get button color based on state
  const getButtonColor = () => {
    switch (copyState) {
      case 'success':
        return 'var(--shamrock-secondary, #16a34a)'; // Green
      case 'error':
        return '#ef4444'; // Red
      case 'copying':
        return '#f59e0b'; // Orange
      default:
        return 'var(--muted-foreground, #64748b)';
    }
  };

  // Button styles
  const buttonStyle: React.CSSProperties = {
    background: variant === 'button' ? 'var(--muted, #f1f5f9)' : 'none',
    border: variant === 'button' ? '1px solid var(--border, #e2e8f0)' : 'none',
    borderRadius: variant === 'button' ? '6px' : '4px',
    padding: variant === 'button' ? `${config.padding} 8px` : config.padding,
    cursor: copyState === 'copying' ? 'not-allowed' : 'pointer',
    color: getButtonColor(),
    display: 'flex',
    alignItems: 'center',
    gap: showText || variant === 'button' ? '4px' : '0',
    fontSize: config.fontSize,
    fontWeight: variant === 'button' ? '500' : 'normal',
    transition: 'all 0.2s ease',
    opacity: copyState === 'copying' ? 0.6 : 1,
    transform: copyState === 'success' ? 'scale(1.05)' : 'scale(1)',
    ...style,
  };

  // Hover effect for icon variant
  const hoverStyle =
    variant === 'icon'
      ? {
          ':hover': {
            backgroundColor: 'var(--hover-color)',
            transform: 'scale(1.1)',
          },
        }
      : {};

  return (
    <button
      onClick={handleCopy}
      disabled={copyState === 'copying'}
      className={className}
      style={buttonStyle}
      title={getButtonText()}
      onMouseEnter={e => {
        if (variant === 'icon' && copyState === 'idle') {
          e.currentTarget.style.backgroundColor = 'var(--muted, #f1f5f9)';
          e.currentTarget.style.transform = 'scale(1.1)';
        } else if (variant === 'button' && copyState === 'idle') {
          e.currentTarget.style.backgroundColor = 'var(--border, #e2e8f0)';
        }
      }}
      onMouseLeave={e => {
        if (variant === 'icon') {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.transform =
            copyState === 'success' ? 'scale(1.05)' : 'scale(1)';
        } else if (variant === 'button') {
          e.currentTarget.style.backgroundColor = 'var(--muted, #f1f5f9)';
        }
      }}
    >
      {/* Icon */}
      {copyState === 'success' ? (
        <CheckIcon size={config.iconSize} />
      ) : (
        <CopyIcon size={config.iconSize} />
      )}

      {/* Text (if enabled) */}
      {(showText || variant === 'button') && <span>{getButtonText()}</span>}
    </button>
  );
}

// Export individual icons for reuse
export { CopyIcon, CheckIcon };
