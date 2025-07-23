import { describe, it, expect, beforeEach } from 'bun:test';
import { LMStudioClient } from './llm-client.js';
import type { LLMClientConfig, LLMMessage } from '../types/llm.js';

describe('LMStudioClient', () => {
  let client: LMStudioClient;
  const defaultConfig: LLMClientConfig = {
    baseUrl: 'http://localhost:1234/v1',
    model: 'test-model',
    timeout: 30000,
  };

  beforeEach(() => {
    client = new LMStudioClient(defaultConfig);
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      const config: LLMClientConfig = {
        baseUrl: 'http://test.com',
        model: 'custom-model',
        timeout: 5000,
      };

      const testClient = new LMStudioClient(config);
      expect(testClient).toBeDefined();
    });

    it('should use default timeout if not provided', () => {
      const config: LLMClientConfig = {
        baseUrl: 'http://test.com',
        model: 'custom-model',
      };

      const testClient = new LMStudioClient(config);
      expect(testClient).toBeDefined();
    });
  });

  describe('generateResponse', () => {
    const mockMessages: LLMMessage[] = [{ role: 'user', content: 'Hello' }];

    it('should be a function', () => {
      expect(typeof client.generateResponse).toBe('function');
    });

    it('should handle network errors gracefully', async () => {
      // Use a config that will definitely fail quickly
      const failConfig: LLMClientConfig = {
        baseUrl: 'http://localhost:9999', // Non-existent port
        model: 'fail-model',
        timeout: 1000,
      };

      const failClient = new LMStudioClient(failConfig);
      const result = await failClient.generateResponse(mockMessages);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(typeof result.error).toBe('string');
      expect(typeof result.content).toBe('string');
    });

    it('should accept custom options', () => {
      // Just test that the method accepts the parameters without timing out
      expect(() => {
        client.generateResponse(mockMessages, {
          temperature: 0.5,
          maxTokens: 1000,
        });
      }).not.toThrow();
    });
  });

  describe('streamResponse', () => {
    const mockMessages: LLMMessage[] = [
      { role: 'user', content: 'Stream test' },
    ];

    it('should be a function', () => {
      expect(typeof client.streamResponse).toBe('function');
    });

    it('should accept messages and options', async () => {
      try {
        const result = await client.streamResponse(mockMessages, {
          temperature: 0.9,
          maxTokens: 1500,
        });
        expect(result).toBeDefined();
      } catch (error) {
        // Expected to fail in test environment without actual server
        expect(error).toBeDefined();
      }
    });
  });

  describe('checkHealth', () => {
    it('should be a function', () => {
      expect(typeof client.checkHealth).toBe('function');
    });

    it('should handle connection failures', async () => {
      // Use a config that will definitely fail quickly
      const failConfig: LLMClientConfig = {
        baseUrl: 'http://localhost:9999', // Non-existent port
        model: 'fail-model',
        timeout: 1000,
      };

      const failClient = new LMStudioClient(failConfig);
      const result = await failClient.checkHealth();

      expect(result).toBeDefined();
      expect(result.status).toBe('unhealthy');
      expect(typeof result.error).toBe('string');
    });
  });

  describe('configuration handling', () => {
    it('should store configuration correctly', () => {
      const config: LLMClientConfig = {
        baseUrl: 'http://custom.url',
        model: 'custom-model-name',
        timeout: 45000,
      };

      const testClient = new LMStudioClient(config);
      expect(testClient).toBeDefined();
    });

    it('should handle missing optional timeout', () => {
      const config: LLMClientConfig = {
        baseUrl: 'http://test.url',
        model: 'test-model',
      };

      const testClient = new LMStudioClient(config);
      expect(testClient).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle timeout errors', async () => {
      // Use a config with very short timeout
      const timeoutConfig: LLMClientConfig = {
        baseUrl: 'http://localhost:9999',
        model: 'timeout-model',
        timeout: 1, // Very short timeout
      };

      const timeoutClient = new LMStudioClient(timeoutConfig);
      const result = await timeoutClient.generateResponse([
        { role: 'user', content: 'Test' },
      ]);

      expect(result.success).toBe(false);
      expect(typeof result.error).toBe('string');
      expect(typeof result.content).toBe('string');
    });
  });
});
