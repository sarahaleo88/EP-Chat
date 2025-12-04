# GitHub Security Settings Checklist

> **Purpose**: This checklist guides repository administrators through enabling critical GitHub security features that cannot be configured via code.
>
> **Last Updated**: 2025-12-04
> **Assessment Reference**: Comprehensive Security Assessment Report (2025-12-04)

---

## 🔴 CRITICAL: Must Enable Immediately

### 1. Enable Dependabot Alerts

**Current Status**: ❌ DISABLED

**Steps**:
1. Go to **Settings** → **Code security and analysis**
2. Under "Dependabot", click **Enable** for:
   - ✅ Dependabot alerts
   - ✅ Dependabot security updates
3. Optionally enable **Dependabot version updates** for automatic PRs

**Why Critical**: Without Dependabot, vulnerable dependencies go undetected. The project uses npm packages that may have known CVEs.

---

### 2. Enable Vulnerability Alerts

**Current Status**: ❌ DISABLED

**Steps**:
1. Go to **Settings** → **Code security and analysis**
2. Enable **Dependency graph** (required for vulnerability detection)
3. Enable **Dependabot alerts** (if not already done above)

---

### 3. Enable Secret Scanning Push Protection

**Current Status**: ⚠️ Partial (scanning enabled, push protection unclear)

**Steps**:
1. Go to **Settings** → **Code security and analysis**
2. Under "Secret scanning", ensure both are enabled:
   - ✅ Secret scanning
   - ✅ Push protection (blocks commits containing secrets)

**Why Critical**: A DeepSeek API key was previously leaked (Alert #1, now revoked). Push protection prevents future leaks.

---

## 🟡 HIGH PRIORITY: Enable Within 1 Week

### 4. Configure Branch Protection Rules

**Steps**:
1. Go to **Settings** → **Branches**
2. Add rule for `main` branch:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass (select CodeQL, tests)
   - ✅ Require branches to be up to date
   - ✅ Include administrators
   - ✅ Restrict who can push to matching branches

---

### 5. Enable Code Scanning Default Setup

**Current Status**: ✅ CodeQL is active (21 open alerts)

**Verify**:
1. Go to **Settings** → **Code security and analysis**
2. Confirm "Code scanning" shows **CodeQL analysis** as configured
3. Review and address the 6 high-severity alerts

---

### 6. Configure Security Policy

**Steps**:
1. Verify `SECURITY.md` exists in repository root
2. Update it to reference this checklist:
   ```markdown
   For GitHub security settings, see [docs/security/github-settings-checklist.md](docs/security/github-settings-checklist.md)
   ```

---

## 🟢 RECOMMENDED: Long-term Improvements

### 7. Enable Private Vulnerability Reporting

**Steps**:
1. Go to **Settings** → **Code security and analysis**
2. Enable **Private vulnerability reporting**
3. This allows security researchers to report issues privately

---

### 8. Set Up Security Advisories

**Steps**:
1. Go to **Security** tab → **Advisories**
2. Familiarize yourself with creating advisories for any discovered vulnerabilities
3. Use this for coordinated disclosure if needed

---

### 9. Configure CODEOWNERS

**Steps**:
1. Create `.github/CODEOWNERS` file
2. Add security-sensitive paths:
   ```
   # Security-sensitive files require security team review
   /lib/csrf.ts @security-team
   /lib/session-manager.ts @security-team
   /app/api/auth/ @security-team
   SECURITY.md @security-team
   ```

---

## Verification Checklist

After completing the above, verify:

| Setting | Expected Status |
|---------|-----------------|
| Dependabot alerts | ✅ Enabled |
| Dependabot security updates | ✅ Enabled |
| Dependency graph | ✅ Enabled |
| Secret scanning | ✅ Enabled |
| Push protection | ✅ Enabled |
| CodeQL analysis | ✅ Enabled |
| Branch protection (main) | ✅ Configured |
| Private vulnerability reporting | ✅ Enabled |

---

## Post-Configuration Actions

1. **Run Dependabot scan**: After enabling, Dependabot will automatically scan and create alerts
2. **Review CodeQL alerts**: Address the 6 high-severity issues identified in the assessment
3. **Rotate any exposed secrets**: Ensure all previously leaked credentials are revoked
4. **Schedule quarterly review**: Set calendar reminder for Q1 2026 security review

---

## Related Documents

- [Secret Rotation Policy](./secret-rotation-policy.md)
- [CI Security Checks](./ci-security-checks.md)
- [Dependency Review Q4 2025](./dependency-review-2025Q4.md)
- [SECURITY.md](../../SECURITY.md)

