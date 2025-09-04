#!/bin/bash

# EP-Chat Git状态清理脚本
# 用于系统性地处理未提交的更改

echo "🧹 EP-Chat Git状态清理开始..."
echo "================================"

# 1. 显示当前状态
echo "📊 当前Git状态："
git status --porcelain

echo ""
echo "🤔 分析文件类型..."

# 2. 添加重要的功能性文件
echo "✅ 添加核心功能文件..."
git add GIT_WORKFLOW_IMPROVEMENT.md

# 添加新的API和组件（这些看起来是重要的功能）
echo "✅ 添加新的API路由..."
git add app/api/auth/ app/api/csrf-token/ app/api/health/

echo "✅ 添加新的组件..."
git add app/components/ApiManagement/ app/components/ChatInterface/ app/components/Common/
git add app/components/ErrorBoundary.tsx components/ErrorBoundary.tsx

echo "✅ 添加新的工具库..."
git add hooks/useErrorHandler.ts
git add lib/csrf-client.ts lib/csrf.ts lib/performance-middleware.ts
git add lib/runtime-validation.ts lib/session-manager.ts lib/utils/
git add middleware.ts

echo "✅ 添加测试文件..."
git add tests/

# 3. 检查修改的文件
echo ""
echo "🔍 检查已修改的文件..."
echo "以下文件已被修改，需要决定是否提交："
git diff --name-only

# 4. 提交新增的功能
echo ""
echo "💾 提交新增功能..."
git commit -m "feat: 添加安全性和性能增强功能

- 新增CSRF保护和认证API
- 添加错误处理和性能监控组件
- 增强API管理和聊天界面组件
- 添加运行时验证和会话管理
- 完善测试覆盖率
- 添加Git工作流改进文档"

# 5. 显示剩余未处理的文件
echo ""
echo "📋 剩余未处理的文件："
git status --porcelain

echo ""
echo "🎯 下一步建议："
echo "1. 检查剩余的修改文件，决定是否需要提交"
echo "2. 运行 'git diff <filename>' 查看具体修改"
echo "3. 使用 'git add <filename>' 添加需要的文件"
echo "4. 使用 'git checkout -- <filename>' 丢弃不需要的修改"
echo "5. 运行 'git clean -fd' 删除未跟踪的临时文件（谨慎使用）"

echo ""
echo "✨ Git清理完成！"
