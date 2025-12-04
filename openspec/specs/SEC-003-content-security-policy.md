# SEC-003: Content Security Policy (CSP)

## Status
**Active** | Created: 2024-12-04

## Summary
Content Security Policy must be enabled in production to prevent XSS attacks. CSP nonce-based script validation is required for inline scripts.

## Requirements

### MUST
- [ ] CSP headers set on all HTML responses
- [ ] Nonce-based validation for inline scripts
- [ ] Strict `script-src` directive (no `unsafe-inline` without nonce)
- [ ] Report-only mode available for testing

### SHOULD
- [ ] Use `strict-dynamic` for trusted script loading
- [ ] Configure CSP reporting endpoint
- [ ] Document any necessary CSP exceptions

### MUST NOT
- [ ] Disable CSP in production
- [ ] Use `unsafe-eval` in production
- [ ] Hardcode nonce values (must be generated per-request)

## Implementation

### Files Affected
- `middleware.ts` - CSP header generation and nonce creation
- `app/layout.tsx` - Nonce propagation to scripts
- `lib/csp-nonce.ts` - Nonce provider context

### CSP Directives
```
default-src 'self';
script-src 'self' 'nonce-{NONCE}' 'strict-dynamic';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' https://api.deepseek.com;
```

### Validation
```bash
# Check CSP header in response
curl -I http://localhost:3000 | grep -i "content-security-policy"
```

## References
- MDN: Content Security Policy
- OWASP CSP Cheat Sheet
- CSP Evaluator (https://csp-evaluator.withgoogle.com/)

