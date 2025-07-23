# Contributing to ACP Agent

Thank you for your interest in contributing to the ACP Agent project! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)
- [Community](#community)

## 🤝 Code of Conduct

This project follows a Code of Conduct to ensure a welcoming environment for all contributors. Please:

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences
- Show empathy towards other community members

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** or **Bun 1.2+**
- **Git** for version control
- **LM Studio** for testing (running on http://localhost:1234)
- **Docker** (optional, for container testing)

### Development Tools

We use modern development tools to maintain code quality:

- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Bun Test** for unit testing
- **Conventional Commits** for commit messages

## 🛠️ Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/acp-agent.git
cd acp-agent

# Add the original repository as upstream
git remote add upstream https://github.com/ORIGINAL_OWNER/acp-agent.git
```

### 2. Install Dependencies

```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Ensure LM Studio is running on http://localhost:1234
```

### 4. Verify Setup

```bash
# Run tests to ensure everything works
bun test

# Start development server
bun run dev

# Test API endpoints
curl http://localhost:3000/api/v1/health
```

## 🔧 Making Changes

### Branch Naming

Create feature branches from `main` using descriptive names:

```bash
git checkout -b feat/add-websocket-support
git checkout -b fix/memory-leak-agent
git checkout -b docs/update-api-reference
git checkout -b test/integration-conversation
```

### Coding Standards

#### TypeScript Guidelines

- Use strict TypeScript configuration
- Prefer `interface` over `type` for object shapes
- Use proper JSDoc comments for public APIs
- Implement proper error handling with custom error types

```typescript
/**
 * Processes a user request through the ACP agent
 * @param request - The ACP request to process
 * @returns Promise resolving to the agent response
 * @throws {ValidationError} When request validation fails
 */
async function processRequest(request: ACPRequest): Promise<ACPResponse> {
  // Implementation
}
```

#### Code Organization

- Keep files focused and single-purpose
- Use barrel exports (`index.ts`) for clean imports
- Place types in dedicated `types/` directory
- Follow the established project structure

#### Performance Guidelines

- Use async/await for asynchronous operations
- Implement proper error boundaries
- Avoid blocking the event loop
- Use streaming for large responses when possible

### File Changes

#### Adding New Features

1. **Create types first** in `src/types/`
2. **Implement core logic** in appropriate directory
3. **Add comprehensive tests** (unit + integration)
4. **Update documentation** and examples
5. **Add to API reference** if applicable

#### Bug Fixes

1. **Write a failing test** that reproduces the bug
2. **Implement the fix** with minimal changes
3. **Ensure all tests pass**
4. **Update documentation** if behavior changes

## 📝 Commit Guidelines

We use [Conventional Commits](https://conventionalcommits.org/) for clear and structured commit messages.

### Commit Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

- **feat**: New feature for users
- **fix**: Bug fix for users
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring without feature changes
- **test**: Adding or updating tests
- **perf**: Performance improvements
- **ci**: CI/CD configuration changes
- **build**: Build system or dependency changes
- **chore**: Maintenance tasks

### Commit Examples

```bash
# New features
git commit -m "feat: add WebSocket support for real-time communication"
git commit -m "feat(agent): implement conversation memory persistence"

# Bug fixes
git commit -m "fix: handle empty input in agent execution"
git commit -m "fix(server): resolve memory leak in request processing"

# Documentation
git commit -m "docs: update API examples with new endpoints"
git commit -m "docs(readme): add Docker deployment instructions"

# Tests
git commit -m "test: add integration tests for streaming responses"
git commit -m "test(agent): cover edge cases in conversation flow"
```

### Breaking Changes

For breaking changes, use `!` after the type/scope:

```bash
git commit -m "feat!: change agent response format to include metadata"
```

## 🧪 Testing

### Running Tests

```bash
# Unit tests only
bun test

# Integration tests (requires LM Studio)
bun run test:integration

# All tests
bun test && bun run test:integration

# Watch mode for development
bun test --watch
```

### Writing Tests

#### Unit Tests

- Test individual functions and classes
- Mock external dependencies
- Focus on edge cases and error conditions
- Use descriptive test names

```typescript
describe('AgentCapabilities', () => {
  it('should handle empty input gracefully', async () => {
    const capabilities = new AgentCapabilities(mockClient);
    const result = await capabilities.processText('');
    expect(result.success).toBe(false);
  });
});
```

#### Integration Tests

- Test complete workflows
- Use real HTTP requests
- Test error scenarios
- Verify actual API responses

```typescript
describe('Agent API', () => {
  it('should process question requests end-to-end', async () => {
    const response = await request(app)
      .post('/api/v1/run')
      .send({ input: 'Test question', type: 'question' })
      .expect(200);
      
    expect(response.body.status).toBe('completed');
  });
});
```

### Test Coverage

- Aim for >90% code coverage
- Cover all critical paths
- Test error conditions
- Include performance tests for critical functions

## 🔄 Pull Request Process

### Before Submitting

1. **Sync with upstream**:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Run full test suite**:
   ```bash
   bun run lint
   bun test
   bun run test:integration
   bun run build
   ```

3. **Update documentation** if needed

### PR Requirements

- **Clear title** following conventional commit format
- **Detailed description** explaining changes and motivation
- **Tests included** for new features and bug fixes
- **Documentation updated** for user-facing changes
- **No breaking changes** without major version bump
- **All CI checks passing**

### PR Template

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings introduced
```

### Review Process

1. **Automated checks** must pass
2. **At least one review** from maintainers
3. **No unresolved conversations**
4. **Up-to-date with main branch**

## 🚢 Release Process

### Versioning

We follow [Semantic Versioning (SemVer)](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backwards compatible
- **PATCH** (0.0.1): Bug fixes, backwards compatible

### Release Steps

1. **Update CHANGELOG.md** with new version
2. **Update package.json version**
3. **Create release commit**: `chore: release v1.2.3`
4. **Create git tag**: `git tag v1.2.3`
5. **Push changes**: `git push origin main --tags`
6. **Create GitHub release** with release notes

## 🌟 Recognition

Contributors are recognized in:

- **CHANGELOG.md** for each release
- **README.md** contributors section
- **GitHub releases** acknowledgments

## 📞 Community

### Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Documentation**: Check existing docs first

### Communication Guidelines

- **Be patient**: Maintainers are volunteers
- **Be specific**: Provide clear reproduction steps
- **Be helpful**: Help others when you can
- **Stay on topic**: Keep discussions focused

### Resources

- **ACP Specification**: https://agentcommunicationprotocol.dev/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Bun Documentation**: https://bun.sh/docs
- **Conventional Commits**: https://conventionalcommits.org/

---

## 🙏 Thank You

Your contributions make this project better for everyone. Whether you're fixing bugs, adding features, improving documentation, or helping other users, every contribution is valuable and appreciated!

**Happy coding! 🚀**