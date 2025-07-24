# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2025-01-24

### 🔄 BREAKING CHANGES - ACP Protocol Migration

This release represents a **complete migration** from custom agent API to **100% ACP (Agent Communication Protocol) compliance**.

#### ⚠️ Breaking Changes
- **API Endpoints**: All `/api/v1/*` endpoints replaced with ACP standard endpoints
- **Request/Response Format**: Custom schemas replaced with ACP `Message`/`MessagePart` structure
- **Run Management**: Custom run IDs replaced with UUID-based ACP runs
- **Agent Manifest**: Custom agent details replaced with ACP `AgentManifest`

#### ✅ Added - ACP Protocol Implementation
- **ACP SDK Integration**: Added `acp-sdk@1.0.0` with official types and utilities
- **Standard ACP Endpoints**: 
  - `GET /ping` - Health check endpoint
  - `GET /agents` - Agent discovery with pagination
  - `GET /agents/{name}` - Agent manifest retrieval
  - `POST /runs` - Create and execute runs (sync/async/stream modes)
  - `GET /runs/{run_id}` - Get run status and output
  - `POST /runs/{run_id}` - Resume paused runs
  - `POST /runs/{run_id}/cancel` - Cancel running operations
  - `GET /runs/{run_id}/events` - Retrieve run event history
  - `GET /session/{session_id}` - Session management
- **Message Structure**: Proper ACP `Message` with `MessagePart[]` array
  - Support for multiple content types (`text/plain`, `application/json`)
  - Content encoding support (`plain`, `base64`)
  - Metadata support for citations and trajectory tracking
  - Proper role patterns (`user`, `agent/{agent_name}`)
- **Run Lifecycle Management**: 
  - UUID-based run IDs following ACP specification
  - Standard status values: `created`, `in-progress`, `awaiting`, `cancelling`, `cancelled`, `completed`, `failed`
  - Complete run state tracking with timestamps
- **Event System**: Real-time event emission for run lifecycle
  - `run.created`, `run.in-progress`, `run.completed`, `run.failed`, `run.cancelled` events
  - Server-sent events (SSE) support for streaming mode
  - Event history tracking and retrieval
- **Session Management**: 
  - Multi-user session support with UUID-based session IDs
  - Session-scoped run organization
  - Cross-run context preservation
- **Agent Manifest**: ACP-compliant agent metadata
  - Content type declarations for input/output
  - Structured capability descriptions
  - Author and licensing metadata
  - Performance metrics and status reporting

#### 🔧 Changed - Core Architecture Updates
- **Type System**: Replaced custom types with official ACP SDK types
- **Route Structure**: Moved from `/api/v1/*` to root-level ACP endpoints
- **Agent Implementation**: Complete rewrite with `runACP()` method
- **Server Configuration**: Root-level routing without API versioning prefix
- **Error Handling**: ACP-compliant error response format with standard codes

#### 🧪 Enhanced Testing
- **ACP Compliance Test**: Comprehensive test suite validating all ACP endpoints
- **Integration Tests**: Updated to test both mock and real LLM scenarios
- **Mock LLM Support**: Standalone testing without LM Studio dependency
- **Protocol Validation**: Automated verification of ACP message formats

#### 📚 Documentation Updates
- **README.md**: Complete rewrite with ACP examples and SDK usage
- **API Examples**: All examples updated to use ACP endpoints and message format
- **Migration Guide**: Detailed migration information and breaking changes
- **ACP Compliance Report**: Comprehensive technical migration documentation

#### 🔄 Migration Guide
**Before (v1.x):**
```bash
curl -X POST http://localhost:3000/api/v1/run \
  -H "Content-Type: application/json" \
  -d '{"input": "Hello", "type": "question"}'
```

