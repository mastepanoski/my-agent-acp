import 'dotenv/config';
import { LMStudioClient } from './utils/llm-client.js';
import { ACPAgent } from './agent/agent.js';
import { ACPServer } from './server/server.js';
import type { LLMClientConfig } from './types/llm.js';
import type {
  ACPServerConfig,
  AgentManifest,
  RunId,
  SessionId,
} from './types/acp.js';
import { logger, logError } from './utils/logger.js';

// Importar configuración del agente (legacy)
import agentDetailJson from '../config/agent-detail.json' with { type: 'json' };

async function main(): Promise<void> {
  try {
    logger.info('Initializing ACP Agent with TypeScript');

    // Configuración desde variables de entorno
    const lmStudioConfig: LLMClientConfig = {
      baseUrl: process.env.LM_STUDIO_URL || 'http://localhost:1234/v1',
      model: process.env.LM_STUDIO_MODEL || 'llama-3.2-3b-instruct',
      timeout: parseInt(process.env.LM_STUDIO_TIMEOUT || '30000'),
    };

    const serverConfig: ACPServerConfig = {
      port: parseInt(process.env.ACP_PORT || '3000'),
      host: process.env.ACP_HOST || 'localhost',
      cors: process.env.ENABLE_CORS === 'true',
    };

    // Create ACP-compliant agent manifest from legacy config
    const agentManifest: Partial<AgentManifest> = {
      name: (process.env.AGENT_NAME || agentDetailJson.name)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-'),
      description: process.env.AGENT_DESCRIPTION || agentDetailJson.description,
      input_content_types: ['text/plain', 'application/json'],
      output_content_types: ['text/plain'],
      metadata: {
        programming_language: 'TypeScript',
        framework: 'Custom',
        natural_languages: ['en', 'es'],
        author: {
          name: agentDetailJson.author || 'Unknown',
          email: null,
          url: null,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    // Inicializar cliente LM Studio
    logger.info('Connecting to LM Studio', { service: 'lm-studio' });
    const llmClient = new LMStudioClient(lmStudioConfig);

    // Verificar conexión con LM Studio
    const healthCheck = await llmClient.checkHealth();
    if (healthCheck.status !== 'healthy') {
      throw new Error(`LM Studio no está disponible: ${healthCheck.error}`);
    }
    logger.info('LM Studio connection established', {
      service: 'lm-studio',
      status: 'connected',
    });
    logger.info('Available models retrieved', {
      service: 'lm-studio',
      modelCount: healthCheck.models?.length || 0,
    });

    // Crear agente ACP-compliant
    const agent = new ACPAgent(llmClient, agentManifest);
    logger.info('ACP Agent created successfully', {
      agentName: agentManifest.name,
      endpoints: ['ping', 'agents', 'runs'],
    });

    // Crear y iniciar servidor
    const server = new ACPServer(agent, serverConfig);
    await server.start();

    // Ejemplo de prueba automática ACP (opcional)
    if (process.env.NODE_ENV !== 'production') {
      setTimeout(async () => {
        try {
          logger.info('Running ACP compliance test', {
            environment: 'development',
          });

          // Test with ACP Message format
          const testMessages = [
            {
              role: 'user',
              parts: [
                {
                  content_type: 'text/plain',
                  content: '¿Cuál es la capital de Francia?',
                  content_encoding: 'plain' as const,
                  metadata: null,
                },
              ],
              created_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
            },
          ];

          const runId = 'test-run-' + Date.now();
          const sessionId = 'test-session-' + Date.now();

          const testResult = await agent.runACP(
            testMessages,
            runId as RunId,
            sessionId as SessionId
          );
          logger.info('ACP test completed successfully', {
            runId: testResult.run_id,
            status: testResult.status,
            outputLength: testResult.output.length,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Error desconocido';
          logError(
            logger,
            'ACP test execution failed',
            error instanceof Error ? error : new Error(errorMessage),
            { context: 'acp-test' }
          );
        }
      }, 2000);
    }

    // Manejo de cierre graceful
    process.on('SIGINT', async () => {
      logger.info('Shutting down server', { signal: 'SIGINT' });
      await server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down server', { signal: 'SIGTERM' });
      await server.stop();
      process.exit(0);
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    logError(
      logger,
      'Failed to initialize application',
      error instanceof Error ? error : new Error(errorMessage),
      { context: 'initialization' }
    );
    process.exit(1);
  }
}

// Ejecutar solo si este archivo se ejecuta directamente
// Compatibilidad para Node.js y Bun
const isMainModule =
  import.meta.main ||
  (typeof process !== 'undefined' &&
    process.argv[1] &&
    import.meta.url === `file://${process.argv[1]}`);

if (isMainModule) {
  main();
}

export { main };
