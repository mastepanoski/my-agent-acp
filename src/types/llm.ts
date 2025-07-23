export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  success: boolean;
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: string;
}

export interface LLMClientConfig {
  baseUrl: string;
  model: string;
  timeout?: number;
}

export interface ProcessingContext {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}
