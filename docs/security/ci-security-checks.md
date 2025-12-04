# CI Security Checks

> **Purpose**: Define security checks to integrate into CI/CD pipelines.
>
> **Last Updated**: 2025-12-04

---

## Overview

This document outlines recommended security checks for the CI/CD pipeline. These checks should run on every pull request and merge to main.

---

## Recommended GitHub Actions Workflow

Create `.github/workflows/security.yml`:

```yaml
name: Security Checks

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    # Run weekly on Sundays at midnight
    - cron: '0 0 * * 0'

jobs:
  dependency-audit:
    name: Dependency Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run npm audit
        run: npm audit --audit-level=high
        continue-on-error: true
      
      - name: Check for outdated packages
        run: npm outdated || true

  codeql-analysis:
    name: CodeQL Analysis
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4
      
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript-typescript
      
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3

  secret-scanning:
    name: Secret Scanning
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  type-check:
    name: TypeScript Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type check
        run: npm run type-check

  lint:
    name: ESLint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
```

---

## Security Check Summary

| Check | Tool | Frequency | Blocking |
|-------|------|-----------|----------|
| Dependency Audit | npm audit | Every PR | High severity |
| Static Analysis | CodeQL | Every PR | Yes |
| Secret Scanning | Gitleaks | Every PR | Yes |
| Type Checking | TypeScript | Every PR | Yes |
| Linting | ESLint | Every PR | Yes |
| Unit Tests | Vitest | Every PR | Yes |

---

## Branch Protection Rules

Configure these rules for the `main` branch:

1. ✅ Require pull request reviews
2. ✅ Require status checks to pass:
   - `dependency-audit`
   - `codeql-analysis`
   - `secret-scanning`
   - `type-check`
   - `lint`
   - `test`
3. ✅ Require branches to be up to date
4. ✅ Include administrators

---

## Related Documents

- [GitHub Settings Checklist](./github-settings-checklist.md)
- [Secret Rotation Policy](./secret-rotation-policy.md)
- [Dependency Review Q4 2025](./dependency-review-2025Q4.md)

