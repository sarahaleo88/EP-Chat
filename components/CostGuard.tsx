/**
 * 成本守护组件
 * 显示成本预告条和用户确认界面
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon as AlertTriangle,
  CurrencyDollarIcon as DollarSign,
  ChartBarIcon as TrendingUp,
  ClockIcon as Clock,
  UsersIcon as Users
} from '@heroicons/react/24/outline';

interface CostEstimate {
  inputCost: number;
  outputCost: number;
  reasoningCost: number;
  totalCost: number;
  currency: string;
}

interface BudgetStatus {
  withinRequestLimit: boolean;
  withinUserLimit: boolean;
  withinSiteLimit: boolean;
  userSpentToday: number;
  siteSpentThisHour: number;
  remainingBudget: {
    request: number;
    userDaily: number;
    siteHourly: number;
  };
}

interface CostGuardProps {
  isVisible: boolean;
  costEstimate: CostEstimate;
  budgetStatus: BudgetStatus;
  recommendations?: {
    recommendedOutputTokens?: number;
    suggestedActions?: string[];
    alternativeStrategies?: string[];
  };
  onConfirm: () => void;
  onCancel: () => void;
  onAdjust: (newTokens: number) => void;
}

export default function CostGuard({
  isVisible,
  costEstimate,
  budgetStatus,
  recommendations,
  onConfirm,
  onCancel,
  onAdjust,
}: CostGuardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [adjustedTokens, setAdjustedTokens] = useState(recommendations?.recommendedOutputTokens || 0);

  if (!isVisible) {
    return null;
  }

  const hasViolations = !budgetStatus.withinRequestLimit || 
                       !budgetStatus.withinUserLimit || 
                       !budgetStatus.withinSiteLimit;

  const getViolationLevel = () => {
    if (!budgetStatus.withinRequestLimit) {
      return 'critical';
    }
    if (!budgetStatus.withinUserLimit || !budgetStatus.withinSiteLimit) {
      return 'warning';
    }
    return 'info';
  };

  const violationLevel = getViolationLevel();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className={`px-6 py-4 border-b ${
          violationLevel === 'critical' ? 'bg-red-50 border-red-200' :
          violationLevel === 'warning' ? 'bg-yellow-50 border-yellow-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              violationLevel === 'critical' ? 'bg-red-100' :
              violationLevel === 'warning' ? 'bg-yellow-100' :
              'bg-blue-100'
            }`}>
              {violationLevel === 'critical' ? (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              ) : (
                <DollarSign className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {hasViolations ? '预算限制警告' : '成本确认'}
              </h3>
              <p className="text-sm text-gray-600">
                {hasViolations ? '当前请求超出预算限制' : '请确认生成成本'}
              </p>
            </div>
          </div>
        </div>

        {/* 成本预估 */}
        <div className="px-6 py-4">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              成本预估
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">输入成本:</span>
                <span className="ml-2 font-mono">${costEstimate.inputCost.toFixed(4)}</span>
              </div>
              <div>
                <span className="text-gray-600">输出成本:</span>
                <span className="ml-2 font-mono">${costEstimate.outputCost.toFixed(4)}</span>
              </div>
              {costEstimate.reasoningCost > 0 && (
                <div>
                  <span className="text-gray-600">推理成本:</span>
                  <span className="ml-2 font-mono">${costEstimate.reasoningCost.toFixed(4)}</span>
                </div>
              )}
              <div className="col-span-2 pt-2 border-t border-gray-200">
                <span className="text-gray-900 font-medium">总成本:</span>
                <span className="ml-2 font-mono text-lg font-bold">
                  ${costEstimate.totalCost.toFixed(4)}
                </span>
              </div>
            </div>
          </div>

          {/* 预算状态 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              预算状态
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">单请求限制</span>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    budgetStatus.withinRequestLimit ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <span className="text-sm font-mono">
                    ${budgetStatus.remainingBudget.request.toFixed(4)} 剩余
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  用户日限制
                </span>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    budgetStatus.withinUserLimit ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <span className="text-sm font-mono">
                    ${budgetStatus.remainingBudget.userDaily.toFixed(4)} 剩余
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  全站时限制
                </span>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    budgetStatus.withinSiteLimit ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <span className="text-sm font-mono">
                    ${budgetStatus.remainingBudget.siteHourly.toFixed(4)} 剩余
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 建议和调整 */}
          {recommendations && (
            <div className="bg-yellow-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-3">建议调整</h4>
              
              {recommendations.recommendedOutputTokens && (
                <div className="mb-3">
                  <label className="block text-sm text-gray-600 mb-2">
                    推荐输出长度: {recommendations.recommendedOutputTokens} tokens
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="512"
                      max={recommendations.recommendedOutputTokens}
                      value={adjustedTokens}
                      onChange={(e) => setAdjustedTokens(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-20 text-right">
                      {adjustedTokens} tokens
                    </span>
                  </div>
                </div>
              )}

              {recommendations.suggestedActions && recommendations.suggestedActions.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-2">建议操作:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {recommendations.suggestedActions.map((action, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-yellow-500 mr-2">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {recommendations.alternativeStrategies && recommendations.alternativeStrategies.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    {showDetails ? '隐藏' : '查看'}替代方案
                  </button>
                  {showDetails && (
                    <ul className="mt-2 text-sm text-gray-700 space-y-1">
                      {recommendations.alternativeStrategies.map((strategy, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {strategy}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            取消
          </button>
          
          {recommendations?.recommendedOutputTokens && adjustedTokens !== recommendations.recommendedOutputTokens && (
            <button
              onClick={() => onAdjust(adjustedTokens)}
              className="px-4 py-2 text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
            >
              调整后生成
            </button>
          )}
          
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${
              hasViolations
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {hasViolations ? '强制执行' : '确认生成'}
          </button>
        </div>
      </div>
    </div>
  );
}
