/**
 * 模板选择器组件
 * 支持场景切换和模板选择
 */

'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { cn } from '@/lib/utils';
import type { Scenario, TemplateOption } from '@/lib/types';
import { getTemplateOptions } from '@/lib/template-registry';
import LoadingSpinner from './LoadingSpinner';

interface TemplateSelectorProps {
  scenario: Scenario;
  templateId: string;
  onScenarioChange: (scenario: Scenario) => void;
  onTemplateChange: (templateId: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * 模板选择器组件
 * @param scenario - 当前场景
 * @param templateId - 当前模板 ID
 * @param onScenarioChange - 场景变化回调
 * @param onTemplateChange - 模板变化回调
 * @param disabled - 是否禁用
 * @param className - 自定义样式类
 * @returns JSX 元素
 */
export default function TemplateSelector({
  scenario,
  templateId,
  onScenarioChange,
  onTemplateChange,
  disabled = false,
  className,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 场景选项
  const scenarioOptions = [
    {
      id: 'code' as Scenario,
      name: '代码工具',
      description: '生成代码工具、库和实用程序',
      icon: '🛠️',
    },
    {
      id: 'web' as Scenario,
      name: 'Web 应用',
      description: '生成 Web 应用和组件',
      icon: '🌐',
    },
  ];

  /**
   * 加载模板选项
   */
  const loadTemplates = useCallback(
    async (currentScenario: Scenario) => {
      setLoading(true);
      setError(null);

      try {
        const options = await getTemplateOptions(currentScenario);
        setTemplates(options);

        // 如果当前模板不在新场景中，选择第一个模板
        if (options.length > 0 && !options.find(t => t.id === templateId)) {
          onTemplateChange(options[0]!.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载模板失败');
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    },
    [templateId, onTemplateChange]
  );

  // 场景变化时重新加载模板
  useEffect(() => {
    loadTemplates(scenario);
  }, [scenario, loadTemplates]);

  /**
   * 处理场景变化
   */
  const handleScenarioChange = useCallback(
    (newScenario: Scenario) => {
      if (newScenario !== scenario) {
        onScenarioChange(newScenario);
      }
    },
    [scenario, onScenarioChange]
  );

  // 获取当前选中的场景和模板
  const currentScenario = scenarioOptions.find(s => s.id === scenario);
  const currentTemplate = templates.find(t => t.id === templateId);

  return (
    <div className={cn('space-y-4', className)}>
      {/* 场景选择器 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          选择场景
        </label>
        <div className="grid grid-cols-2 gap-3">
          {scenarioOptions.map(option => (
            <button
              key={option.id}
              onClick={() => handleScenarioChange(option.id)}
              disabled={disabled}
              className={cn(
                'relative p-4 rounded-xl border-2 text-left transition-all duration-200',
                'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-shamrock-500 focus:ring-offset-2',
                scenario === option.id
                  ? 'border-shamrock-500 bg-shamrock-50 dark:bg-shamrock-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{option.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3
                    className={cn(
                      'text-sm font-semibold',
                      scenario === option.id
                        ? 'text-shamrock-700 dark:text-shamrock-300'
                        : 'text-gray-900 dark:text-gray-100'
                    )}
                  >
                    {option.name}
                  </h3>
                  <p
                    className={cn(
                      'text-xs mt-1',
                      scenario === option.id
                        ? 'text-shamrock-600 dark:text-shamrock-400'
                        : 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {option.description}
                  </p>
                </div>
              </div>

              {/* 选中指示器 */}
              {scenario === option.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-shamrock-500 rounded-full" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 模板选择器 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          选择模板
        </label>

        {loading ? (
          <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <LoadingSpinner size="sm" text="加载模板中..." />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => loadTemplates(scenario)}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline"
            >
              重试
            </button>
          </div>
        ) : (
          <Listbox
            value={templateId}
            onChange={onTemplateChange}
            disabled={disabled || templates.length === 0}
          >
            <div className="relative">
              <Listbox.Button
                className={cn(
                  'relative w-full cursor-default rounded-xl bg-white dark:bg-gray-800 py-3 pl-4 pr-10 text-left shadow-sm',
                  'border border-gray-200 dark:border-gray-700',
                  'focus:border-shamrock-500 focus:outline-none focus:ring-2 focus:ring-shamrock-500 focus:ring-offset-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-all duration-200'
                )}
              >
                <span className="block truncate">
                  {currentTemplate ? (
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {currentTemplate.title}
                      </div>
                      {currentTemplate.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {currentTemplate.description}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">
                      {templates.length === 0 ? '暂无可用模板' : '请选择模板'}
                    </span>
                  )}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>

              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {templates.map(template => (
                    <Listbox.Option
                      key={template.id}
                      className={({ active }) =>
                        cn(
                          'relative cursor-default select-none py-3 pl-10 pr-4',
                          active
                            ? 'bg-shamrock-100 dark:bg-shamrock-900/20 text-shamrock-900 dark:text-shamrock-100'
                            : 'text-gray-900 dark:text-gray-100'
                        )
                      }
                      value={template.id}
                    >
                      {({ selected }) => (
                        <>
                          <div
                            className={cn(
                              selected ? 'font-medium' : 'font-normal',
                              'block truncate'
                            )}
                          >
                            <div>{template.title}</div>
                            {template.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {template.description}
                              </div>
                            )}
                          </div>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-shamrock-600 dark:text-shamrock-400">
                              <CheckIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        )}
      </div>

      {/* 模板信息 */}
      {currentTemplate && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            模板信息
          </h4>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <span className="font-medium">场景:</span>
              <span>{currentScenario?.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">模板:</span>
              <span>{currentTemplate.title}</span>
            </div>
            {currentTemplate.description && (
              <div className="flex items-start space-x-2">
                <span className="font-medium">描述:</span>
                <span className="flex-1">{currentTemplate.description}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
