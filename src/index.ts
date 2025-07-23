import 'dotenv/config';
import { LMStudioClient } from './utils/llm-client.js';
import { ACPAgent } from './agent/agent.js';
import { ACPServer } from './server/server.js';
import type { AgentDetail } from './types/agent.js';
import type { LLMClientConfig } from './types/llm.js';
import type { ACPServerConfig } from './types/acp.js';
import { logger, logError } from './utils/logger.js';

// Importar configuración del agente
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

    const agentDetail: AgentDetail = {
      ...agentDetailJson,
      name: process.env.AGENT_NAME || agentDetailJson.name,
      description: process.env.AGENT_DESCRIPTION || agentDetailJson.description,
      version: process.env.AGENT_VERSION || agentDetailJson.version,
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

    // Crear agente
    const agent = new ACPAgent(llmClient, agentDetail);
    logger.info('Agent created successfully', {
      agentName: agentDetail.name,
      agentVersion: agentDetail.version,
    });

    // Crear y iniciar servidor
    const server = new ACPServer(agent, serverConfig);
    await server.start();

    // Ejemplo de prueba automática (opcional)
    if (process.env.NODE_ENV !== 'production') {
      setTimeout(async () => {
        try {
          logger.info('Running automatic test', { environment: 'development' });
          const testResult = await agent.run({
            input: '¿Cuál es la capital de Francia?',
            type: 'question',
          });
          logger.info('Test completed successfully', {
            result: testResult.result,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Error desconocido';
          logError(
            logger,
            'Test execution failed',
            error instanceof Error ? error : new Error(errorMessage),
            { context: 'automatic-test' }
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
