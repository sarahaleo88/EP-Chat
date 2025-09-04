/**
 * ChatSettings - Configuration panel component
 * Handles API key management, model selection, and other settings
 */

'use client';

import React, { useState, useCallback } from 'react';
import { ModelSelector } from '../ModelSelector';
import { PerformanceDashboard } from '../PerformanceDashboard';
import QuickButtonEditor from '../QuickButtonEditor';
import { QuickButtonConfig } from '../../../types/quickButtons';

// Icon components
const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97L2.46 14.6c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.31.61.22l2.49-1c.52.39 1.06.73 1.69.98l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.25 1.17-.59 1.69-.98l2.49 1c.22.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
  </svg>
);

interface ChatSettingsProps {
  // API Key settings
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
  sessionAuthenticated: boolean;
  sessionLoading: boolean;

  // Model settings
  selectedModel: 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner';
  onModelChange: (model: 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner') => void;

  // Quick buttons
  quickButtons: QuickButtonConfig[];
  onQuickButtonsChange: (buttons: QuickButtonConfig[]) => void;

  // Performance dashboard
  showPerformanceDashboard: boolean;
  onTogglePerformanceDashboard: () => void;

  // Settings panel
  showSettings: boolean;
  onToggleSettings: () => void;
  onSaveSettings: () => void;

  // Mobile sidebar
  isMobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
  onCloseMobileSidebar: () => void;
}

/**
 * ChatSettings component for configuration management
 */
export const ChatSettings: React.FC<ChatSettingsProps> = ({
  apiKey,
  onApiKeyChange,
  sessionAuthenticated,
  sessionLoading,
  selectedModel,
  onModelChange,
  quickButtons,
  onQuickButtonsChange,
  showPerformanceDashboard,
  onTogglePerformanceDashboard,
  showSettings,
  onToggleSettings,
  onSaveSettings,
  isMobileSidebarOpen,
  onToggleMobileSidebar,
  onCloseMobileSidebar,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'quickButtons' | 'performance'>('general');

  // Handle settings save
  const handleSaveSettings = useCallback(() => {
    onSaveSettings();
  }, [onSaveSettings]);

  return (
    <>
      {/* Settings toggle button */}
      <button
        onClick={onToggleSettings}
        className="settings-toggle-btn fixed top-4 right-4 z-50 p-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        title="设置"
      >
        <SettingsIcon />
      </button>

      {/* Mobile sidebar toggle */}
      <button
        onClick={onToggleMobileSidebar}
        className="mobile-sidebar-toggle md:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow"
        title="菜单"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z" />
        </svg>
      </button>

      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div
          className="mobile-sidebar-overlay md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onCloseMobileSidebar}
        />
      )}

      {/* Settings panel */}
      {showSettings && (
        <div className="settings-panel fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-lg z-40 overflow-y-auto">
          {/* Header */}
          <div className="settings-header flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">设置</h2>
            <button
              onClick={onToggleSettings}
              className="p-1 hover:bg-gray-100 rounded"
              title="关闭设置"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Tabs */}
          <div className="settings-tabs flex border-b border-gray-200">
            {[
              { id: 'general', label: '常规' },
              { id: 'quickButtons', label: '快捷按钮' },
              { id: 'performance', label: '性能' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="settings-content p-4 space-y-6">
            {/* General settings */}
            {activeTab === 'general' && (
              <div className="general-settings space-y-6">
                {/* API Key section */}
                <div className="api-key-section">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DeepSeek API 密钥
                  </label>
                  
                  {sessionLoading ? (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      <span>正在加载会话...</span>
                    </div>
                  ) : sessionAuthenticated ? (
                    <div className="flex items-center space-x-2 text-sm text-green-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>API 密钥已安全保存</span>
                    </div>
                  ) : (
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => onApiKeyChange(e.target.value)}
                      placeholder="请输入您的 DeepSeek API 密钥"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                  
                  <p className="mt-2 text-xs text-gray-500">
                    API 密钥将被安全加密存储，不会在客户端明文保存
                  </p>
                </div>

                {/* Model selection */}
                <div className="model-section">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    模型选择
                  </label>
                  <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={onModelChange}
                  />
                </div>
              </div>
            )}

            {/* Quick buttons settings */}
            {activeTab === 'quickButtons' && (
              <div className="quick-buttons-settings space-y-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">快捷按钮配置</h4>
                {quickButtons.map((button, index) => (
                  <div key={button.id} className="border border-gray-200 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-gray-600 mb-2">按钮 {index + 1}</h5>
                    <QuickButtonEditor
                      data={button}
                      onChange={(updatedButton) => {
                        const newButtons = [...quickButtons];
                        newButtons[index] = updatedButton;
                        onQuickButtonsChange(newButtons);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Performance settings */}
            {activeTab === 'performance' && (
              <div className="performance-settings space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    性能监控面板
                  </label>
                  <button
                    onClick={onTogglePerformanceDashboard}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showPerformanceDashboard ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showPerformanceDashboard ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {showPerformanceDashboard && (
                  <div className="performance-dashboard-preview">
                    <PerformanceDashboard
                      isOpen={true}
                      onClose={() => {}}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="settings-footer p-4 border-t border-gray-200">
            <button
              onClick={handleSaveSettings}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              保存设置
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatSettings;
