# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MySmartTranslate (MST)** is a personal lightweight intelligent translation assistant based on DeepSeek API. It's a full-stack web application that provides document translation capabilities with support for multiple file formats (Word, PDF, Excel, Markdown, TXT, HTML), GitHub link parsing, and web content extraction.

**Key Features:**
- Document upload and translation with format preservation
- GitHub repository file parsing and translation 
- Web page content extraction and translation
- Three translation view modes: full document, paragraph-by-paragraph, sentence-by-sentence
- Translation history, vocabulary management, and favorites
- User authentication and settings management
- Responsive beige-themed UI built with React

## Architecture Overview

This is a **hybrid architecture** with two backend implementations:
- **Primary Backend**: Node.js Express server (`simple-backend.js`) - Enhanced, production-ready
- **Secondary Backend**: FastAPI Python server (`backend/`) - Original implementation, full-featured

**Tech Stack:**
- **Frontend**: React 18 + Styled Components + Zustand (state management) + React Router
- **Primary Backend**: Node.js + Express + SQLite + Redis caching
- **Secondary Backend**: FastAPI + SQLAlchemy + SQLite + Redis
- **External APIs**: DeepSeek API for translation
- **Infrastructure**: Docker + Nginx + GitHub Actions CI/CD

## Development Environment

### Quick Start (Recommended)
```bash
# Set API key (optional - will use mock data if not set)
export DEEPSEEK_API_KEY=your_api_key_here

# One-command start
./start-dev.sh
```

### Manual Development Setup
```bash
# Install frontend dependencies
cd frontend && npm install

# Start backend (Node.js - primary)
node simple-backend.js

# Start frontend (new terminal)
cd frontend && npm start

# Access points:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Health check: http://localhost:8000/api/health
```

## Build and Deploy Commands

### Frontend Commands
```bash
cd frontend

# Development
npm start                    # Start dev server
npm test                     # Run tests
npm run test:coverage        # Run tests with coverage
npm run build                # Production build
npm run build:analyze        # Build with bundle analysis

# Code Quality
npm run lint                 # ESLint check
npm run lint:fix             # Auto-fix linting issues
npm run format               # Prettier formatting
npm run optimize             # Lint + format + build
```

### Testing and Debugging

### API Testing Commands
```bash
# Health check
curl http://localhost:8000/api/health

# Translation test
curl -X POST http://localhost:8000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "targetLang": "zh", "mode": "standard"}'

# GitHub link parsing
curl -X POST http://localhost:8000/api/parse-link \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com/user/repo/blob/main/README.md"}'

# File upload test
curl -X POST http://localhost:8000/api/upload \
  -F "file=@test.txt"

# User authentication test
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test123", "email": "test@example.com"}'
```

## Important Notes

- **Primary Development**: Use `simple-backend.js` (Node.js) unless specifically working on FastAPI features
- **Translation Mode**: Set `DEEPSEEK_API_KEY` for real translation, otherwise uses mock data
- **File Uploads**: Stored in `uploads/` directory with size limits
- **Database**: SQLite files stored in `data/` directory
- **Caching**: Redis optional in development, recommended for production
- **API Documentation**: Available at `http://localhost:8000/docs` when using FastAPI backend
- **Security**: Input validation, file type restrictions, and rate limiting implemented
- **Performance**: Caching, batch processing, and lazy loading optimizations included

# CCPM - Claude Code Project Management

This project uses the Claude Code Project Management system for structured development workflow.

## USE SUB-AGENTS FOR CONTEXT OPTIMIZATION

### 1. Always use the file-analyzer sub-agent when asked to read files.
The file-analyzer agent is an expert in extracting and summarizing critical information from files, particularly log files and verbose outputs. It provides concise, actionable summaries that preserve essential information while dramatically reducing context usage.

### 2. Always use the code-analyzer sub-agent when asked to search code, analyze code, research bugs, or trace logic flow.

The code-analyzer agent is an expert in code analysis, logic tracing, and vulnerability detection. It provides concise, actionable summaries that preserve essential information while dramatically reducing context usage.

### 3. Always use the test-runner sub-agent to run tests and analyze the test results.

Using the test-runner agent ensures:

- Full test output is captured for debugging
- Main conversation stays clean and focused
- Context usage is optimized
- All issues are properly surfaced
- No approval dialogs interrupt the workflow

## Philosophy

### Error Handling

- **Fail fast** for critical configuration (missing text model)
- **Log and continue** for optional features (extraction model)
- **Graceful degradation** when external services unavailable
- **User-friendly messages** through resilience layer

### Testing

- Always use the test-runner agent to execute tests.
- Do not use mock services for anything ever.
- Do not move on to the next test until the current test is complete.
- If the test fails, consider checking if the test is structured correctly before deciding we need to refactor the codebase.
- Tests to be verbose so we can use them for debugging.

## Tone and Behavior

- Criticism is welcome. Please tell me when I am wrong or mistaken, or even when you think I might be wrong or mistaken.
- Please tell me if there is a better approach than the one I am taking.
- Please tell me if there is a relevant standard or convention that I appear to be unaware of.
- Be skeptical.
- Be concise.
- Short summaries are OK, but don't give an extended breakdown unless we are working through the details of a plan.
- Do not flatter, and do not give compliments unless I am specifically asking for your judgement.
- Occasional pleasantries are fine.
- Feel free to ask many questions. If you are in doubt of my intent, don't guess. Ask.

## ABSOLUTE RULES:

- NO PARTIAL IMPLEMENTATION
- NO SIMPLIFICATION : no "//This is simplified stuff for now, complete implementation would blablabla"
- NO CODE DUPLICATION : check existing codebase to reuse functions and constants Read files before writing new functions. Use common sense function name to find them easily.
- NO DEAD CODE : either use or delete from codebase completely
- IMPLEMENT TEST FOR EVERY FUNCTIONS
- NO CHEATER TESTS : test must be accurate, reflect real usage and be designed to reveal flaws. No useless tests! Design tests to be verbose so we can use them for debuging.
- NO INCONSISTENT NAMING - read existing codebase naming patterns.
- NO OVER-ENGINEERING - Don't add unnecessary abstractions, factory patterns, or middleware when simple functions would work. Don't think "enterprise" when you need "working"
- NO MIXED CONCERNS - Don't put validation logic inside API handlers, database queries inside UI components, etc. instead of proper separation
- NO RESOURCE LEAKS - Don't forget to close database connections, clear timeouts, remove event listeners, or clean up file handles

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.