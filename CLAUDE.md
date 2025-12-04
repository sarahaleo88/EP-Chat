# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EP Chat (Enhanced Prompt)** is an ultra-lightweight prompt enhancement tool designed for Claude Code. It converts natural language requirements into structured prompts using DeepSeek API.

**Architecture:** Single Next.js 15 application with App Router (no separate backend servers)

**Tech Stack:**
- Next.js 15 (App Router / SSR & SSG)
- React 18 + TypeScript 5 + Tailwind CSS 3
- DeepSeek API integration (`lib/deepseek.ts`)
- Vitest + React Testing Library
- Docker + docker-compose deployment

## Key Commands

### Development
```bash
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint check
npm run type-check       # TypeScript validation
```

### Testing
```bash
npm test                 # Run all tests with Vitest
npm run test:watch       # Watch mode
npm test -- --coverage   # Coverage report
npm test -- path/to/test # Run specific test file
```

### Docker
```bash
# Using Makefile (recommended)
make help                # Show all commands
make dev                 # Build → Start → Logs
make deploy              # Full deployment
make health              # Health check
make logs                # View logs

# Manual commands
docker compose up -d     # Start services
docker compose down      # Stop services
docker compose logs -f   # Follow logs
```

### Stress Testing
```bash
npm run stress-test      # Long text generation test
npm run performance-test # Performance benchmarks
```

## Architecture & Structure

### Core Directories
- **`app/`** - Next.js App Router (pages, layouts, API routes, components)
- **`lib/`** - Core utilities and business logic
- **`templates/`** - JSON template library (code/, web/)
- **`tests/`** - Vitest unit and integration tests
- **`styles/`** - SCSS stylesheets

### Key Files
- **`lib/deepseek.ts`** - Primary DeepSeek API integration layer (ALWAYS use this, not direct API calls)
- **`lib/template-registry.ts`** - Template loading, caching, validation
- **`lib/types.ts`** - Zod-based type definitions with runtime validation
- **`app/page.tsx`** - Main page (loads WindowStyleChat)
- **`app/components/WindowStyleChat.tsx`** - Main chat interface
- **`app/api/generate/route.ts`** - Prompt generation API with streaming

### API Routes
- `/api/generate` - Main prompt generation (streaming SSE)
- `/api/health` - Health check
- `/api/csrf-token` - CSRF protection
- `/api/metrics` - Metrics collection
- `/api/security-metrics` - Security monitoring

## Development Guidelines

### API Integration
- **Always use `lib/deepseek.ts`** adapter layer (never direct API calls in components)
- Supports three models: `deepseek-chat`, `deepseek-coder`, `deepseek-reasoner`
- Streaming responses handled automatically via SSE
- Environment variable required: `DEEPSEEK_API_KEY`

### Component Architecture
- **Server components by default** (App Router)
- Use `'use client'` directive only when needed (state, hooks, browser APIs)
- React Context for lightweight state management (no Redux/Zustand)
- TypeScript strict mode with path aliases (`@/lib`, `@/components`)

### Template System
- Templates are JSON files in `templates/` directory
- Loaded via `lib/template-registry.ts` with caching
- Categorized by type: `code/` and `web/`
- Schema validation in `templates/schema.json`

### Security
- Input validation with Zod schemas (`lib/types.ts`)
- CSRF protection via `lib/csrf.ts`
- Content Security Policy (CSP) with nonce provider
- Session management via `lib/session-manager.ts`
- Never commit API keys (use `.env` files, excluded from git)

### Testing
- **Always use test-runner sub-agent** for running tests (see `.claude/CLAUDE.md`)
- No mocks - test against real implementations
- Coverage thresholds: 95% lines/functions/statements, 90% branches
- Tests must be verbose for debugging

### Styling
- **Theme:** Shamrock green (🍀) - NOT beige, NOT any other color
- Tailwind CSS + SCSS for global styles
- Responsive design with mobile/PWA support
- Path: `styles/globals.scss`, `styles/window-style-chat.scss`

## Important Notes

