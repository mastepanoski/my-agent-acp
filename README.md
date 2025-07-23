# ACP Agent with TypeScript & Bun

[](https://www.typescriptlang.org/)
[](https://bun.sh/)
[](https://nodejs.org/)
[](https://www.docker.com/)
[](https://www.google.com/search?q=%23testing)
[](https://www.google.com/search?q=./LICENSE)

A production-ready **Agent Communication Protocol (ACP)** implementation with dual runtime support (Node.js & Bun), structured logging, comprehensive testing, and Docker deployment.

-----

> **📚 Learn More:**
>
>   - Course Tutorial: [https://learn.deeplearning.ai/courses/acp-agent-communication-protocol/lesson/ldber/acp-core-principles](https://learn.deeplearning.ai/courses/acp-agent-communication-protocol/lesson/ldber/acp-core-principles)
>   - Official ACP Documentation: [https://agentcommunicationprotocol.dev/introduction/welcome](https://agentcommunicationprotocol.dev/introduction/welcome)

-----

## 🚀 Features

  - **Dual Runtime Support**: Run with Node.js or Bun
  - **TypeScript First**: Full type safety and modern development experience
  - **LM Studio Integration**: Seamless AI model integration
  - **Structured Logging**: Production-ready logging with Pino
  - **Comprehensive Testing**: Unit & integration tests with 86 passing tests
  - **Docker Ready**: Multi-stage builds with production optimization
  - **RESTful API**: Complete REST API with health checks and streaming
  - **Hot Reloading**: Development mode with auto-restart
  - **ESLint + Prettier**: Code quality and formatting
  - **Security Hardened**: Helmet, CORS, and security best practices

-----

## 📋 Prerequisites

  - **Node.js 18+** or **Bun 1.2+**
  - **LM Studio** running on `http://localhost:1234`
  - **Docker** (optional, for containerized deployment)

-----

## 🏃‍♂️ Quick Start

### 1\. Installation

```bash
git clone <repository-url>
cd acp-agent
cp .env.example .env
bun install  # or npm install
```

### 2\. Configure LM Studio

#### Start LM Studio Server

Following the [official documentation](https://lmstudio.ai/docs/app/api/tools):

1.  Open LM Studio
2.  Go to "Local Server" tab
3.  Load a model (e.g: Llama 3.2 3B Instruct)
4.  Start local server: `lms server start`
5.  Verify it's running: `curl http://localhost:1234/v1/models`

### 3\. Run the Agent

```bash
# With Bun (recommended)
bun run start:ts

# With Node.js
bun run start

# Development mode with hot reload
bun run dev
```

### 4\. Test the API

```bash
curl http://localhost:3000/api/v1/health
```

-----

## 🛠️ Development

### Available Scripts

```bash
# Development
bun run dev              # Start with hot reload (Bun)
bun run dev:node         # Start with hot reload (Node.js)

# Building
bun run build            # Compile TypeScript
bun run type-check       # Type checking only

# Testing
bun test                 # Unit tests
bun run test:integration # Integration tests (auto-starts server)

# Code Quality
bun run lint             # Run ESLint
bun run lint:fix         # Fix linting issues
bun run format           # Format with Prettier

# Production
bun run start            # Start compiled version (Node.js)
bun run start:ts         # Start TypeScript version (Bun)
```

### Project Structure

```
src/
├── agent/              # Core agent logic
│   ├── agent.ts        # Main agent class
│   ├── capabilities.ts # Agent capabilities
│   └── agent.test.ts   # Agent unit tests
├── server/             # HTTP server
│   ├── server.ts       # Express server setup
│   ├── routes.ts       # API routes
│   └── routes.test.ts  # Server tests
├── utils/              # Utilities
│   ├── llm-client.ts   # LM Studio client
│   ├── logger.ts       # Structured logging
│   └── *.test.ts       # Utility tests
├── types/              # TypeScript definitions
│   ├── acp.ts          # ACP protocol types
│   ├── agent.ts        # Agent types
│   └── llm.ts          # LLM types
├── test/               # Integration tests
│   └── test-agent.ts   # E2E tests
└── index.ts            # Application entry point
```

-----

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ACP_HOST` | Server host | `localhost` |
| `ACP_PORT` | Server port | `3000` |
| `LM_STUDIO_URL` | LM Studio endpoint | `http://localhost:1234/v1` |
| `LM_STUDIO_MODEL` | Model name | `llama-3.2-3b-instruct` |
| `LM_STUDIO_TIMEOUT` | Request timeout (ms) | `30000` |
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Logging level | `debug` (dev), `info` (prod) |

### Agent Configuration

Edit `config/agent-detail.json`:

```json
{
  "name": "PersonalAssistant",
  "version": "1.0.0",
  "description": "An AI agent that can help with general tasks",
  "capabilities": ["text-processing", "question-answering", "task-assistance", "conversation"],
  "metadata": {
    "model": "llama-3.2-3b-instruct",
    "maxTokens": 2048,
    "temperature": 0.7
  }
}
```

-----

## 📚 API Examples

### Health Check

```bash
curl http://localhost:3000/api/v1/health | jq
```

### Agent Information

```bash
curl http://localhost:3000/api/v1/agent | jq
```

### Question Answering

```bash
curl -X POST http://localhost:3000/api/v1/run \
  -H "Content-Type: application/json" \
  -d '{
    "input": "How does photosynthesis work?",
    "type": "question",
    "context": {
      "temperature": 0.3,
      "maxTokens": 1000
    }
  }' | jq
```

### Task Assistance

```bash
curl -X POST http://localhost:3000/api/v1/run \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Help me plan a presentation about AI",
    "type": "task"
  }' | jq
```

### Conversation

```bash
curl -X POST http://localhost:3000/api/v1/run \
  -H "Content-Type: application/json" \
  -d '{
    "type": "conversation",
    "messages": [
      {"role": "user", "content": "Hello, I need help"},
      {"role": "assistant", "content": "Hello! I am here to help you"},
      {"role": "user", "content": "Can you explain what TypeScript is?"}
    ]
  }' | jq
```

-----

## 🧪 Testing

### Unit Tests

```bash
bun test
# 86 tests passing across 6 files
```

### Integration Tests

```bash
bun run test:integration
# Automatically starts server, runs E2E tests, cleans up
```

-----

## 🐳 Docker Deployment

### Quick Start

```bash
docker-compose up -d
```

### Custom Configuration

```bash
# With Bun runtime
RUNTIME=bun docker-compose up -d

# With monitoring
docker-compose --profile monitoring up -d

# Scaling
docker-compose up -d --scale acp-agent=3
```

See [deployment.md](https://www.google.com/search?q=./deployment.md) for detailed deployment instructions.

-----

## 🔍 Monitoring & Observability

### Structured Logs

```json
{
  "level": "info",
  "time": "2024-01-01T12:00:00.000Z",
  "msg": "Agent execution completed",
  "service": "acp-agent",
  "component": "agent",
  "runId": "run-123",
  "duration": 1500,
  "tokens": { "total": 25 }
}
```

### Health Monitoring

  - Health endpoint: `/api/v1/health`
  - Metrics: Memory usage, uptime, LLM status
  - Docker health checks included

-----

## 🤝 Contributing

See [CONTRIBUTING.md](https://www.google.com/search?q=./CONTRIBUTING.md) for detailed contribution guidelines.

### Quick Contribution Steps

1.  Fork the repository
2.  Create a feature branch: `git checkout -b feat/amazing-feature`
3.  Make your changes with tests
4.  Follow [Conventional Commits](https://conventionalcommits.org/)
5.  Run tests: `bun test && bun run test:integration`
6.  Submit a pull request

### Commit Message Format

We use [Conventional Commits](https://conventionalcommits.org/) for clear and structured commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Examples:

  - `feat: add streaming response support`
  - `fix(agent): handle empty input gracefully`
  - `docs: update API documentation`
  - `test: add integration tests for conversation flow`

-----

## 📊 Performance

  - **Cold Start**: \~500ms (Bun), \~800ms (Node.js)
  - **Request Latency**: \~50ms (excluding LLM processing)
  - **Memory Usage**: \~150MB baseline
  - **Concurrent Requests**: 100+ with proper LLM backend

-----

## 🔒 Security

  - **Helmet**: Security headers
  - **CORS**: Configurable cross-origin requests
  - **Input Validation**: Zod schema validation
  - **Rate Limiting**: Built-in support
  - **Docker**: Non-root user, minimal image
  - **Environment**: No secrets in code

-----

## 📄 License

MIT License - see [LICENSE](https://www.google.com/search?q=./LICENSE) for details.

-----

## 🙏 Acknowledgments

  - [LM Studio](https://lmstudio.ai/) for local LLM hosting
  - [Bun](https://bun.sh/) for the amazing JavaScript runtime
  - [Pino](https://getpino.io/) for structured logging
  - [Zod](https://zod.dev/) for runtime type validation

-----

**🚀 Ready to build amazing AI agents? Get started now\!**

For questions, issues, or contributions, please check our [Contributing Guide](https://www.google.com/search?q=./CONTRIBUTING.md) or open an issue.