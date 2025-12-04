# SEC-001: API Key Security

## Status
**Active** | Created: 2024-12-04

## Summary
API keys must never be hardcoded in source code. All secrets must be loaded from environment variables or secure secret management systems.

## Requirements

### MUST
- [ ] API keys loaded from environment variables only
- [ ] No hardcoded keys in source code (including test files)
- [ ] Production builds fail if required secrets are missing
- [ ] Development mode provides clear instructions when keys are missing

### SHOULD
- [ ] Use `.env.example` to document required variables
- [ ] Validate API key format before use
- [ ] Log warnings (not errors) in development for missing optional keys

### MUST NOT
- [ ] Commit `.env` files to version control
- [ ] Include API keys in error messages or logs
- [ ] Store API keys in client-side accessible locations (localStorage, cookies without httpOnly)

## Implementation

### Files Affected
- `lib/session-manager.ts` - Session encryption key handling
- `lib/deepseek.ts` - DeepSeek API key validation
- `.env.example` - Environment variable documentation

### Validation
```bash
# Check for hardcoded keys
grep -r "sk-" --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v ".env"
```

## References
- OWASP API Security Top 10
- CWE-798: Use of Hard-coded Credentials

