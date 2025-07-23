import type { LMStudioClient } from '../utils/llm-client.js';
import type {
  AgentDetail,
  AgentHealthStatus,
  RequestType,
} from '../types/agent.js';
import type { ACPRequest, ACPResponse, ACPRunHistory } from '../types/acp.js';
import type { LLMResponse } from '../types/llm.js';
import { AgentCapabilities } from './capabilities.js';
import { ACPRequestSchema } from '../types/acp.js';
import {
  agentLogger,
  logError,
  logAgentExecution,
  logAgentResult,
} from '../utils/logger.js';

export class ACPAgent {
  private llmClient: LMStudioClient;
  private agentDetail: AgentDetail;
  private capabilities: AgentCapabilities;
  private runHistory: Map<string, ACPRunHistory>;
  private runCounter: number;

  constructor(llmClient: LMStudioClient, agentDetail: AgentDetail) {
    this.llmClient = llmClient;
    this.agentDetail = agentDetail;
    this.capabilities = new AgentCapabilities(llmClient);
    this.runHistory = new Map();
    this.runCounter = 0;
  }

  async run(request: ACPRequest): Promise<ACPResponse> {
    // Validar request usando Zod
    const validationResult = ACPRequestSchema.safeParse(request);
    if (!validationResult.success) {
      throw new Error(`Request inválido: ${validationResult.error.message}`);
    }

    const runId = this.generateRunId();
    const startTime = Date.now();

    try {
      // Registrar el inicio de la ejecución
      this.runHistory.set(runId, {
        id: runId,
        status: 'in_progress',
        startTime,
        request: request,
      });

      logAgentExecution(
        runId,
        request.type || 'generic',
        request.input || request.message || 'conversation',
        { requestId: runId }
      );

      let result: LLMResponse;

      // Determinar el tipo de tarea basado en el input
      if (request.type) {
        result = await this.handleTypedRequest(request);
      } else {
        result = await this.handleGenericRequest(request);
      }

      // Actualizar el historial con el resultado
      const runRecord: ACPRunHistory = {
        ...this.runHistory.get(runId)!,
        status: 'completed',
        endTime: Date.now(),
        result: result,
        duration: Date.now() - startTime,
      };
      this.runHistory.set(runId, runRecord);

      const response = {
        runId,
        status: 'completed',
        result: result.content,
        metadata: {
          duration: Date.now() - startTime,
          usage: result.usage
            ? {
                promptTokens: result.usage.prompt_tokens,
                completionTokens: result.usage.completion_tokens,
                totalTokens: result.usage.total_tokens,
              }
            : {},
          model: this.agentDetail.metadata.model,
        },
      } as ACPResponse;

      // Log successful completion
      logAgentResult(runId, true, Date.now() - startTime, {
        tokens: result.usage,
        model: this.agentDetail.metadata.model,
      });

      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';

      logError(
        agentLogger,
        `Agent execution failed: ${runId}`,
        error as Error,
        {
          runId,
          duration: Date.now() - startTime,
        }
      );

      // Log failed execution
      logAgentResult(runId, false, Date.now() - startTime, {
        error: errorMessage,
      });

      const runRecord: ACPRunHistory = {
        ...this.runHistory.get(runId)!,
        status: 'failed',
        endTime: Date.now(),
        error: errorMessage,
      };
      this.runHistory.set(runId, runRecord);

      return {
        runId,
        status: 'failed',
        error: errorMessage,
        metadata: {
          duration: Date.now() - startTime,
        },
      };
    }
  }

  private async handleTypedRequest(request: ACPRequest): Promise<LLMResponse> {
    const input = request.input || request.message || '';
    const context = request.context || {};

    switch (request.type as RequestType) {
      case 'question':
        return await this.capabilities.answerQuestion(input, context);

      case 'task':
        return await this.capabilities.assistWithTask(input, context);

      case 'conversation':
        return await this.capabilities.continueConversation(
          request.messages || [],
          context
        );

      case 'text-processing':
      default:
        return await this.capabilities.processTextTask(input, context);
    }
  }

  private async handleGenericRequest(
    request: ACPRequest
  ): Promise<LLMResponse> {
    const input = request.input || request.message || '';

    // Análisis simple del input para determinar el tipo de tarea
    if (this.isQuestion(input)) {
      return await this.capabilities.answerQuestion(input, request.context);
    }

    if (this.isTaskRequest(input)) {
      return await this.capabilities.assistWithTask(input, request.context);
    }

    return await this.capabilities.processTextTask(input, request.context);
  }

  private isQuestion(input: string): boolean {
    return (
      input.includes('?') ||
      input.toLowerCase().startsWith('qué') ||
      input.toLowerCase().startsWith('cómo') ||
      input.toLowerCase().startsWith('cuál') ||
      input.toLowerCase().startsWith('cuándo') ||
      input.toLowerCase().startsWith('dónde') ||
      input.toLowerCase().startsWith('por qué')
    );
  }

  private isTaskRequest(input: string): boolean {
    return (
      input.toLowerCase().includes('ayuda') ||
      input.toLowerCase().includes('ayúdame') ||
      input.toLowerCase().includes('necesito') ||
      input.toLowerCase().includes('planifica') ||
      input.toLowerCase().includes('organiza')
    );
  }

  private generateRunId(): string {
    this.runCounter++;
    return `run-${Date.now()}-${this.runCounter}`;
  }

  getRunStatus(runId: string): ACPRunHistory | null {
    return this.runHistory.get(runId) || null;
  }

  getAgentDetail(): AgentDetail {
    return this.agentDetail;
  }

  getCapabilities() {
    return this.capabilities.getCapabilities();
  }

  async checkHealth(): Promise<AgentHealthStatus> {
    try {
      const llmHealth = await this.llmClient.checkHealth();
      return {
        status: llmHealth.status === 'healthy' ? 'healthy' : 'degraded',
        agent: this.agentDetail.name,
        version: this.agentDetail.version,
        llm: llmHealth,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      return {
        status: 'unhealthy',
        agent: this.agentDetail.name,
        version: this.agentDetail.version,
        llm: { status: 'unhealthy', error: errorMessage },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        error: errorMessage,
      };
    }
  }
}
