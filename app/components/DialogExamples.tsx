/**
 * Dialog 组件使用示例
 * 展示各种对话框的使用方法和最佳实践
 */

'use client';

import { useState } from 'react';
import { Dialog, DialogHeader, DialogBody, DialogFooter, ConfirmDialog } from './Dialog';
import { SlideOver, SlideOverHeader, SlideOverBody, SlideOverFooter, SettingsSlideOver } from './SlideOver';
import { BottomSheet, BottomSheetHeader, BottomSheetBody, BottomSheetFooter, ActionBottomSheet } from './BottomSheet';
import { cn } from '@/lib/utils';

/**
 * Dialog 使用示例组件
 */
export function DialogExamples() {
  // 对话框状态
  const [showBasicDialog, setShowBasicDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSlideOver, setShowSlideOver] = useState(false);
  const [showSettingsSlideOver, setShowSettingsSlideOver] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);

  return (
    <div className="p-8 space-y-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          Dialog 组件示例
        </h1>

        {/* 按钮网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* 基础对话框 */}
          <button
            onClick={() => setShowBasicDialog(true)}
            className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="w-8 h-8 bg-clover-100 dark:bg-clover-900/20 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-4 h-4 text-clover-600 dark:text-clover-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.436L3 21l2.436-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">基础对话框</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">标准的模态对话框</p>
          </button>

          {/* 确认对话框 */}
          <button
            onClick={() => setShowConfirmDialog(true)}
            className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">确认对话框</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">危险操作确认</p>
          </button>

          {/* 侧边滑出 */}
          <button
            onClick={() => setShowSlideOver(true)}
            className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">侧边滑出</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">不干扰主内容的面板</p>
          </button>

          {/* 设置面板 */}
          <button
            onClick={() => setShowSettingsSlideOver(true)}
            className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">设置面板</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">预设的设置界面</p>
          </button>

          {/* 底部弹出 */}
          <button
            onClick={() => setShowBottomSheet(true)}
            className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">底部弹出</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">移动端友好的面板</p>
          </button>

          {/* 操作面板 */}
          <button
            onClick={() => setShowActionSheet(true)}
            className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 text-left"
          >
            <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">操作面板</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">快速操作选择</p>
          </button>
        </div>

        {/* 使用说明 */}
        <div className="bg-clover-50 dark:bg-clover-900/20 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-clover-900 dark:text-clover-100 mb-3">
            垂直滚动优化特性
          </h2>
          <ul className="space-y-2 text-sm text-clover-700 dark:text-clover-300">
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 bg-clover-500 rounded-full mt-2 flex-shrink-0"></span>
              <span><strong>Dialog:</strong> 居中模态框，适合重要信息展示</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 bg-clover-500 rounded-full mt-2 flex-shrink-0"></span>
              <span><strong>SlideOver:</strong> 侧边滑出，不干扰主内容滚动</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 bg-clover-500 rounded-full mt-2 flex-shrink-0"></span>
              <span><strong>BottomSheet:</strong> 移动端优化，支持手势操作</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 bg-clover-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>所有组件都支持深色模式和无障碍访问</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 基础对话框 */}
      <Dialog
        isOpen={showBasicDialog}
        onClose={() => setShowBasicDialog(false)}
        size="md"
      >
        <DialogHeader
          title="基础对话框"
          subtitle="这是一个标准的模态对话框示例"
        />
        <DialogBody>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            这个对话框展示了基本的结构和样式。它包含头部、主体和底部三个部分，
            支持深色模式，并且完全响应式。
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">特性：</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• 响应式设计</li>
              <li>• 深色模式支持</li>
              <li>• 键盘导航</li>
              <li>• 无障碍访问</li>
            </ul>
          </div>
        </DialogBody>
        <DialogFooter>
          <button
            onClick={() => setShowBasicDialog(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => setShowBasicDialog(false)}
            className="px-4 py-2 text-sm font-medium bg-clover-500 hover:bg-clover-600 text-white rounded-lg transition-colors"
          >
            确认
          </button>
        </DialogFooter>
      </Dialog>

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => {
          alert('操作已确认！');
        }}
        title="删除确认"
        message="您确定要删除这个项目吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        variant="danger"
      />

      {/* 侧边滑出 */}
      <SlideOver
        isOpen={showSlideOver}
        onClose={() => setShowSlideOver(false)}
        size="lg"
      >
        <SlideOverHeader
          title="详细信息"
          subtitle="查看和编辑项目详情"
        />
        <SlideOverBody>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                项目名称
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                defaultValue="EP - Enhanced Prompt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                描述
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                defaultValue="超轻量级、超快速的提示增强 Web 应用"
              />
            </div>
          </div>
        </SlideOverBody>
        <SlideOverFooter>
          <button
            onClick={() => setShowSlideOver(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => setShowSlideOver(false)}
            className="px-4 py-2 text-sm font-medium bg-clover-500 hover:bg-clover-600 text-white rounded-lg transition-colors"
          >
            保存
          </button>
        </SlideOverFooter>
      </SlideOver>

      {/* 设置面板 */}
      <SettingsSlideOver
        isOpen={showSettingsSlideOver}
        onClose={() => setShowSettingsSlideOver(false)}
        title="应用设置"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              外观设置
            </h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="radio" name="theme" className="mr-3" defaultChecked />
                <span className="text-gray-700 dark:text-gray-300">跟随系统</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="theme" className="mr-3" />
                <span className="text-gray-700 dark:text-gray-300">浅色模式</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="theme" className="mr-3" />
                <span className="text-gray-700 dark:text-gray-300">深色模式</span>
              </label>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              功能设置
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">自动保存</span>
                <input type="checkbox" className="ml-3" defaultChecked />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">实时预览</span>
                <input type="checkbox" className="ml-3" />
              </label>
            </div>
          </div>
        </div>
      </SettingsSlideOver>

      {/* 底部弹出 */}
      <BottomSheet
        isOpen={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        height="half"
      >
        <BottomSheetHeader
          title="分享选项"
          onClose={() => setShowBottomSheet(false)}
        />
        <BottomSheetBody>
          <div className="grid grid-cols-3 gap-4">
            {[
              { name: '复制链接', icon: '🔗' },
              { name: '发送邮件', icon: '📧' },
              { name: '社交分享', icon: '📱' },
              { name: '下载PDF', icon: '📄' },
              { name: '打印', icon: '🖨️' },
              { name: '更多', icon: '⋯' },
            ].map((item, index) => (
              <button
                key={index}
                className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setShowBottomSheet(false)}
              >
                <span className="text-2xl mb-2">{item.icon}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
              </button>
            ))}
          </div>
        </BottomSheetBody>
      </BottomSheet>

      {/* 操作面板 */}
      <ActionBottomSheet
        isOpen={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        title="选择操作"
        actions={[
          {
            label: '编辑',
            onClick: () => alert('编辑操作'),
            variant: 'primary',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          },
          {
            label: '复制',
            onClick: () => alert('复制操作'),
            variant: 'default',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          },
          {
            label: '删除',
            onClick: () => alert('删除操作'),
            variant: 'danger',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          },
        ]}
      />
    </div>
  );
}
