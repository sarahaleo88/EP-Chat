/**
 * Dialog 组件演示页面
 * 展示新的对话框系统如何与现有应用集成
 */

'use client';

import { DialogExamples } from '../components/DialogExamples';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-shamrock-50 to-shamrock-100 dark:from-gray-900 dark:to-gray-800">
      {/* 顶部导航 */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-clover-400 to-clover-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2Z" />
                <path d="M4 10C2.9 10 2 10.9 2 12C2 13.1 2.9 14 4 14C5.1 14 6 13.1 6 12C6 10.9 5.1 10 4 10Z" />
                <path d="M20 10C18.9 10 18 10.9 18 12C18 13.1 18.9 14 20 14C21.1 14 22 13.1 22 12C22 10.9 21.1 10 20 10Z" />
                <path d="M12 18C10.9 18 10 18.9 10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20C14 18.9 13.1 18 12 18Z" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                EP - Dialog Demo
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                新的对话框系统演示
              </p>
            </div>
          </div>
          
          <a
            href="/"
            className="px-4 py-2 text-sm font-medium text-clover-600 dark:text-clover-400 hover:text-clover-700 dark:hover:text-clover-300 transition-colors"
          >
            返回主页
          </a>
        </div>
      </nav>

      {/* 主要内容 */}
      <main>
        <DialogExamples />
      </main>

      {/* 底部信息 */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-8 mt-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            关于这套对话框系统
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">垂直滚动优化</h3>
              <p>专为垂直滚动页面设计，不会干扰用户的浏览体验</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">响应式设计</h3>
              <p>自适应不同屏幕尺寸，移动端自动切换为底部弹出</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">无障碍访问</h3>
              <p>支持键盘导航、屏幕阅读器和完整的 ARIA 属性</p>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              基于 Headless UI 构建 • 使用 Tailwind CSS 样式 • 支持深色模式
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
