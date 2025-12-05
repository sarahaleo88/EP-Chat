# Dependency Upgrade Strategy

## Overview

This document outlines the strategic approach for managing major version upgrades of dependencies that require significant manual migration effort.

**Last Updated**: 2025-12-04  
**Policy Version**: 1.0.0

## Deferred MAJOR Version Upgrades

The following dependencies have MAJOR version upgrades available but are intentionally deferred due to breaking changes, compatibility concerns, or migration complexity.

### Tailwind CSS 4.x

| Attribute | Value |
|-----------|-------|
| **Current** | 3.4.17 |
| **Available** | 4.1.16 |
| **Type** | MAJOR |
| **Status** | ⏸️ Deferred |

**Reason**: Breaking changes require complete configuration migration and class name updates. Tailwind CSS 4.0 introduces a new configuration format, removes deprecated utilities, and changes default behavior.

**Action**: Wait for Next.js 15 official support and stable ecosystem adoption before upgrading.

**Timeline**: Q2 2025 or when Next.js provides an official migration guide.

**Migration Resources**:
- [Tailwind CSS v4 Migration Guide](https://tailwindcss.com/docs/upgrade-guide)

---

### ESLint 9.x

| Attribute | Value |
|-----------|-------|
| **Current** | 8.57.1 |
| **Available** | 9.38.0 |
| **Type** | MAJOR |
| **Status** | ⏸️ Deferred |

**Reason**: ESLint 9.x introduces the new "flat config" format which is incompatible with the current `eslint-config-next` package. The project uses Next.js's recommended ESLint configuration.

**Action**: Wait for `eslint-config-next` to officially support ESLint 9's flat config format.

**Timeline**: Monitor Next.js releases; estimated Q1-Q2 2025.

**Migration Resources**:
- [ESLint v9 Migration Guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0)
- [Next.js ESLint Configuration](https://nextjs.org/docs/app/building-your-application/configuring/eslint)

---

### Node.js 25 (Docker Base Image)

| Attribute | Value |
|-----------|-------|
| **Current** | 22 (LTS) |
| **Available** | 25 |
| **Type** | MAJOR |
| **Status** | ⏸️ Deferred |

**Reason**: Node.js 25 is a "Current" release, not an LTS (Long Term Support) version. Production deployments should use LTS versions for stability and extended security support.

**Action**: Wait for Node.js 26 LTS release (expected April 2025).

**Timeline**: Q2 2025 after LTS release.

**Node.js Release Schedule**:
- Node.js 22: LTS until April 2027
- Node.js 24: LTS (April 2025)
- Node.js 26: LTS (expected April 2025)

---

### TypeScript 5.9

| Attribute | Value |
|-----------|-------|
| **Current** | 5.8.3 |
| **Available** | 5.9.3 |
| **Type** | MINOR |
| **Status** | 📋 Planned |

**Reason**: Minor version upgrade within the same major version. Low risk but should be tested comprehensively to ensure no regressions.

**Action**: Upgrade in the next development cycle with comprehensive testing.

**Timeline**: Next sprint or development cycle.

**Migration Resources**:
- [TypeScript 5.9 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html)

---

### GitHub Actions Dependencies

#### actions/checkout (v4 → v5)

| Attribute | Value |
|-----------|-------|
| **Current** | v4 |
| **Available** | v5 |
| **Type** | MAJOR |
| **Status** | ⏸️ Deferred |

**Reason**: Requires GitHub Actions Runner v2.327.1 or later.

#### actions/setup-node (v4 → v6)

| Attribute | Value |
|-----------|-------|
| **Current** | v4 |
| **Available** | v6 |
| **Type** | MAJOR ×2 |
| **Status** | ⏸️ Deferred |

**Reason**: Skips v5 entirely (double major version jump). Introduces automatic caching behavior changes.

#### github/codeql-action (v3 → v4)

| Attribute | Value |
|-----------|-------|
| **Current** | v3 |
| **Available** | v4 |
| **Type** | MAJOR |
| **Status** | ⏸️ Deferred |

**Reason**: Requires updated GitHub Actions Runner infrastructure.

**Action for All GitHub Actions**: Verify runner version compatibility before upgrading.

**Timeline**: When runner infrastructure is confirmed compatible (Q1 2025).

---

### Other Dependencies

#### @types/node (v20 → v24)

| Attribute | Value |
|-----------|-------|
| **Current** | ^20.8.0 |
| **Available** | 24.x |
| **Type** | MAJOR |
| **Status** | ⏸️ Deferred |

**Reason**: Should align with Node.js runtime version strategy. Currently using Node.js 22 LTS.

**Timeline**: Upgrade when Node.js runtime is upgraded.

---

#### husky (v8 → v9)

| Attribute | Value |
|-----------|-------|
| **Current** | ^8.0.3 |
| **Available** | 9.x |
| **Type** | MAJOR |
| **Status** | ⏸️ Deferred |

**Reason**: Hook configuration format changes require manual migration of `.husky/` directory structure.

**Timeline**: Next major project refactoring cycle.

---

#### @headlessui/react (v1 → v2)

| Attribute | Value |
|-----------|-------|
| **Current** | ^1.7.17 |
| **Available** | 2.2.x |
| **Type** | MAJOR |
| **Status** | ⏸️ Deferred |

**Reason**: API changes require code refactoring across all component usages.

**Timeline**: Next UI overhaul or major feature release.

---

## Dependabot Configuration

The following ignore rules are configured in `.github/dependabot.yml` to prevent automatic PR creation for these deferred upgrades:

```yaml
ignore:
  # NPM packages
  - dependency-name: "tailwindcss"
    update-types: ["version-update:semver-major"]
  - dependency-name: "eslint"
    update-types: ["version-update:semver-major"]
  - dependency-name: "@types/node"
    update-types: ["version-update:semver-major"]
  - dependency-name: "husky"
    update-types: ["version-update:semver-major"]
  - dependency-name: "@headlessui/react"
    update-types: ["version-update:semver-major"]
  
  # GitHub Actions
  - dependency-name: "actions/checkout"
    update-types: ["version-update:semver-major"]
  - dependency-name: "actions/setup-node"
    update-types: ["version-update:semver-major"]
  - dependency-name: "github/codeql-action"
    update-types: ["version-update:semver-major"]
  
  # Docker
  - dependency-name: "node"
    update-types: ["version-update:semver-major"]
```

## Review Schedule

| Review Period | Action |
|---------------|--------|
| **Monthly** | Check for security advisories affecting deferred dependencies |
| **Quarterly** | Re-evaluate deferral decisions based on ecosystem changes |
| **Semi-annually** | Comprehensive upgrade planning session |

## Decision Matrix

When evaluating whether to defer a major version upgrade:

| Factor | Defer | Proceed |
|--------|-------|---------|
| Breaking API changes | ✓ | |
| Config format changes | ✓ | |
| Ecosystem not ready | ✓ | |
| Security fix only | | ✓ |
| Minor behavior changes | | ✓ |
| Strong migration tooling | | ✓ |

---

**Document Owner**: EP Chat Maintainers
**Next Review**: March 2026

