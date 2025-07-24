// Re-export ACP SDK types for use throughout the application
export {
  // Core types
  Message,
  MessagePart,
  Run,
  RunStatus,
  RunMode,
  AgentManifest,
  AgentName,
  SessionId,
  RunId,
  Event,

  // Request/Response schemas
  RunCreateRequest,
  RunResumeRequest,
  RunCreateResponse,
  RunReadResponse,
  RunResumeResponse,
  AgentsListResponse,
  AgentsReadResponse,
  PingResponse,
  RunEventsListResponse,

  // Error types
  ErrorModel,
  ErrorCode,

  // Metadata types
  CitationMetadata,
  TrajectoryMetadata,
  Metadata,

  // Utility functions
  isMessage,
  isMessagePart,
  isTerminalRunStatus,
  throwForRunStatus,
  compressMessage,
  concatMessages,
} from 'acp-sdk';

// Import types needed for custom interfaces
import type { SessionId as ACPSessionId, Run as ACPRun } from 'acp-sdk';

// Custom server configuration (not part of ACP spec)
export interface ACPServerConfig {
  port: number;
  host: string;
  cors?: boolean;
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
}

// Session management (extended from ACP)
export interface SessionState {
  id: ACPSessionId;
  history: ACPRun[];
  createdAt: Date;
  lastActivity: Date;
}
