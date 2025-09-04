'use client';

import React from 'react';
import { DeepSeekModel } from '@/lib/types';

interface SimpleModelSelectorProps {
  value: DeepSeekModel;
  onChange: (model: DeepSeekModel) => void;
  className?: string;
}

/**
 * Simple model selector component for choosing DeepSeek models
 * Optimized for bundle size with minimal dependencies
 */
export default function SimpleModelSelector({ value, onChange, className = '' }: SimpleModelSelectorProps) {
  return (
    <div className={`px-4 pb-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        选择模型
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value as DeepSeekModel)}
        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-shamrock-500 focus:border-transparent"
      >
        <option value="deepseek-chat">💬 DeepSeek Chat</option>
        <option value="deepseek-coder">👨‍💻 DeepSeek Coder</option>
        <option value="deepseek-reasoner">🧠 DeepSeek Reasoner</option>
      </select>
    </div>
  );
}
