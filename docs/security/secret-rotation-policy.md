# Secret Rotation Policy

> **Purpose**: Define procedures for rotating secrets and credentials.
>
> **Last Updated**: 2025-12-04
> **Policy Version**: 1.0

---

## Overview

This policy defines how secrets and credentials should be managed, rotated, and revoked in the EP-Chat project.

---

## Secret Inventory

| Secret Type | Location | Rotation Frequency | Owner |
|-------------|----------|-------------------|-------|
| `DEEPSEEK_API_KEY` | Environment variable | 90 days or on compromise | Developer |
| `SESSION_ENCRYPTION_KEY` | Environment variable | 180 days | DevOps |
| GitHub Personal Access Tokens | GitHub Settings | 90 days | Developer |
| Deployment SSH Keys | CI/CD | 365 days | DevOps |

---

## Rotation Procedures

### 1. DeepSeek API Key

**Frequency**: Every 90 days or immediately on suspected compromise

**Steps**:
1. Log into [DeepSeek Platform](https://platform.deepseek.com/api_keys)
2. Generate new API key
3. Update environment variables:
   - Local: `.env.local`
   - Production: Deployment platform secrets
   - CI/CD: GitHub Secrets
4. Verify application works with new key
5. Revoke old API key
6. Document rotation in security log

**Emergency Rotation** (on compromise):
1. Immediately revoke compromised key in DeepSeek dashboard
2. Generate new key
3. Update all environments within 1 hour
4. Review access logs for unauthorized usage
5. File incident report

### 2. Session Encryption Key

**Frequency**: Every 180 days

**Steps**:
1. Generate new 256-bit key:
   ```bash
   openssl rand -base64 32
   ```
2. Update `SESSION_ENCRYPTION_KEY` in all environments
3. Note: Existing sessions will be invalidated (users must re-enter API key)
4. Deploy during low-traffic period
5. Monitor for session-related errors

### 3. GitHub Tokens

**Frequency**: Every 90 days

**Steps**:
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with minimum required scopes
3. Update CI/CD secrets
4. Revoke old token
5. Verify CI/CD pipelines work

---

## Compromise Response

### Immediate Actions (within 1 hour)

1. **Revoke** the compromised secret immediately
2. **Generate** new secret
3. **Deploy** to all environments
4. **Notify** team members

### Investigation (within 24 hours)

1. Review access logs
2. Identify scope of exposure
3. Check for unauthorized usage
4. Document timeline of events

### Post-Incident (within 1 week)

1. Complete incident report
2. Update security procedures if needed
3. Implement additional controls
4. Schedule security review

---

## Secret Storage Best Practices

### DO ✅

- Use environment variables for secrets
- Use GitHub Secrets for CI/CD
- Use `.env.local` for local development (gitignored)
- Encrypt secrets at rest
- Use least-privilege access

### DON'T ❌

- Commit secrets to version control
- Share secrets via email/chat
- Use the same secret across environments
- Store secrets in code comments
- Log secrets in application logs

---

## Audit Trail

Maintain a log of all secret rotations:

| Date | Secret Type | Reason | Performed By | Verified By |
|------|-------------|--------|--------------|-------------|
| 2025-12-04 | DEEPSEEK_API_KEY | Initial policy | - | - |

---

## Monitoring

### Alerts to Configure

1. **Secret Scanning Alerts** - GitHub will alert on committed secrets
2. **API Usage Anomalies** - Monitor DeepSeek dashboard for unusual usage
3. **Failed Authentication** - Monitor application logs for auth failures

### Review Schedule

- **Weekly**: Check GitHub secret scanning alerts
- **Monthly**: Review API usage patterns
- **Quarterly**: Full secret inventory audit

---

## Related Documents

- [GitHub Settings Checklist](./github-settings-checklist.md)
- [CI Security Checks](./ci-security-checks.md)
- [SECURITY.md](../../SECURITY.md)

