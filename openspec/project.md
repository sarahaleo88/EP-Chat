# EP-Chat Project Context

## Purpose
EP-Chat (Enhanced Prompt) is an ultra-lightweight prompt enhancement tool designed for Claude Code. It converts natural language requirements into structured prompts using DeepSeek API, helping developers generate complete project code in one pass.

**Core Scenarios:**
- 🛠️ Code Tools - Generate utility libraries and code components
- 🌐 Web Apps - Generate complete web applications and frontend components

## Tech Stack
- **Framework:** Next.js 15 (App Router / SSR)
- **Language:** TypeScript 5 (strict mode)
- **UI:** React 18 + Tailwind CSS 3
- **API:** DeepSeek API (deepseek-chat, deepseek-coder, deepseek-reasoner)
- **Validation:** Zod for runtime type validation
- **Testing:** Vitest + React Testing Library
- **Deployment:** Docker + docker-compose

## Project Conventions

### Code Style
- TypeScript strict mode enabled
- Zod schemas for all API inputs/outputs
- Path aliases: `@/lib`, `@/components`, `@/app`
- Server components by default, `'use client'` only when needed
- Chinese comments acceptable for Chinese-facing features

### Architecture Patterns
- Single Next.js application (no separate backend)
- API routes under `app/api/`
- Core business logic in `lib/`
- JSON template system in `templates/`
- Security utilities separated (csrf.ts, session-manager.ts)

### Testing Strategy
- Vitest for all tests
- No mocks for business logic - test real implementations
- Coverage targets: 95% lines/functions, 90% branches
- Test files in `tests/` directory

### Git Workflow
- Main branch: `main`
- Feature branches: `feature/description`
- Security fixes: `security-fixes-*`
- Conventional commits preferred

## Domain Context
EP-Chat is NOT:
- A translation tool
- A file upload service
- A user authentication system
- A chat history service

EP-Chat IS:
- Stateless prompt enhancement
- Single-session interaction
- DeepSeek-only integration

## Important Constraints

### Security Requirements
- **SEC-001:** API keys must never be hardcoded
- **SEC-002:** Third-party brand assets require explicit licensing
- **SEC-003:** CSP with nonce required in production
- Session encryption required for API key storage
- CSRF protection on all state-changing endpoints
- XSS protection via DOMPurify

### Brand & Compliance
- No ChatGPT/OpenAI brand assets without license
- Shamrock green (🍀) is the official theme color
- Third-party LLM icons require usage verification

### Quality Gates
- All tests must pass before release
- Build must complete without errors
- No P0 security issues allowed

## External Dependencies
- **DeepSeek API** - Primary AI backend (https://api.deepseek.com)
- **Google Fonts** - Inter font family
- **shields.io** - README badges