### What This Project IS
✅ Next.js 15 single-codebase application
✅ Prompt enhancement tool for Claude Code
✅ DeepSeek API as only external dependency
✅ Stateless (no history, no sessions, by design)
✅ Shamrock green theme throughout

### What This Project IS NOT
❌ NOT a translation tool (no "MySmartTranslate")
❌ NO separate backend (`simple-backend.js`, `backend/`, `frontend/` do not exist)
❌ NO file uploads or document processing
❌ NO user authentication or login system
❌ NO `start-dev.sh` script (use `npm run dev`)
❌ NOT Express or FastAPI (Next.js API routes only)

### Environment Configuration
Required in `.env` file:
```env
DEEPSEEK_API_KEY=your_api_key_here
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Optional configurations:
- Redis caching: `REDIS_URL`, `REDIS_PASSWORD`
- Long-text timeouts: `STREAMING_TIMEOUT`, `CHUNK_INTERVAL_TIMEOUT`, `CONTINUATION_TIMEOUT`
- Security: `CORS_ORIGINS`, `RATE_LIMIT_PER_MINUTE`, `CSP_ENABLED`

### Configuration Files
- `next.config.js` - Next.js configuration (minimal)
- `tsconfig.json` - TypeScript with path aliases
- `tailwind.config.js` - Shamrock theme colors
- `vitest.config.ts` - Test runner setup
- `Dockerfile` - 3-stage multi-stage build
- `docker-compose.yml` - Container orchestration

### Common Tasks

**Add new template:**
1. Create JSON file in `templates/code/` or `templates/web/`
2. Follow schema in `templates/schema.json`
3. Template registry auto-loads files

**Extend API functionality:**
1. Modify `lib/deepseek.ts` for client changes
2. Update `app/api/generate/route.ts` for endpoint logic
3. Add types to `lib/types.ts` with Zod validation

**Add new component:**
1. Create in `app/components/`
2. Use `'use client'` only if needed
3. Follow existing naming patterns
4. Add tests in `tests/`

## Sub-Agent Usage

See `.claude/CLAUDE.md` for detailed sub-agent usage rules:
- Use **file-analyzer** for reading verbose files/logs
- Use **code-analyzer** for code analysis, bug research, logic tracing
- Use **test-runner** for executing tests and analyzing results

## Docker Architecture

**3-Stage Build:**
1. **Dependencies** - Install production deps
2. **Builder** - Compile TypeScript, build Next.js (standalone)
3. **Runtime** - Final optimized image (~703MB), non-root user (nextjs:nodejs)

**Key Features:**
- ✅ Proper module resolution (TypeScript paths)
- ✅ Security hardening (non-root, minimal privileges)
- ✅ Health checks via `/api/health`
- ✅ Environment-based configuration

## PWA Features

- Installable on desktop/mobile
- Offline functionality with service worker
- Caching strategy: network-first with cache fallback
- Test PWA: `npm test -- tests/pwa.test.tsx`

## Troubleshooting

**Port conflict (3000):**
```bash
lsof -ti:3000 | xargs kill -9
# Or change port: PORT=3001 npm run dev
```

**Build errors:**
```bash
rm -rf .next node_modules
npm install
npm run build
```

**Docker issues:**
```bash
make clean-all        # Clean Docker cache
docker system prune -a
```

**DeepSeek API errors:**
- Verify `DEEPSEEK_API_KEY` in `.env`
- Check API credits at https://platform.deepseek.com/api_keys
- Test connection: `curl -H "Authorization: Bearer $DEEPSEEK_API_KEY" https://api.deepseek.com/v1/models`

## Additional Resources

- **README.md** - Comprehensive documentation (bilingual)
- **`.claude/CLAUDE.md`** - Developer philosophy and sub-agent rules
- **`docs/ARCHITECTURE.md`** - Detailed system architecture
- **`SECURITY.md`** - Security policies
- **`docs/DOCKER_DEPLOYMENT_TROUBLESHOOTING.md`** - Docker troubleshooting
