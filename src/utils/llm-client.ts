import axios, { AxiosInstance } from 'axios';
import type {
  LLMMessage,
  LLMResponse,
  LLMClientConfig,
  ProcessingContext,
} from '../types/llm.js';
import { llmLogger, logError, logLLMRequest } from './logger.js';

export class LMStudioClient {
  private baseUrl: string;
  private model: string;
  private client: AxiosInstance;

  constructor(config: LLMClientConfig) {
    this.baseUrl = config.baseUrl;
    this.model = config.model;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async generateResponse(
    messages: LLMMessage[],
    options: ProcessingContext = {}
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    try {
      const payload = {
        model: this.model,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
        stream: false,
      };

      llmLogger.debug(
        {
          llm: {
            model: payload.model,
            messageCount: payload.messages.length,
            temperature: payload.temperature,
            maxTokens: payload.max_tokens,
          },
        },
        'Sending request to LM Studio'
      );

      const response = await this.client.post('/chat/completions', payload);
      const duration = Date.now() - startTime;

      if (
        response.data &&
        response.data.choices &&
        response.data.choices.length > 0
      ) {
        const result = {
          success: true,
          content: response.data.choices[0].message.content,
          usage: response.data.usage || {},
        };

        // Log successful LLM request
        logLLMRequest(
          payload.model,
          {
            prompt: result.usage.prompt_tokens || 0,
            completion: result.usage.completion_tokens || 0,
            total: result.usage.total_tokens || 0,
          },
          duration
        );

        return result;
      } else {
        throw new Error('Respuesta inválida del modelo');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';

      logError(llmLogger, 'LLM request failed', error as Error, {
        model: this.model,
        duration: Date.now() - startTime,
      });

      return {
        success: false,
        error: errorMessage,
        content: 'Lo siento, no pude procesar tu solicitud en este momento.',
      };
    }
  }

  async streamResponse(
    messages: LLMMessage[],
    options: ProcessingContext = {}
  ): Promise<AsyncIterable<string>> {
    try {
      const payload = {
        model: this.model,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
        stream: true,
      };

      return await this.client.post('/chat/completions', payload, {
        responseType: 'stream',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      logError(llmLogger, 'LLM streaming failed', error as Error);
      throw new Error(errorMessage);
    }
  }

  async checkHealth(): Promise<{
    status: string;
    models?: string[];
    error?: string;
  }> {
    try {
      const response = await this.client.get('/models');
      const result = {
        status: 'healthy',
        models: response.data.data || [],
      };

      llmLogger.debug(
        {
          health: {
            status: result.status,
            modelCount: result.models?.length || 0,
          },
        },
        'LLM health check successful'
      );

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';

      logError(llmLogger, 'LLM health check failed', error as Error);

      return {
        status: 'unhealthy',
        error: errorMessage,
      };
    }
  }
}
