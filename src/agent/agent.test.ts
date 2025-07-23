import { describe, it, expect, beforeEach } from 'bun:test';
import { ACPAgent } from './agent.js';
import type { AgentDetail } from '../types/agent.js';
import type { ACPRequest } from '../types/acp.js';
import type { LLMResponse } from '../types/llm.js';

// Simple mock LLM client for testing
class MockLLMClient {
  private mockResponses: LLMResponse[] = [];
  private responseIndex = 0;

  setMockResponse(response: LLMResponse) {
    this.mockResponses = [response];
    this.responseIndex = 0;
  }

  async generateResponse(): Promise<LLMResponse> {
    if (this.responseIndex < this.mockResponses.length) {
      return this.mockResponses[this.responseIndex++];
    }
    return {
      success: false,
      error: 'No mock response configured',
      content: 'Mock error',
    };
  }

  async streamResponse(): Promise<AsyncIterable<string>> {
    return {
      async *[Symbol.asyncIterator]() {
        yield 'mock stream data';
      },
    };
  }

  async checkHealth() {
    return {
      status: 'healthy' as const,
      models: ['mock-model'],
    };
  }
}

describe('ACPAgent', () => {
  let agent: ACPAgent;
  let mockLLMClient: MockLLMClient;
  let agentDetail: AgentDetail;

  beforeEach(() => {
    mockLLMClient = new MockLLMClient();
    agentDetail = {
      name: 'Test Agent',
      description: 'A test agent for unit testing',
      version: '1.0.0',
      author: 'Test Author',
      capabilities: ['question-answering', 'text-processing'],
      metadata: {
        model: 'test-model',
        maxTokens: 2048,
        temperature: 0.7,
        supportedLanguages: ['en', 'es'],
      },
      endpoints: {
        health: '/health',
        run: '/run',
        capabilities: '/capabilities',
      },
    };
    agent = new ACPAgent(mockLLMClient as MockLLMClient & any, agentDetail);
  });

  describe('constructor', () => {
    it('should initialize with provided details', () => {
      expect(agent.getAgentDetail()).toEqual(agentDetail);
    });

    it('should initialize with empty run history', () => {
      const runStatus = agent.getRunStatus('non-existent-run');
      expect(runStatus).toBeNull();
    });
  });

  describe('getAgentDetail', () => {
    it('should return agent details', () => {
      const details = agent.getAgentDetail();
      expect(details.name).toBe('Test Agent');
      expect(details.version).toBe('1.0.0');
      expect(details.capabilities).toEqual([
        'question-answering',
        'text-processing',
      ]);
    });
  });

  describe('getCapabilities', () => {
    it('should return agent capabilities info', () => {
      const capabilities = agent.getCapabilities();
      expect(capabilities).toHaveProperty('capabilities');
      expect(capabilities).toHaveProperty('description');
      expect(capabilities).toHaveProperty('supportedModes');
      expect(Array.isArray(capabilities.capabilities)).toBe(true);
    });
  });

  describe('checkHealth', () => {
    it('should return healthy status when LLM is healthy', async () => {
      const health = await agent.checkHealth();

      expect(health.status).toBe('healthy');
      expect(health.agent).toBe('Test Agent');
      expect(health.version).toBe('1.0.0');
      expect(health.llm.status).toBe('healthy');
      expect(typeof health.uptime).toBe('number');
      expect(health.memory).toBeDefined();
    });
  });

  describe('run', () => {
    const baseRequest: ACPRequest = {
      input: 'What is the capital of France?',
      type: 'question',
    };

    it('should process successful request with input', async () => {
      const mockLLMResponse: LLMResponse = {
        success: true,
        content: 'The capital of France is Paris.',
        usage: {
          prompt_tokens: 10,
          completion_tokens: 8,
          total_tokens: 18,
        },
      };

      mockLLMClient.setMockResponse(mockLLMResponse);

      const result = await agent.run(baseRequest);

      expect(result.runId).toBeDefined();
      expect(typeof result.runId).toBe('string');
      expect(result.status).toBe('completed');
      expect(result.result).toBe('The capital of France is Paris.');
      expect(result.metadata.usage?.totalTokens).toBe(18);
    });

    it('should process request with message field', async () => {
      const requestWithMessage: ACPRequest = {
        message: 'Hello, how are you?',
        type: 'conversation',
      };

      const mockLLMResponse: LLMResponse = {
        success: true,
        content: 'Hello! I am doing well, thank you.',
        usage: {},
      };

      mockLLMClient.setMockResponse(mockLLMResponse);

      const result = await agent.run(requestWithMessage);

      expect(result.status).toBe('completed');
      expect(result.result).toBe('Hello! I am doing well, thank you.');
    });

    it('should process request with messages array', async () => {
      const requestWithMessages: ACPRequest = {
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
          { role: 'user', content: 'How are you?' },
        ],
        type: 'conversation',
      };

      const mockLLMResponse: LLMResponse = {
        success: true,
        content: 'I am doing great!',
        usage: {},
      };

      mockLLMClient.setMockResponse(mockLLMResponse);

      const result = await agent.run(requestWithMessages);

      expect(result.status).toBe('completed');
      expect(result.result).toBe('I am doing great!');
    });

    it('should handle LLM failure gracefully', async () => {
      // For this test, we need the LLM client to throw an exception
      // rather than return a failed response, since that's how actual failures work
      const originalMethod = mockLLMClient.generateResponse;
      mockLLMClient.generateResponse = async () => {
        throw new Error('Model not available');
      };

      const result = await agent.run(baseRequest);

      expect(result.status).toBe('failed');
      expect(result.error).toBe('Model not available');

      // Restore the original method
      mockLLMClient.generateResponse = originalMethod;
    });

    it('should use custom processing context when provided', async () => {
      const requestWithContext: ACPRequest = {
        input: 'Test input',
        type: 'text-processing',
        context: {
          temperature: 0.8,
          maxTokens: 1000,
        },
      };

      const mockLLMResponse: LLMResponse = {
        success: true,
        content: 'Test response',
        usage: {},
      };

      mockLLMClient.setMockResponse(mockLLMResponse);

      const result = await agent.run(requestWithContext);
      expect(result.status).toBe('completed');
    });

    it('should store run status for successful execution', async () => {
      const mockLLMResponse: LLMResponse = {
        success: true,
        content: 'Success response',
        usage: { total_tokens: 25 },
      };

      mockLLMClient.setMockResponse(mockLLMResponse);

      const result = await agent.run(baseRequest);
      const runStatus = agent.getRunStatus(result.runId);

      expect(runStatus).toBeDefined();
      expect(runStatus!.id).toBe(result.runId);
      expect(runStatus!.status).toBe('completed');
      expect(result.result).toBe('Success response');
      expect(result.metadata.usage?.totalTokens).toBe(25);
    });
  });

  describe('getRunStatus', () => {
    it('should return null for non-existent run', () => {
      const status = agent.getRunStatus('non-existent-run-id');
      expect(status).toBeNull();
    });

    it('should return run status for existing run', async () => {
      const mockLLMResponse: LLMResponse = {
        success: true,
        content: 'Test response',
        usage: {},
      };

      mockLLMClient.setMockResponse(mockLLMResponse);

      const result = await agent.run({
        input: 'Test',
        type: 'question',
      });

      const status = agent.getRunStatus(result.runId);

      expect(status).toBeDefined();
      expect(status!.id).toBe(result.runId);
      expect(status!.status).toBe('completed');
    });
  });

  describe('type validation', () => {
    it('should handle various input types', async () => {
      const mockResponse: LLMResponse = {
        success: true,
        content: 'Response',
        usage: {},
      };

      // Test with different request types
      const requests: ACPRequest[] = [
        { input: 'test', type: 'question' },
        { message: 'test', type: 'conversation' },
        { messages: [{ role: 'user', content: 'test' }], type: 'conversation' },
        { input: 'test', type: 'text-processing' },
        { input: 'test', type: 'task' },
      ];

      for (const request of requests) {
        mockLLMClient.setMockResponse(mockResponse);
        const result = await agent.run(request);
        expect(result).toBeDefined();
        expect(result.status).toBeDefined();
        expect(typeof result.runId).toBe('string');
      }
    });
  });

  describe('configuration', () => {
    it('should use agent metadata in processing', () => {
      const detail = agent.getAgentDetail();
      expect(detail.metadata.model).toBe('test-model');
      expect(detail.metadata.maxTokens).toBe(2048);
      expect(detail.metadata.temperature).toBe(0.7);
    });

    it('should have required endpoints', () => {
      const detail = agent.getAgentDetail();
      expect(detail.endpoints.health).toBe('/health');
      expect(detail.endpoints.run).toBe('/run');
      expect(detail.endpoints.capabilities).toBe('/capabilities');
    });
  });
});
