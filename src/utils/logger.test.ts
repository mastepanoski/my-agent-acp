import { describe, it, expect } from 'bun:test';
import {
  createComponentLogger,
  logError,
  logRequest,
  logAgentExecution,
  logAgentResult,
  logLLMRequest,
  requestLogger,
  agentLogger,
  llmLogger,
} from './logger.js';

describe('Logger Utility', () => {
  describe('createComponentLogger', () => {
    it('should create a logger with component name', () => {
      const testLogger = createComponentLogger('test-component');
      expect(testLogger).toBeDefined();
      expect(typeof testLogger.info).toBe('function');
      expect(typeof testLogger.error).toBe('function');
      expect(typeof testLogger.debug).toBe('function');
      expect(typeof testLogger.warn).toBe('function');
    });

    it('should create different loggers for different components', () => {
      const logger1 = createComponentLogger('component1');
      const logger2 = createComponentLogger('component2');
      expect(logger1).not.toBe(logger2);
    });
  });

  describe('predefined loggers', () => {
    it('should export predefined component loggers', () => {
      expect(requestLogger).toBeDefined();
      expect(agentLogger).toBeDefined();
      expect(llmLogger).toBeDefined();

      expect(typeof requestLogger.info).toBe('function');
      expect(typeof agentLogger.info).toBe('function');
      expect(typeof llmLogger.info).toBe('function');
    });
  });

  describe('utility functions', () => {
    it('should have logError function', () => {
      expect(typeof logError).toBe('function');
    });

    it('should have logRequest function', () => {
      expect(typeof logRequest).toBe('function');
    });

    it('should have logAgentExecution function', () => {
      expect(typeof logAgentExecution).toBe('function');
    });

    it('should have logAgentResult function', () => {
      expect(typeof logAgentResult).toBe('function');
    });

    it('should have logLLMRequest function', () => {
      expect(typeof logLLMRequest).toBe('function');
    });
  });

  describe('logError function signature', () => {
    it('should be callable with correct parameters', () => {
      expect(typeof logError).toBe('function');
      expect(logError.length).toBe(4); // 3 required + 1 optional parameter
    });
  });

  describe('logRequest function signature', () => {
    it('should accept required parameters without throwing', () => {
      expect(() => {
        logRequest('GET', '/test', 200, 100);
      }).not.toThrow();

      expect(() => {
        logRequest('POST', '/api/test', 201, 150, { userId: '123' });
      }).not.toThrow();
    });
  });

  describe('logAgentExecution function signature', () => {
    it('should accept required parameters without throwing', () => {
      expect(() => {
        logAgentExecution('run-123', 'question', 'test input');
      }).not.toThrow();

      expect(() => {
        logAgentExecution('run-456', 'task', 'test input', {
          sessionId: 'sess-123',
        });
      }).not.toThrow();
    });

    it('should handle long input strings', () => {
      const longInput = 'a'.repeat(200);
      expect(() => {
        logAgentExecution('run-123', 'question', longInput);
      }).not.toThrow();
    });
  });

  describe('logAgentResult function signature', () => {
    it('should accept required parameters without throwing', () => {
      expect(() => {
        logAgentResult('run-123', true, 1500);
      }).not.toThrow();

      expect(() => {
        logAgentResult('run-456', false, 800, { error: 'Test error' });
      }).not.toThrow();
    });
  });

  describe('logLLMRequest function signature', () => {
    it('should accept required parameters without throwing', () => {
      const tokens = { prompt: 100, completion: 50, total: 150 };

      expect(() => {
        logLLMRequest('gpt-4', tokens, 2000);
      }).not.toThrow();

      expect(() => {
        logLLMRequest('llama-2', tokens, 1500, { temperature: 0.7 });
      }).not.toThrow();
    });

    it('should handle minimal token information', () => {
      const tokens = { prompt: 75 };

      expect(() => {
        logLLMRequest('test-model', tokens, 1000);
      }).not.toThrow();
    });
  });
});
