/**
 * ApiKeyManager - Secure API key management component
 * Handles API key input, validation, and secure storage
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { SessionManager } from '../../../lib/session-manager';

interface ApiKeyManagerProps {
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
  sessionAuthenticated: boolean;
  sessionLoading: boolean;
  onSessionStateChange: (authenticated: boolean, loading: boolean) => void;
}

/**
 * ApiKeyManager component for secure API key management
 */
export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({
  apiKey,
  onApiKeyChange,
  sessionAuthenticated,
  sessionLoading,
  onSessionStateChange,
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Validate API key format
  const validateApiKeyFormat = useCallback((key: string): boolean => {
    // DeepSeek API keys typically start with 'sk-' and have specific length
    return key.startsWith('sk-') && key.length >= 20;
  }, []);

  // Handle API key change
  const handleApiKeyChange = useCallback((value: string) => {
    onApiKeyChange(value);
    setValidationError(null);
  }, [onApiKeyChange]);

  // Handle API key validation and save
  const handleSaveApiKey = useCallback(async () => {
    if (!apiKey.trim()) {
      setValidationError('请输入 API 密钥');
      return;
    }

    if (!validateApiKeyFormat(apiKey.trim())) {
      setValidationError('API 密钥格式不正确，应以 sk- 开头');
      return;
    }

    setIsValidating(true);
    setValidationError(null);
    onSessionStateChange(false, true);

    try {
      const result = await SessionManager.createSession(apiKey.trim());
      
      if (result.success) {
        onSessionStateChange(true, false);
        onApiKeyChange('***'); // Show placeholder
      } else {
        setValidationError(result.error || '保存 API 密钥失败');
        onSessionStateChange(false, false);
      }
    } catch (error) {
      setValidationError('网络错误，请稍后重试');
      onSessionStateChange(false, false);
    } finally {
      setIsValidating(false);
    }
  }, [apiKey, validateApiKeyFormat, onApiKeyChange, onSessionStateChange]);

  // Handle session destruction
  const handleClearSession = useCallback(async () => {
    onSessionStateChange(false, true);
    
    try {
      await SessionManager.destroySession();
      onApiKeyChange('');
      onSessionStateChange(false, false);
    } catch (error) {
      console.error('Failed to clear session:', error);
      onSessionStateChange(false, false);
    }
  }, [onApiKeyChange, onSessionStateChange]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !sessionAuthenticated) {
      handleSaveApiKey();
    }
  }, [handleSaveApiKey, sessionAuthenticated]);

  return (
    <div className="api-key-manager space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">API 密钥管理</h3>
        {sessionAuthenticated && (
          <button
            onClick={handleClearSession}
            disabled={sessionLoading}
            className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            清除密钥
          </button>
        )}
      </div>

      {/* Status indicator */}
      <div className="status-indicator">
        {sessionLoading ? (
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span>正在处理...</span>
          </div>
        ) : sessionAuthenticated ? (
          <div className="flex items-center space-x-2 text-sm text-green-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>API 密钥已安全保存</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>请输入您的 DeepSeek API 密钥</span>
          </div>
        )}
      </div>

      {/* API Key input */}
      {!sessionAuthenticated && (
        <div className="api-key-input space-y-3">
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              disabled={isValidating || sessionLoading}
              className={`
                w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${validationError ? 'border-red-300' : 'border-gray-300'}
                ${isValidating || sessionLoading ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
              `}
            />
            
            {/* Show/hide toggle */}
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              disabled={isValidating || sessionLoading}
            >
              {showApiKey ? (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Error message */}
          {validationError && (
            <div className="text-sm text-red-600 flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{validationError}</span>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSaveApiKey}
            disabled={!apiKey.trim() || isValidating || sessionLoading}
            className={`
              w-full px-4 py-2 rounded-md font-medium transition-colors
              ${!apiKey.trim() || isValidating || sessionLoading
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }
            `}
          >
            {isValidating ? '验证中...' : '保存密钥'}
          </button>
        </div>
      )}

      {/* Help text */}
      <div className="help-text text-xs text-gray-500 space-y-1">
        <p>• API 密钥将使用 AES-256 加密安全存储</p>
        <p>• 密钥不会在客户端明文保存</p>
        <p>• 您可以在 <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">DeepSeek 平台</a> 获取 API 密钥</p>
      </div>
    </div>
  );
};

export default ApiKeyManager;
