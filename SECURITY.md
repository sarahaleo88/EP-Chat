# Security Policy

## Supported Versions

We actively support the following versions of EP Chat:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | ✅ Yes             |
| < 1.0   | ❌ No              |

## Reporting Vulnerabilities

We take security vulnerabilities seriously. If you discover a security vulnerability in EP Chat, please report it responsibly.

### How to Report

1. **Email**: Send details to the project maintainers via GitHub issues (marked as security-related)
2. **GitHub**: For non-critical issues, you can create a private security advisory
3. **Response Time**: We aim to respond within 48 hours

### What to Include

Please include the following information in your report:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Suggested fix (if available)
- Your contact information

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: 7-14 days for critical issues, 30 days for moderate issues

## Security Best Practices

### For Users

1. **API Keys**: Never commit API keys to version control
2. **Environment Variables**: Use `.env.local` for sensitive configuration
3. **Updates**: Keep dependencies updated regularly
4. **HTTPS**: Always use HTTPS in production deployments

### For Developers

1. **Input Validation**: Validate all user inputs
2. **Sanitization**: Sanitize data before processing
3. **Authentication**: Implement proper authentication mechanisms
4. **Logging**: Log security events appropriately (without sensitive data)

## Known Security Considerations

### API Key Management

- API keys are stored in browser localStorage
- Keys are not transmitted to our servers
- Consider using environment variables for server-side deployments

### Data Privacy

- Chat conversations are not stored permanently
- API requests go directly to DeepSeek servers
- No user data is collected or stored by EP Chat

### Dependencies

- Regular security audits of npm dependencies
- Automated vulnerability scanning in CI/CD
- Prompt updates for critical security patches

## Disclosure Policy

We follow responsible disclosure practices:

1. We will acknowledge receipt of your report
2. We will investigate and validate the issue
3. We will develop and test a fix
4. We will coordinate the release of the fix
5. We will publicly acknowledge your contribution (if desired)

## Contact

For security-related questions or concerns:

- Security Email: [security@your-domain.com]
- General Issues: [GitHub Issues](https://github.com/your-username/ep-enhanced-prompt/issues)
- Maintainer: [@your-username](https://github.com/your-username)

---

**Note**: Please replace placeholder email addresses and usernames with actual contact information before publication.
