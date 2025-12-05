/**
 * 模型切换组件
 * 支持 DeepSeek 模型选择
 */

'use client';

import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { DeepSeekModel, ModelOption } from '@/lib/types';

interface ModelSwitchProps {
  model: DeepSeekModel;
  onChange: (model: DeepSeekModel) => void;
  disabled?: boolean;
  className?: string;
}

// 模型选项配置
const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'deepseek-chat',
    name: 'Chat',
    description: '通用对话模型，适合大多数场景',
    icon: '💬',
  },
  {
    id: 'deepseek-coder',
    name: 'Coder',
    description: '专业代码生成模型，编程任务首选',
    icon: '👨‍💻',
  },
  {
    id: 'deepseek-reasoner',
    name: 'Reasoner',
    description: '推理增强模型，复杂逻辑分析',
    icon: '🧠',
  },
];

/**
 * 模型切换组件
 * @param model - 当前模型
 * @param onChange - 模型变化回调
 * @param disabled - 是否禁用
 * @param className - 自定义样式类
 * @returns JSX 元素
 */
export default function ModelSwitch({
  model,
  onChange,
  disabled = false,
  className,
}: ModelSwitchProps) {
  /**
   * 处理模型变化
   */
  const handleModelChange = useCallback(
    (newModel: DeepSeekModel) => {
      if (newModel !== model && !disabled) {
        onChange(newModel);
      }
    },
    [model, onChange, disabled]
  );

  return (
    <div className={cn('space-y-3', className)}>
      {/* 标题 */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        选择模型
      </label>

      {/* 模型选项 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {MODEL_OPTIONS.map(option => {
          const isSelected = model === option.id;

          return (
            <button
              key={option.id}
              onClick={() => handleModelChange(option.id)}
              disabled={disabled}
              className={cn(
                'relative p-4 rounded-xl border-2 text-left transition-all duration-200',
                'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-shamrock-500 focus:ring-offset-2',
                isSelected
                  ? 'border-shamrock-500 bg-shamrock-50 dark:bg-shamrock-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-start space-x-3">
                {/* 图标 */}
                <span className="text-xl flex-shrink-0">{option.icon}</span>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={cn(
                      'text-sm font-semibold',
                      isSelected
                        ? 'text-shamrock-700 dark:text-shamrock-300'
                        : 'text-gray-900 dark:text-gray-100'
                    )}
                  >
                    {option.name}
                  </h3>
                  <p
                    className={cn(
                      'text-xs mt-1 leading-relaxed',
                      isSelected
                        ? 'text-shamrock-600 dark:text-shamrock-400'
                        : 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {option.description}
                  </p>
                </div>
              </div>

              {/* 选中指示器 */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-shamrock-500 rounded-full" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 模型说明 */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start space-x-2">
          <svg
            className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">模型选择建议：</p>
            <ul className="space-y-1 text-xs">
              <li>
                • <strong>Chat</strong>：适合通用场景和自然语言处理
              </li>
              <li>
                • <strong>Coder</strong>：专门优化代码生成，推荐用于编程任务
              </li>
              <li>
                • <strong>Reasoner</strong>：增强推理能力，适合复杂逻辑分析
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 紧凑型模型切换组件
 * 用于空间受限的场景
 */
export function CompactModelSwitch({
  model,
  onChange,
  disabled = false,
  className,
}: ModelSwitchProps) {
  // currentOption reserved for future model display features
  // const currentOption = MODEL_OPTIONS.find(option => option.id === model);

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        模型:
      </span>
      <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {MODEL_OPTIONS.map(option => {
          const isSelected = model === option.id;

          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              disabled={disabled}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-shamrock-500 focus:ring-offset-2',
                isSelected
                  ? 'bg-shamrock-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              title={option.description}
            >
              <span className="mr-1">{option.icon}</span>
              {option.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 模型状态指示器
 * 显示当前选中的模型信息
 */
export function ModelIndicator({
  model,
  className,
}: {
  model: DeepSeekModel;
  className?: string;
}) {
  const currentOption = MODEL_OPTIONS.find(option => option.id === model);

  if (!currentOption) {return null;}

  return (
    <div className={cn('flex items-center space-x-2 text-sm', className)}>
      <div className="flex items-center space-x-1 px-2 py-1 bg-shamrock-100 dark:bg-shamrock-900/20 text-shamrock-700 dark:text-shamrock-300 rounded-md">
        <span className="text-xs">{currentOption.icon}</span>
        <span className="font-medium">{currentOption.name}</span>
      </div>
      <span className="text-gray-500 dark:text-gray-400 text-xs">
        {currentOption.description}
      </span>
    </div>
  );
}
