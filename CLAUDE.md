# CLAUDE.md

Guidance for Claude Code when working on this repository.

## Project Overview

**EP Chat (Enhanced Prompt)** is an ultra-lightweight prompt enhancement tool designed specifically for Claude Code. It converts natural language requirements into structured prompts, helping Claude Code generate complete project code in one go.

**Key Features:**
- ⚡ Ultra-fast response (no history, no file uploads, streaming SSR)
- 🧩 Extensible template system (JSON template library + renderer)
- 🔒 Single dependency: **DeepSeek API** (chat|coder|reasoner models)
- �� Unified shamrock (four-leaf clover) icon theme (favicon/loading/UI)
- 🌐 Bilingual support (Chinese/English)
- 📱 Perfect mobile adaptation (Android/iOS fully optimized)
- ⚡ Long text processing optimization (intelligent timeout management + streaming response)

## Architecture Overview

This is a **single codebase Next.js application** with no separate backend servers.

**Tech Stack:**
- **Frontend Framework**: Next.js 15 (App Router / SSR & SSG)
- **UI Framework**: React 18 + TypeScript 5 + Tailwind CSS 3
- **State Management**: React Context (lightweight)
- **Styling**: Tailwind CSS + Headless UI + SCSS
- **API Integration**: \`lib/deepseek.ts\` (single integration point)
- **Build Tool**: Next.js native turbo compilation
- **Testing**: Vitest + React Testing Library
- **Deployment**: Multi-stage Dockerfile + docker-compose.yml

## Key Files and Directories (All Actually Exist)

### Main Application
- \`app/page.tsx\` — Main page component (loads WindowStyleChat)
- \`app/layout.tsx\` — Root layout with metadata, fonts, and global providers
- \`app/components/WindowStyleChat.tsx\` — Main chat interface component
- \`app/components/CSPNonceProvider.tsx\` — Security provider for CSP compliance

### API Integration
- \`lib/deepseek.ts\` — DeepSeek API integration adapter layer
- \`lib/deepseek-api.ts\` — Low-level API client
- \`lib/prompt-enhancer.ts\` — Prompt enhancement and template rendering logic
- \`lib/template-registry.ts\` — Template management system

### Templates
- \`templates/\` — Prompt template library directory
- \`templates/code/\` — Code generation templates (tools, utilities, components)
- \`templates/web/\` — Web application templates (full apps, frontend components)
- \`templates/schema.json\` — Template schema definition

### Configuration
- \`next.config.js\` — Next.js configuration (minimal, clean)
- \`package.json\` — Project dependencies and npm scripts
- \`tsconfig.json\` — TypeScript compiler options
- \`tailwind.config.js\` — Tailwind CSS customization

### Styles
- \`styles/globals.scss\` — Global SCSS styles
- \`styles/window-style-chat.scss\` — Chat interface specific styles
- \`app/globals.css\` — Global CSS imports

## Development Guidelines

### API Integration
- Always use the \`lib/deepseek.ts\` adapter layer instead of making direct API calls in components
- Requires \`DEEPSEEK_API_KEY\` environment variable to be set
- Supports three models: \`deepseek-chat\`, \`deepseek-coder\`, \`deepseek-reasoner\`
- Streaming responses are handled automatically

### UI Theme
- Primary theme: Shamrock green (🍀) color scheme
- Maintain consistency with Tailwind color palette, fonts, and component styles
- All icons and branding use the four-leaf clover (shamrock) motif

### Component Architecture
- All components use App Router "use client" mode
- Pay attention to client/server boundaries
- Use React Context for lightweight state management
- No Redux, Zustand, or other heavy state management libraries

### Template System
- Templates are JSON files located in \`templates/\` directory
- Loaded through the template registry system
- No separate backend service for template management
- Templates are categorized by type (code/web)

## What This Project IS NOT

❌ **NOT a translation tool** - No "MySmartTranslate (MST)" or any translation product
❌ **NO translation features** - No document/webpage/GitHub link translation
❌ **NO file upload** - No document processing, no file format conversion
❌ **NO separate backend** - No \`simple-backend.js\`, no \`backend/\` directory, no \`frontend/\` directory
❌ **NO start-dev.sh** - Use \`npm run dev\` instead
❌ **NO Express or FastAPI** - This is a Next.js application with API routes
❌ **NO user authentication** - No login system, no user management
❌ **NO translation history** - No vocabulary management, no favorites
❌ **NO beige theme** - Theme is shamrock green, not beige

## Alignment with README

- Project name, positioning, and features match README description
- Tech stack versions match README (Next.js 15 / React 18 / TS 5 / Tailwind 3)
- All referenced files and directories actually exist in the repository
- No references to non-existent features or files

## Quick Start

\`\`\`bash
# Clone the repository
git clone https://github.com/sarahaleo88/EP-Chat.git
cd EP-Chat

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your DEEPSEEK_API_KEY

# Start development server
npm run dev

# Access the application
open http://localhost:3000
\`\`\`

## Available Scripts

\`\`\`bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests with Vitest
npm run type-check   # TypeScript type checking
\`\`\`

## Core Functionality

### 1. Prompt Enhancement
- Converts natural language requirements to structured prompts
- Template-based generation system
- Supports code and web app generation scenarios

### 2. DeepSeek Model Integration
- Three model options: chat (general), coder (code-focused), reasoner (reasoning-focused)
- Streaming response support for real-time output
- Intelligent timeout management for long text generation

### 3. Template System
- JSON-based template library
- Extensible template registry
- Category-based organization (code/web)
- Easy to add new templates

### 4. User Interface
- Window-style chat interface (inspired by ai.saraha.cc)
- Sidebar with model selector and quick start buttons
- Message area with streaming response display
- Responsive design for mobile and desktop

## Important Notes

- **Single Codebase**: This is a Next.js application with API routes, not a separate frontend/backend architecture
- **DeepSeek Only**: The only external API dependency is DeepSeek API
- **No File Operations**: No file uploads, no document processing, no file storage
- **Stateless**: No history, no sessions, no persistent storage (by design for speed)
- **Template-Driven**: All prompt generation is template-based

## Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   \`\`\`bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   \`\`\`

2. **DeepSeek API errors**
   - Verify DEEPSEEK_API_KEY is set correctly
   - Check API key validity at https://platform.deepseek.com/api_keys
   - Ensure sufficient API credits

3. **Build errors**
   \`\`\`bash
   # Clean build cache
   rm -rf .next node_modules
   npm install
   npm run build
   \`\`\`

## Additional Resources

- **README.md** - Comprehensive project documentation
- **CHANGELOG.md** - Version history and changes
- **SECURITY.md** - Security policies and reporting
- **docs/** - Additional documentation (Docker, deployment, etc.)
