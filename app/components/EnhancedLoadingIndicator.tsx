/**
 * Enhanced Loading Indicator Component
 * Provides better visual feedback during API calls with progress estimation
 */

'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LoadingStage {
  label: string;
  duration: number; // in milliseconds
  icon: string;
}

const loadingStages: LoadingStage[] = [
  { label: '连接中...', duration: 1000, icon: '🔗' },
  { label: '生成中...', duration: 8000, icon: '🧠' },
  { label: '完善中...', duration: 2000, icon: '✨' },
];

interface EnhancedLoadingIndicatorProps {
  isLoading: boolean;
  className?: string;
  showProgress?: boolean;
  estimatedDuration?: number; // in milliseconds
}

export function EnhancedLoadingIndicator({
  isLoading,
  className,
  showProgress = true,
  estimatedDuration = 11000, // Default total duration
}: EnhancedLoadingIndicatorProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setCurrentStage(0);
      setProgress(0);
      setElapsedTime(0);
      return;
    }

    const startTime = Date.now();
    let stageStartTime = startTime;
    let currentStageIndex = 0;

    const updateProgress = () => {
      const now = Date.now();
      const totalElapsed = now - startTime;
      setElapsedTime(totalElapsed);

      // Calculate overall progress
      const overallProgress = Math.min(
        (totalElapsed / estimatedDuration) * 100,
        95
      );
      setProgress(overallProgress);

      // Update stage based on elapsed time
      let cumulativeDuration = 0;
      for (let i = 0; i < loadingStages.length; i++) {
        cumulativeDuration += loadingStages[i]?.duration || 0;
        if (totalElapsed < cumulativeDuration) {
          if (currentStageIndex !== i) {
            currentStageIndex = i;
            setCurrentStage(i);
            stageStartTime = now;
          }
          break;
        }
      }

      // If we've exceeded all stages, stay on the last one
      if (
        totalElapsed >= cumulativeDuration &&
        currentStageIndex !== loadingStages.length - 1
      ) {
        currentStageIndex = loadingStages.length - 1;
        setCurrentStage(currentStageIndex);
      }
    };

    const interval = setInterval(updateProgress, 100);

    return () => {
      clearInterval(interval);
    };
  }, [isLoading, estimatedDuration]);

  if (!isLoading) {
    return null;
  }

  const currentStageData = loadingStages[currentStage];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {/* Main Loading Animation */}
      <div className="relative mb-4">
        {/* Outer Ring */}
        <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-600 rounded-full animate-pulse">
          {/* Progress Ring */}
          <div
            className="absolute inset-0 border-4 border-transparent border-t-shamrock-500 rounded-full animate-spin"
            style={{
              animationDuration: '1s',
            }}
          />

          {/* Inner Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-2xl animate-bounce"
              style={{ animationDelay: '0.5s' }}
            >
              {currentStageData?.icon || '🍀'}
            </span>
          </div>
        </div>

        {/* Pulse Effect */}
        <div className="absolute inset-0 w-16 h-16 border-2 border-shamrock-300 rounded-full animate-ping opacity-30" />
      </div>

      {/* Stage Information */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
          {currentStageData?.label || '处理中'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          正在处理您的请求，请稍候...
        </p>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="w-full max-w-xs mb-3">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>进度</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-shamrock-400 to-shamrock-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Stage Indicators */}
      <div className="flex space-x-2">
        {loadingStages.map((stage, index) => (
          <div
            key={index}
            className={cn(
              'w-2 h-2 rounded-full transition-all duration-300',
              index <= currentStage
                ? 'bg-shamrock-500 scale-110'
                : 'bg-gray-300 dark:bg-gray-600'
            )}
          />
        ))}
      </div>

      {/* Typing Dots Animation */}
      <div className="flex space-x-1 mt-4">
        {[0, 1, 2].map(index => (
          <div
            key={index}
            className="w-2 h-2 bg-shamrock-500 rounded-full animate-bounce"
            style={{
              animationDelay: `${index * 0.2}s`,
              animationDuration: '1.4s',
            }}
          />
        ))}
      </div>

      {/* Elapsed Time (for debugging/development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-400">
          {(elapsedTime / 1000).toFixed(1)}s
        </div>
      )}
    </div>
  );
}

/**
 * Compact Loading Indicator for inline use - Branded
 */
export function CompactLoadingIndicator({
  isLoading,
  className,
  text = '生成中...',
}: {
  isLoading: boolean;
  className?: string;
  text?: string;
}) {
  if (!isLoading) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400',
        className
      )}
    >
      {/* Branded Spinning Logo */}
      <div className="relative w-4 h-4 flex items-center justify-center">
        <span
          className="text-xs animate-pulse"
          style={{
            animationDuration: '2s',
            filter: 'brightness(1.1)',
          }}
        >
          🍀
        </span>
        <div
          className="absolute inset-0 border border-shamrock-400 rounded-full animate-spin opacity-40"
          style={{ animationDuration: '2s' }}
        />
      </div>

      {/* Text with Typing Dots */}
      <span className="flex items-center">
        {text}
        <span className="ml-1 flex space-x-0.5">
          {[0, 1, 2].map(index => (
            <span
              key={index}
              className="w-1 h-1 bg-shamrock-500 rounded-full animate-bounce"
              style={{
                animationDelay: `${index * 0.2}s`,
                animationDuration: '1.4s',
              }}
            />
          ))}
        </span>
      </span>
    </div>
  );
}

