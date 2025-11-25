# CLAUDE.md

Guidance for Claude Code when working on this repository.

## 项目概述
- **项目名称**：EP Chat (Enhanced Prompt)
- **定位**：超轻量级提示增强工具，专为 Claude Code 设计
- **核心功能**：提示增强、DeepSeek 模型集成（chat / coder / reasoner）、模板系统、流式响应
- **技术栈**：Next.js 15 App Router、React 18、TypeScript 5、Tailwind CSS 3
- **架构**：单一代码库的前端应用（无独立后端服务器）

## 关键文件与目录（均真实存在）
- `app/page.tsx` — 主页面组件（加载 WindowStyleChat）
- `app/components/WindowStyleChat.tsx` — 聊天界面组件
- `lib/deepseek.ts` — DeepSeek API 集成适配层
- `templates/` — 提示模板库目录
- `next.config.js` — Next.js 配置
- `package.json` — 项目依赖与脚本

## 开发提示
- 依赖 DeepSeek API（需设置 `DEEPSEEK_API_KEY`）；使用 `/lib/deepseek.ts` 适配层而非直接在组件内拼接请求。
- UI 主题为四叶草绿色系；保持 Tailwind 配色、字体和组件风格一致。
- 组件均为 App Router “use client” 模式，注意客户端/服务端边界。
- 模板系统位于 `templates/` 下的 JSON 文件，可通过注册表加载，不存在单独的 backend 服务。

## 避免的错误信息（已移除）
- 不存在 “MySmartTranslate (MST)” 或任何翻译产品。
- 无翻译功能描述（文档/网页/GitHub 链接翻译等）。
- 不存在 `simple-backend.js`、`backend/`、`frontend/`、`start-dev.sh` 等路径。
- 未使用 Express 或 FastAPI 服务器；无用户认证、翻译历史或词汇管理。
- UI 非米色主题，而是四叶草绿色主题。

## 与 README 对齐检查
- 项目名称、定位、功能与 README 描述一致。
- 技术栈与 README 中的版本匹配（Next.js 15 / React 18 / TS 5 / Tailwind 3）。
- 所有引用的文件/目录均在仓库中可见。

