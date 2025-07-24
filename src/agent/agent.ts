import type { LMStudioClient } from '../utils/llm-client.js';
import type { AgentHealthStatus } from '../types/agent.js';
import type {
  Message,
  MessagePart,
  Run,
  RunId,
  SessionId,
  AgentManifest,
  Event,
} from '../types/acp.js';
import type { LLMResponse } from '../types/llm.js';
import { AgentCapabilities } from './capabilities.js';
import { agentLogger, logError, logAgentResult } from '../utils/logger.js';

export class ACPAgent {
  private llmClient: LMStudioClient;
  private agentManifest: AgentManifest;
  private capabilities: AgentCapabilities;
  private runs: Map<RunId, Run>;
  private runEvents: Map<RunId, Event[]>;
  private sessions: Map<SessionId, { runs: RunId[]; createdAt: Date }>;

  constructor(llmClient: LMStudioClient, manifest?: Partial<AgentManifest>) {
    this.llmClient = llmClient;
    this.capabilities = new AgentCapabilities(llmClient);
    this.runs = new Map();
    this.runEvents = new Map();
    this.sessions = new Map();

    // Create default ACP-compliant agent manifest
    this.agentManifest = {
      name: manifest?.name || 'my-agent',
      description:
        manifest?.description || 'ACP-compliant AI agent powered by LM Studio',
      input_content_types: manifest?.input_content_types || [
        'text/plain',
        'application/json',
      ],
      output_content_types: manifest?.output_content_types || ['text/plain'],
      metadata: {
        programming_language: 'TypeScript',
        framework: 'Custom',
        natural_languages: ['en', 'es'],
        capabilities: [
          {
            name: 'Text Processing',
            description: 'Process and analyze text content',
          },
          {
            name: 'Question Answering',
            description: 'Answer questions based on provided context',
          },
          {
            name: 'Task Assistance',
            description: 'Help with various tasks and problem-solving',
          },
        ],
        author: {
          name: 'Mauro Stepanoski',
          email: null,
          url: null,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...manifest?.metadata,
      },
    };
  }

  // ACP-compliant run method
  async runACP(
    input: Message[],
    runId: RunId,
    sessionId: SessionId
  ): Promise<Run> {
    const startTime = new Date();

    try {
      // Ensure session exists
      if (!this.sessions.has(sessionId)) {
        this.sessions.set(sessionId, { runs: [], createdAt: new Date() });
      }

      // Create initial run object
      const run: Run = {
        agent_name: this.agentManifest.name,
        session_id: sessionId,
        run_id: runId,
        status: 'in-progress',
        await_request: null,
        output: [],
        error: null,
        created_at: startTime.toISOString(),
        finished_at: null,
      };

      // Store run and add to session
      this.runs.set(runId, run);
      this.runEvents.set(runId, []);
      this.sessions.get(sessionId)!.runs.push(runId);

      // Emit run created event
      this.emitEvent(runId, {
        type: 'run.created',
        run,
      });

      // Emit run in-progress event
      this.emitEvent(runId, {
        type: 'run.in-progress',
        run: { ...run, status: 'in-progress' },
      });

      // Convert ACP Messages to LLM format and process
      const llmMessages = this.convertACPMessagesToLLM(input);
      const llmResponse = await this.processWithLLM(llmMessages);

      // Convert LLM response back to ACP Message format
      const outputMessages = this.convertLLMResponseToACP(llmResponse);

      // Update run with results
      const completedRun: Run = {
        ...run,
        status: 'completed',
        output: outputMessages,
        finished_at: new Date().toISOString(),
      };

      this.runs.set(runId, completedRun);

      // Emit completion event
      this.emitEvent(runId, {
        type: 'run.completed',
        run: completedRun,
      });

      logAgentResult(runId, true, Date.now() - startTime.getTime(), {
        tokens: llmResponse.usage,
        outputLength: outputMessages.length,
      });

      return completedRun;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      const failedRun: Run = {
        agent_name: this.agentManifest.name,
        session_id: sessionId,
        run_id: runId,
        status: 'failed',
        await_request: null,
        output: [],
        error: {
          code: 'server_error',
          message: errorMessage,
          data: null,
        },
        created_at: startTime.toISOString(),
        finished_at: new Date().toISOString(),
      };

      this.runs.set(runId, failedRun);

      // Emit failed event
      this.emitEvent(runId, {
        type: 'run.failed',
        run: failedRun,
      });

      logError(
        agentLogger,
        `Agent execution failed: ${runId}`,
        error as Error,
        {
          runId,
          sessionId,
          duration: Date.now() - startTime.getTime(),
        }
      );

      return failedRun;
    }
  }

  private convertACPMessagesToLLM(
    messages: Message[]
  ): Array<{ role: string; content: string }> {
    return messages.map(message => {
      // Extract text content from message parts
      const textContent = message.parts
        .filter(
          part => part.content_type && part.content_type.startsWith('text/')
        )
        .map(part => part.content || '')
        .join('\n');

      // Map ACP roles to LLM roles
      let role = 'user';
      if (message.role.startsWith('agent')) {
        role = 'assistant';
      } else if (message.role === 'user') {
        role = 'user';
      }

      return { role, content: textContent };
    });
  }

  private convertLLMResponseToACP(llmResponse: LLMResponse): Message[] {
    const messagePart: MessagePart = {
      content_type: 'text/plain',
      content: llmResponse.content,
      content_encoding: 'plain',
      metadata: null,
    };

    const message: Message = {
      role: `agent/${this.agentManifest.name}`,
      parts: [messagePart],
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };

    return [message];
  }

  private async processWithLLM(
    messages: Array<{ role: string; content: string }>
  ): Promise<LLMResponse> {
    // Use existing capabilities to process the messages
    if (messages.length === 1) {
      const content = messages[0].content;
      return await this.capabilities.processTextTask(content, {});
    } else {
      // Convert to legacy format for capabilities
      const legacyMessages = messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      }));
      return await this.capabilities.continueConversation(legacyMessages, {});
    }
  }

  private emitEvent(runId: RunId, event: Event): void {
    const events = this.runEvents.get(runId) || [];
    events.push(event);
    this.runEvents.set(runId, events);
  }

  // ACP-compliant getter methods
  getRun(runId: RunId): Run | null {
    return this.runs.get(runId) || null;
  }

  getRunEvents(runId: RunId): Event[] | null {
    return this.runEvents.get(runId) || null;
  }

  async cancelRun(runId: RunId): Promise<Run | null> {
    const run = this.runs.get(runId);
    if (!run) return null;

    if (
      run.status === 'completed' ||
      run.status === 'failed' ||
      run.status === 'cancelled'
    ) {
      return run; // Already finished
    }

    const cancelledRun: Run = {
      ...run,
      status: 'cancelled',
      finished_at: new Date().toISOString(),
    };

    this.runs.set(runId, cancelledRun);

    this.emitEvent(runId, {
      type: 'run.cancelled',
      run: cancelledRun,
    });

    return cancelledRun;
  }

  async resumeRun(runId: RunId, _awaitResume: unknown): Promise<Run | null> {
    const run = this.runs.get(runId);
    if (!run || run.status !== 'awaiting') return null;

    // TODO: Implement proper resume logic based on await_resume payload
    // For now, just mark as completed
    const resumedRun: Run = {
      ...run,
      status: 'completed',
      finished_at: new Date().toISOString(),
    };

    this.runs.set(runId, resumedRun);

    this.emitEvent(runId, {
      type: 'run.completed',
      run: resumedRun,
    });

    return resumedRun;
  }

  getAgentManifest(): AgentManifest {
    return this.agentManifest;
  }

  getCapabilities() {
    return this.capabilities.getCapabilities();
  }

  async checkHealth(): Promise<AgentHealthStatus> {
    try {
      const llmHealth = await this.llmClient.checkHealth();
      return {
        status: llmHealth.status === 'healthy' ? 'healthy' : 'degraded',
        agent: this.agentManifest.name,
        version: '1.0.0', // TODO: Get from manifest
        llm: llmHealth,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      return {
        status: 'unhealthy',
        agent: this.agentManifest.name,
        version: '1.0.0', // TODO: Get from manifest
        llm: { status: 'unhealthy', error: errorMessage },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        error: errorMessage,
      };
    }
  }
}
