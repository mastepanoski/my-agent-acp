# ACP-Compliant Agent with TypeScript & Bun

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=flat&logo=bun&logoColor=white)](https://bun.sh/)
[![Node.js](https://img.shields.io/badge/Node.js-6DA55F?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![ACP](https://img.shields.io/badge/ACP-Compliant-green?style=flat)](https://agentcommunicationprotocol.dev)

A **100% ACP-compliant** Agent Communication Protocol implementation built with TypeScript, featuring dual runtime support (Node.js & Bun), structured logging, comprehensive testing, and production-ready deployment.

-----

> **📚 Learn More:**
>
>   - Course Tutorial: [https://learn.deeplearning.ai/courses/acp-agent-communication-protocol/lesson/ldber/acp-core-principles](https://learn.deeplearning.ai/courses/acp-agent-communication-protocol/lesson/ldber/acp-core-principles)
>   - Official ACP Documentation: [https://agentcommunicationprotocol.dev/introduction/welcome](https://agentcommunicationprotocol.dev/introduction/welcome)

-----

## 🚀 Features

### ACP Protocol Compliance
  - **✅ 100% ACP Compliant**: Fully implements the [Agent Communication Protocol](https://agentcommunicationprotocol.dev) specification
  - **🔗 Standard Endpoints**: `/ping`, `/agents`, `/runs`, `/sessions` - all ACP endpoints implemented
  - **📨 Message Format**: Proper `Message`/`MessagePart` structure with content types and encoding
  - **🔄 Run Lifecycle**: Complete run management with UUID-based IDs and standard status values
  - **📡 Event System**: Real-time event streaming for run lifecycle tracking
  - **🗂️ Session Management**: Multi-user session support with proper isolation

### Development Experience
  - **🏃 Dual Runtime Support**: Run with Node.js or Bun
  - **📘 TypeScript First**: Full type safety with ACP SDK types
  - **🔧 LM Studio Integration**: Seamless local AI model integration
  - **📊 Structured Logging**: Production-ready logging with Pino
  - **🧪 Comprehensive Testing**: ACP compliance tests + integration tests
  - **🐳 Docker Ready**: Multi-stage builds with production optimization
  - **🔄 Hot Reloading**: Development mode with auto-restart
  - **✨ Code Quality**: ESLint + Prettier with strict rules
  - **🔒 Security Hardened**: Helmet, CORS, and security best practices

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

### 4\. Test the ACP Endpoints

```bash
# ACP Ping
curl http://localhost:3000/ping

# Agent Discovery
curl http://localhost:3000/agents

# Agent Manifest
curl http://localhost:3000/agents/asistentepersonal
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
│   ├── acp.ts          # ACP SDK type re-exports
│   ├── agent.ts        # Legacy agent types
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

## 📚 ACP API Examples

### Ping (Health Check)

```bash
curl http://localhost:3000/ping | jq
```

### Agent Discovery

```bash
curl http://localhost:3000/agents | jq
```

### Agent Manifest

```bash
curl http://localhost:3000/agents/asistentepersonal | jq
```

### Create and Execute Run (Sync)

```bash
curl -X POST http://localhost:3000/runs \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "asistentepersonal",
    "input": [
      {
        "role": "user",
        "parts": [
          {
            "content_type": "text/plain",
            "content": "How does photosynthesis work?",
            "content_encoding": "plain",
            "metadata": null
          }
        ],
        "created_at": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
        "completed_at": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"
      }
    ],
    "mode": "sync"
  }' | jq
```

### Create Run (Async)

```bash
curl -X POST http://localhost:3000/runs \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "asistentepersonal",
    "input": [
      {
        "role": "user",
        "parts": [
          {
            "content_type": "text/plain",
            "content": "Help me plan a presentation about AI",
            "content_encoding": "plain",
            "metadata": null
          }
        ],
        "created_at": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
        "completed_at": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"
      }
    ],
    "mode": "async"
  }' | jq
```

### Get Run Status

```bash
# Replace RUN_ID with actual run ID from previous response
curl http://localhost:3000/runs/RUN_ID | jq
```

### Get Run Events

```bash
# Replace RUN_ID with actual run ID
curl http://localhost:3000/runs/RUN_ID/events | jq
```

### Cancel Run

```bash
# Replace RUN_ID with actual run ID
curl -X POST http://localhost:3000/runs/RUN_ID/cancel | jq
```

### Using ACP SDK Client

For easier integration, use the official ACP SDK:

```typescript
import { Client } from 'acp-sdk';

const client = new Client({ baseUrl: "http://localhost:3000" });
const run = await client.runSync("asistentepersonal", "Hello!");
run.output.forEach((message) => console.log(message));
```

-----

## 🧪 Testing

### ACP Compliance Tests

```bash
bun scripts/test-acp-compliance.js
# Tests all ACP endpoints with mock LLM
```

### Integration Tests

```bash
bun run test:integration
# Automatically tests with real LM Studio or mock LLM
```

### Unit Tests

```bash
bun test
# Run all unit tests
```

### Test Coverage

- ✅ **ACP Protocol Compliance**: All required endpoints tested
- ✅ **Message Format Validation**: Proper `Message`/`MessagePart` structure
- ✅ **Run Lifecycle**: Creation, execution, status, cancellation
- ✅ **Session Management**: Multi-user session isolation
- ✅ **Event System**: Real-time event emission and retrieval
- ✅ **Error Handling**: Proper ACP error response format

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

### ACP Monitoring

  - **Ping endpoint**: `/ping` - Standard ACP health check
  - **Agent Discovery**: `/agents` - List available agents
  - **Run Tracking**: Complete run lifecycle monitoring
  - **Event Streaming**: Real-time run status updates
  - **Session Management**: Multi-user session tracking
  - **Docker health checks**: ACP-compliant health monitoring

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

## 🔄 Migration to ACP

This project has been **fully migrated** from a custom agent API to a **100% ACP-compliant implementation**. See [ACP-COMPLIANCE-REPORT.md](./ACP-COMPLIANCE-REPORT.md) for detailed migration information.

### What Changed
- ✅ **Endpoints**: Migrated from `/api/v1/*` to standard ACP endpoints
- ✅ **Message Format**: Implemented proper `Message`/`MessagePart` structure
- ✅ **Run Management**: UUID-based runs with standard ACP status values
- ✅ **Types**: Replaced custom types with official ACP SDK types
- ✅ **Session Support**: Added multi-user session management
- ✅ **Event System**: Real-time run lifecycle event streaming

### Backward Compatibility
The legacy API endpoints have been replaced. Update your clients to use:
- **ACP SDK**: `npm install acp-sdk` (recommended)
- **Direct HTTP**: Use the new ACP endpoints documented above

-----

**🚀 Ready to build ACP-compliant AI agents? Get started now!**

For questions, issues, or contributions, please check our [Contributing Guide](https://www.google.com/search?q=./CONTRIBUTING.md) or open an issue.