/**
 * Message Loading Bubble for chat interface - Compact & Branded
 */
export function MessageLoadingBubble({
  className,
  model = 'deepseek-chat',
}: {
  className?: string;
  model?: string;
}) {
  // Model-specific loading messages
  const getLoadingMessage = (model: string) => {
    switch (model) {
      case 'deepseek-reasoner':
        return '🧠 正在深度推理...';
      case 'deepseek-coder':
        return '👨‍💻 正在生成代码...';
      case 'deepseek-chat':
      default:
        return '💬 正在思考...';
    }
  };
  return (
    <div
      className={cn(
        'flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 max-w-fit',
        className
      )}
    >
      {/* Compact Branded Avatar with Project Logo */}
      <div className="relative w-6 h-6 bg-gradient-to-br from-shamrock-400 to-shamrock-600 rounded-full flex items-center justify-center flex-shrink-0">
        {/* Project Logo - 🍀 */}
        <span
          className="text-sm animate-pulse"
          style={{
            animationDuration: '2s',
            filter: 'brightness(1.2)',
          }}
        >
          🍀
        </span>

        {/* Subtle rotating ring around logo */}
        <div
          className="absolute inset-0 border border-shamrock-300 rounded-full animate-spin opacity-30"
          style={{ animationDuration: '3s' }}
        />
      </div>

      {/* Compact Typing Indicator */}
      <div className="flex space-x-1">
        {[0, 1, 2].map(index => (
          <div
            key={index}
            className="w-1.5 h-1.5 bg-shamrock-500 rounded-full animate-bounce"
            style={{
              animationDelay: `${index * 0.2}s`,
              animationDuration: '1.4s',
            }}
          />
        ))}
      </div>

      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
        {getLoadingMessage(model)}
      </span>
    </div>
  );
}

/**
 * Ultra-Compact Loading Indicator for minimal chat interface
 */
export function MiniLoadingIndicator({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center space-x-1.5 p-2 bg-gray-50 dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600 max-w-fit',
        className
      )}
    >
      {/* Mini Project Logo */}
      <div className="relative w-4 h-4 flex items-center justify-center">
        <span
          className="text-xs animate-pulse"
          style={{
            animationDuration: '2s',
            filter: 'brightness(1.2)',
          }}
        >
          🍀
        </span>
        <div
          className="absolute inset-0 border border-shamrock-300 rounded-full animate-spin opacity-25"
          style={{ animationDuration: '3s' }}
        />
      </div>

      {/* Mini Typing Dots */}
      <div className="flex space-x-0.5">
        {[0, 1, 2].map(index => (
          <div
            key={index}
            className="w-1 h-1 bg-shamrock-500 rounded-full animate-bounce"
            style={{
              animationDelay: `${index * 0.2}s`,
              animationDuration: '1.4s',
            }}
          />
        ))}
      </div>
    </div>
  );
}
