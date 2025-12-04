# SEC-002: Brand Asset Compliance

## Status
**Active** | Created: 2024-12-04

## Summary
Third-party brand assets (logos, icons, trademarks) must not be used without explicit licensing. This protects against trademark infringement claims.

## Requirements

### MUST
- [ ] Remove all unlicensed third-party brand assets
- [ ] Document licensing status for any retained brand assets
- [ ] Use generic/abstract icons when brand-specific icons are not licensed

### SHOULD
- [ ] Prefer open-source icon libraries (Heroicons, Lucide, etc.)
- [ ] Create custom icons for project-specific needs
- [ ] Maintain an asset inventory with licensing information

### MUST NOT
- [ ] Use ChatGPT, OpenAI, or other AI company logos without license
- [ ] Imply official partnership or endorsement without authorization
- [ ] Use brand colors that could cause confusion with other products

## Implementation

### Prohibited Assets (Removed)
- `app/icons/chatgpt.svg` - ChatGPT trademark
- `app/icons/chatgpt.png` - ChatGPT trademark
- `app/icons/llm-icons/openai.svg` - OpenAI trademark

### Approved Assets
- `app/icons/llm-icons/deepseek.svg` - DeepSeek (primary integration partner)
- `app/icons/llm-icons/default.svg` - Generic AI icon (custom)
- `public/shamrock-icon.svg` - EP-Chat brand icon (owned)

### Validation
```bash
# Check for potentially problematic brand references
grep -ri "chatgpt\|openai\|anthropic\|google" --include="*.svg" --include="*.png" app/ public/
```

## References
- Trademark Fair Use Guidelines
- Open Source License Compatibility

