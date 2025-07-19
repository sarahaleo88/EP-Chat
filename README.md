# EP - Enhanced Prompt | 增强提示生成器

<div align="center">

🍀 **超轻量级、超快速的提示增强 Web 应用**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![DeepSeek](https://img.shields.io/badge/DeepSeek-API-green)](https://platform.deepseek.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)

[English](#english) | [中文](#中文)

</div>

---

## 中文

### 🎯 项目概述

EP (Enhanced Prompt) 是一个专为 Claude Code 设计的超轻量级提示增强工具，能够将自然语言需求转换为结构化提示，帮助 Claude Code 一次性生成完整的项目代码。

**核心场景：**
- 🛠️ **代码工具** - 生成工具库、实用程序和代码组件
- 🌐 **Web 应用** - 生成完整的 Web 应用和前端组件

**核心特性：**
- ⚡ 超快响应（无历史记录，无文件上传，流式 SSR）
- 🧩 可扩展模板系统（JSON 模板库 + 渲染器）
- 🔒 仅依赖 **DeepSeek API**（chat|coder|reasoner 模型）
- 🍀 统一四叶草图标主题（favicon/loading/UI）
- 🌐 双语支持（中文/英文）
- 📱 移动端响应式设计

### 🛠 技术栈

| 层级 | 技术选择 |
|------|----------|
| 前端 | **Next.js 15** (App Router / SSR & SSG) |
| UI 框架 | **React 18 + TypeScript 5 + Tailwind CSS 3** |
| 状态管理 | React Context (轻量级) |
| 样式 | Tailwind + Headless UI |
| API 集成 | `lib/deepseek.ts` (单一适配层) |
| 构建 | Next.js 原生 turbo 编译 |
| 部署 | 多阶段 **Dockerfile** + **docker-compose.yml** |
| 测试 | Vitest + React Testing Library |

### 🚀 快速开始

#### 1. 环境准备

```bash
# 克隆项目
git clone <repository-url>
cd ep

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 DeepSeek API Key
```

#### 2. 获取 DeepSeek API Key

1. 访问 [DeepSeek Platform](https://platform.deepseek.com/api_keys)
2. 注册账户并创建 API Key
3. 将 API Key 填入 `.env` 文件：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

#### 3. 本地开发

```bash
# 启动开发服务器
npm run dev

# 访问应用
open http://localhost:3000
```

#### 4. Docker 部署

```bash
# 构建并启动
docker compose up -d

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

### 📁 项目结构

```
ep/
├── app/                        # Next.js App Router
│   ├── layout.tsx             # 根布局
│   ├── page.tsx               # 主页面
│   ├── globals.css            # 全局样式
│   ├── api/generate/          # API 路由
│   └── components/            # React 组件
├── lib/                       # 核心库
│   ├── deepseek.ts           # DeepSeek API 客户端
│   ├── template-registry.ts  # 模板注册表
│   ├── prompt-generator.ts   # 提示生成器
│   ├── types.ts              # 类型定义
│   └── utils.ts              # 工具函数
├── templates/                 # JSON 模板库
│   ├── schema.json           # 模板 Schema
│   ├── code/                 # 代码模板
│   └── web/                  # Web 模板
├── tests/                    # 测试文件
├── public/                   # 静态资源
├── Dockerfile               # Docker 配置
├── docker-compose.yml       # Docker Compose
└── README.md               # 项目文档
```

### 🎨 使用方法

1. **选择场景**：代码工具 或 Web 应用
2. **选择模板**：从预定义模板中选择最适合的
3. **选择模型**：Chat（通用）、Coder（代码）、Reasoner（推理）
4. **输入需求**：详细描述你的项目需求
5. **生成提示**：点击生成按钮，获得结构化提示
6. **复制使用**：将生成的提示复制到 Claude Code 中使用

### 🧪 测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test -- --coverage
```

### 🔧 开发

#### 添加新模板

1. 在 `templates/code/` 或 `templates/web/` 中创建 JSON 文件
2. 按照 `templates/schema.json` 定义结构
3. 更新 `lib/template-registry.ts` 中的模板列表

#### 自定义样式

- 主要样式文件：`app/globals.css`
- Tailwind 配置：`tailwind.config.js`
- 四叶草主题色：`--clover-primary: #22c55e`

#### API 扩展

- DeepSeek 客户端：`lib/deepseek.ts`
- API 路由：`app/api/generate/route.ts`
- 类型定义：`lib/types.ts`

### 📊 性能优化

- ✅ 首屏 JS < 50KB (gzipped)
- ✅ 流式响应，实时显示
- ✅ 模板懒加载和缓存
- ✅ 移动端优化
- ✅ SSR + 静态生成

### 🔒 安全特性

- API Key 服务端存储
- 请求频率限制
- 输入内容验证
- XSS 防护
- CSRF 保护

### 🌍 国际化

目前支持：
- 🇨🇳 中文 (zh)
- 🇺🇸 English (en)

### 📝 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

### 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## English

### 🎯 Project Overview

EP (Enhanced Prompt) is an ultra-lightweight prompt enhancement tool designed for Claude Code, converting natural language requirements into structured prompts to help Claude Code generate complete project code in one go.

**Core Scenarios:**
- 🛠️ **Code Tools** - Generate utilities, libraries, and code components
- 🌐 **Web Apps** - Generate complete web applications and frontend components

**Key Features:**
- ⚡ Ultra-fast response (no history, no file uploads, streaming SSR)
- 🧩 Extensible template system (JSON template repository + renderer)
- 🔒 Only depends on **DeepSeek API** (chat|coder|reasoner models)
- 🍀 Unified clover leaf icon theme (favicon/loading/UI)
- 🌐 Bilingual support (Chinese/English)
- 📱 Mobile-responsive design

### 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | **Next.js 15** (App Router / SSR & SSG) |
| UI Framework | **React 18 + TypeScript 5 + Tailwind CSS 3** |
| State Management | React Context (lightweight) |
| Styling | Tailwind + Headless UI |
| API Integration | `lib/deepseek.ts` (single adapter layer) |
| Build | Next.js native turbo compilation |
| Deployment | Multi-stage **Dockerfile** + **docker-compose.yml** |
| Testing | Vitest + React Testing Library |

### 🚀 Quick Start

#### 1. Environment Setup

```bash
# Clone the project
git clone <repository-url>
cd ep

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env file and add your DeepSeek API Key
```

#### 2. Get DeepSeek API Key

1. Visit [DeepSeek Platform](https://platform.deepseek.com/api_keys)
2. Register and create an API Key
3. Add the API Key to `.env` file:

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

#### 3. Local Development

```bash
# Start development server
npm run dev

# Open application
open http://localhost:3000
```

#### 4. Docker Deployment

```bash
# Build and start
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### 📊 Performance

- ✅ First-screen JS < 50KB (gzipped)
- ✅ Streaming response with real-time display
- ✅ Template lazy loading and caching
- ✅ Mobile optimization
- ✅ SSR + Static generation

### 🔒 Security

- Server-side API key storage
- Request rate limiting
- Input validation
- XSS protection
- CSRF protection

### 📝 License

MIT License - see [LICENSE](LICENSE) file for details

### 🤝 Contributing

Issues and Pull Requests are welcome!

---

<div align="center">

**Made with 🍀 by EP Team**

</div>
