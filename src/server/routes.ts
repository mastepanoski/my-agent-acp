import express, { Request, Response, Router } from 'express';
import type { ACPAgent } from '../agent/agent.js';
import type { ACPRequest } from '../types/acp.js';
import { serverLogger, logError } from '../utils/logger.js';

export function createRoutes(agent: ACPAgent): Router {
  const router = express.Router();

  // Endpoint de salud
  router.get('/health', async (req: Request, res: Response): Promise<void> => {
    try {
      const health = await agent.checkHealth();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({
        status: 'error',
        error: errorMessage,
      });
    }
  });

  // Obtener detalles del agente
  router.get('/agent', (req: Request, res: Response): void => {
    res.json(agent.getAgentDetail());
  });

  // Obtener capacidades
  router.get('/capabilities', (req: Request, res: Response): void => {
    res.json(agent.getCapabilities());
  });

  // Ejecutar agente (modo síncrono)
  router.post('/run', async (req: Request, res: Response): Promise<void> => {
    const request: ACPRequest = req.body;
    try {
      // Validación básica
      if (!request.input && !request.message && !request.messages) {
        res.status(400).json({
          error:
            'Se requiere input, message o messages en el cuerpo de la solicitud',
        });
        return;
      }

      serverLogger.info(
        {
          request: {
            type: request.type,
            hasInput: !!request.input,
            hasMessages: !!request.messages,
            context: request.context,
          },
        },
        'New agent request received'
      );

      const result = await agent.run(request);
      res.json(result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      logError(serverLogger, 'Error in /run endpoint', error as Error, {
        requestType: request.type || 'unknown',
        hasInput: !!request.input,
      });
      res.status(500).json({
        error: 'Error interno del servidor',
        details: errorMessage,
      });
    }
  });

  // Obtener estado de ejecución
  router.get('/run/:runId', (req: Request, res: Response): void => {
    try {
      const runId = req.params.runId;
      const runStatus = agent.getRunStatus(runId);

      if (!runStatus) {
        res.status(404).json({
          error: 'Ejecución no encontrada',
        });
        return;
      }

      res.json(runStatus);
    } catch {
      res.status(500).json({
        error: 'Error interno del servidor',
      });
    }
  });

  // Ejecutar agente (modo streaming)
  router.post(
    '/run/stream',
    async (req: Request, res: Response): Promise<void> => {
      try {
        const request: ACPRequest = req.body;

        if (!request.input && !request.message) {
          res.status(400).json({
            error: 'Se requiere input o message para streaming',
          });
          return;
        }

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        });

        // Enviar evento de inicio
        res.write(
          `data: ${JSON.stringify({
            type: 'start',
            message: 'Iniciando procesamiento...',
          })}\n\n`
        );

        // Ejecutar y enviar resultado (simplificado para este ejemplo)
        const result = await agent.run(request);

        res.write(
          `data: ${JSON.stringify({
            type: 'result',
            data: result,
          })}\n\n`
        );

        res.write(
          `data: ${JSON.stringify({
            type: 'end',
          })}\n\n`
        );

        res.end();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error desconocido';
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            error: errorMessage,
          })}\n\n`
        );
        res.end();
      }
    }
  );

  return router;
}
