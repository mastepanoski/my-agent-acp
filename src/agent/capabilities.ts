import type { LMStudioClient } from '../utils/llm-client.js';
import type {
  LLMMessage,
  LLMResponse,
  ProcessingContext,
} from '../types/llm.js';
// Legacy type removed - using ACP-compliant capabilities structure

export class AgentCapabilities {
  private llmClient: LMStudioClient;
  private capabilities: string[];

  constructor(llmClient: LMStudioClient) {
    this.llmClient = llmClient;
    this.capabilities = [
      'text-processing',
      'question-answering',
      'task-assistance',
      'conversation',
    ];
  }

  async processTextTask(
    input: string,
    context: ProcessingContext = {}
  ): Promise<LLMResponse> {
    const systemPrompt = `Eres un asistente personal útil y amigable. 
    Respondes de manera clara, concisa y en español. 
    Si no sabes algo, lo admites honestamente.`;

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input },
    ];

    return await this.llmClient.generateResponse(messages, {
      temperature: context.temperature || 0.7,
      maxTokens: context.maxTokens || 1024,
    });
  }

  async answerQuestion(
    question: string,
    context: ProcessingContext = {}
  ): Promise<LLMResponse> {
    const systemPrompt = `Eres un asistente experto que responde preguntas de manera precisa y detallada.
    Proporciona información factual y útil. Si la pregunta requiere información actualizada que no tienes,
    indica claramente las limitaciones de tu conocimiento.`;

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ];

    return await this.llmClient.generateResponse(messages, {
      temperature: 0.3, // Más determinístico para preguntas factuales
      maxTokens: context.maxTokens || 1500,
    });
  }

  async assistWithTask(
    taskDescription: string,
    context: ProcessingContext = {}
  ): Promise<LLMResponse> {
    const systemPrompt = `Eres un asistente especializado en ayudar con tareas.
    Proporciona pasos claros, consejos prácticos y soluciones estructuradas.
    Organiza tu respuesta de manera lógica y fácil de seguir.`;

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Ayúdame con esta tarea: ${taskDescription}` },
    ];

    return await this.llmClient.generateResponse(messages, {
      temperature: 0.5,
      maxTokens: context.maxTokens || 2048,
    });
  }

  async continueConversation(
    messages: LLMMessage[],
    context: ProcessingContext = {}
  ): Promise<LLMResponse> {
    const systemPrompt = `Eres un asistente conversacional natural y empático.
    Mantén el contexto de la conversación y responde de manera coherente con el tono establecido.`;

    const conversationMessages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    return await this.llmClient.generateResponse(conversationMessages, {
      temperature: context.temperature || 0.8,
      maxTokens: context.maxTokens || 1024,
    });
  }

  getCapabilities(): {
    capabilities: string[];
    description: string;
    supportedModes: string[];
  } {
    return {
      capabilities: this.capabilities,
      description:
        'ACP-compliant agent capable of text processing, question answering, task assistance, and conversation',
      supportedModes: ['sync', 'async', 'stream'],
    };
  }
}