**After (v2.x):**
```bash
curl -X POST http://localhost:3000/runs \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "asistentepersonal",
    "input": [{
      "role": "user",
      "parts": [{
        "content_type": "text/plain",
        "content": "Hello",
        "content_encoding": "plain",
        "metadata": null
      }],
      "created_at": "2025-01-24T12:00:00.000Z",
      "completed_at": "2025-01-24T12:00:00.000Z"
    }],
    "mode": "sync"
  }'
```

**Recommended (v2.x with SDK):**
```typescript
import { Client } from 'acp-sdk';
const client = new Client({ baseUrl: "http://localhost:3000" });
const run = await client.runSync("asistentepersonal", "Hello");
```

#### 🏗️ Technical Details
- **Dependencies**: Added `acp-sdk@1.0.0`, `uuid@11.1.0`
- **Code Quality**: Fixed all ESLint errors and warnings
- **Type Safety**: Replaced `any` types with proper TypeScript types
- **Build System**: Updated compilation and testing workflows

---

## [1.0.0] - 2024-01-23

### Added
- **Agent Communication Protocol (ACP)** implementation with TypeScript
- **Dual runtime support** for Node.js and Bun
- **LM Studio integration** for local LLM hosting
- **Structured logging** with Pino library
- **Comprehensive testing suite** with 86 unit and integration tests
- **Docker deployment** with multi-stage builds and health checks
- **RESTful API** with Express.js server
- **Hot reloading** development mode
- **ESLint and Prettier** code quality tools
- **Security hardening** with Helmet and CORS
- **TypeScript strict mode** with full type safety
- **Environment configuration** with dotenv support
- **Graceful shutdown** handling for production

#### Core Features
- Agent execution with question answering, task assistance, and conversation
- Health monitoring and status endpoints
- Agent capabilities and metadata retrieval
- Streaming response support
- Request validation with Zod schemas
- Error handling and logging throughout

#### Development Experience
- Modern TypeScript development setup
- Bun test runner integration
- Automated integration testing with server lifecycle management
- Development and production Docker configurations
- Code formatting and linting automation
- Git hooks preparation for conventional commits

#### API Endpoints
- `GET /api/v1/health` - Service health check
- `GET /api/v1/agent` - Agent details and metadata
- `GET /api/v1/capabilities` - Agent capabilities
- `POST /api/v1/run` - Execute agent requests
- `GET /api/v1/run/:id` - Check execution status

#### Testing
- 86 comprehensive tests across 6 test files
- Unit tests for all core components
- Integration tests with automatic server management
- Mock implementations for external dependencies
- Performance and error condition testing

#### Deployment
- Docker Compose orchestration with monitoring services
- Multi-runtime container support (Node.js/Bun)
- Production optimizations with non-root user
- Health checks and restart policies
- Environment-based configuration

### Technical Implementation
- **Runtime Detection**: Automatic Node.js vs Bun detection and compatibility
- **ES Modules**: Full ESM support with proper import extensions
- **Type Safety**: Strict TypeScript configuration with comprehensive type definitions
- **Error Handling**: Centralized error logging and graceful failure modes
- **Performance**: Optimized request handling and memory management
- **Security**: Input validation, security headers, and CORS configuration

### Dependencies
- **Core**: TypeScript 5.8.3, Express 4.21.2, Pino 9.5.0
- **Development**: ESLint 9.17.0, Prettier 3.4.2, Bun 1.2.13
- **Testing**: Bun test runner, Axios for HTTP testing
- **Deployment**: Docker, Docker Compose with multi-service support

### Configuration
- Environment variable configuration for all services
- Agent metadata configuration via JSON
- LM Studio endpoint and model configuration
- Logging level and service configuration
- CORS and security policy configuration

---

## Version History

### [1.0.0] - 2024-01-23
**Initial Release** - Complete ACP Agent implementation with production-ready features, dual runtime support, comprehensive testing, and Docker deployment.

---

## Legend

- **Added** for new features
- **Changed** for changes in existing functionality  
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for information on how to contribute to this project.

All changes should follow [Conventional Commits](https://conventionalcommits.org/) specification.