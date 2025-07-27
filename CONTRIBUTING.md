# Contributing to EP - Enhanced Prompt

🍀 Thank you for your interest in contributing to EP! We welcome contributions from the community.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## 🤝 Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone <your-fork-url>
   cd ep-enhanced-prompt
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream <original-repository-url>
   ```

## 🛠 Development Setup

### Prerequisites

- Node.js 18.0 or higher
- npm 8.0 or higher
- DeepSeek API key for testing

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.minimal.example .env

# Add your DeepSeek API key to .env
# DEEPSEEK_API_KEY=your_api_key_here

# Start development server
npm run dev
```

### Project Structure

```
ep/
├── app/                 # Next.js App Router
├── lib/                 # Core libraries and utilities
├── templates/           # JSON template library
├── tests/              # Test files
├── public/             # Static assets
└── scripts/            # Build and utility scripts
```

## 🔄 Making Changes

### Before You Start

1. **Check existing issues** to see if your idea is already being discussed
2. **Create an issue** for new features or significant changes
3. **Get feedback** from maintainers before starting work

### Development Workflow

1. **Create a feature branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Test your changes**:

   ```bash
   npm test
   npm run type-check
   npm run lint
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

### Commit Message Format

We follow conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions or modifications
- `chore:` - Build process or auxiliary tool changes

## 📤 Submitting Changes

1. **Push to your fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request** with:
   - Clear title and description
   - Reference to related issues
   - Screenshots for UI changes
   - Test results

3. **Respond to feedback** and make requested changes

## 📏 Coding Standards

### TypeScript

- Use strict TypeScript configuration
- Provide proper type definitions
- Avoid `any` types when possible

### React/Next.js

- Use functional components with hooks
- Follow React best practices
- Use Next.js App Router patterns

### Styling

- Use Tailwind CSS for styling
- Follow the shamrock theme color scheme
- Ensure mobile responsiveness

### Code Quality

- Write self-documenting code
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Use meaningful variable names

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

### Writing Tests

- Write tests for new features
- Update tests for modified functionality
- Aim for good test coverage
- Use descriptive test names

### Test Types

- **Unit tests**: Test individual functions/components
- **Integration tests**: Test component interactions
- **E2E tests**: Test complete user workflows

## 📚 Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Document complex algorithms
- Explain non-obvious code decisions

### User Documentation

- Update README.md for new features
- Add examples for new functionality
- Keep installation instructions current

### API Documentation

- Document API endpoints
- Provide request/response examples
- Document error conditions

## 🎯 Areas for Contribution

### High Priority

- Bug fixes and stability improvements
- Performance optimizations
- Accessibility improvements
- Mobile experience enhancements

### Medium Priority

- New template additions
- UI/UX improvements
- Documentation improvements
- Test coverage expansion

### Low Priority

- Code refactoring
- Developer experience improvements
- Build process optimizations

## 🔍 Review Process

### What We Look For

- **Functionality**: Does it work as intended?
- **Code Quality**: Is it well-written and maintainable?
- **Testing**: Are there adequate tests?
- **Documentation**: Is it properly documented?
- **Performance**: Does it maintain good performance?
- **Security**: Are there any security concerns?

### Review Timeline

- Initial response: Within 48 hours
- Full review: Within 1 week
- Follow-up reviews: Within 2-3 days

## 🆘 Getting Help

### Communication Channels

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Pull Request Comments**: For code-specific questions

### Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🙏 Recognition

Contributors will be recognized in:

- GitHub contributors list
- Release notes for significant contributions
- Project documentation

Thank you for contributing to EP! 🍀
