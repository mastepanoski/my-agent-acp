import express, { Request, Response, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { ACPAgent } from '../agent/agent.js';
import type {
  RunCreateRequest,
  RunResumeRequest,
  RunId,
  SessionId,
  AgentName,
} from '../types/acp.js';
import { serverLogger, logError } from '../utils/logger.js';

// Session management
const sessions = new Map<
  SessionId,
  {
    id: SessionId;
    runs: Map<RunId, unknown>;
    createdAt: Date;
    lastActivity: Date;
  }
>();

export function createRoutes(agent: ACPAgent): Router {
  const router = express.Router();

  // ACP: Ping endpoint
  router.get('/ping', (req: Request, res: Response): void => {
    res.json({});
  });

  // ACP: Agent Discovery - List all agents
  router.get('/agents', (req: Request, res: Response): void => {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    // For now, return single agent (in production, this would list all available agents)
    const agents = [agent.getAgentManifest()];
    const paginatedAgents = agents.slice(offset, offset + limit);

    res.json({
      agents: paginatedAgents,
    });
  });

  // ACP: Agent Manifest - Get specific agent details
  router.get('/agents/:name', (req: Request, res: Response): void => {
    const agentName = req.params.name as AgentName;
    const manifest = agent.getAgentManifest();

    if (manifest.name !== agentName) {
      res.status(404).json({
        code: 'not_found',
        message: `Agent '${agentName}' not found`,
        data: null,
      });
      return;
    }

    res.json(manifest);
  });

  // ACP: Create and start a new run
  router.post('/runs', async (req: Request, res: Response): Promise<void> => {
    try {
      const request: RunCreateRequest = req.body;

      // Validate required fields
      if (
        !request.agent_name ||
        !request.input ||
        !Array.isArray(request.input)
      ) {
        res.status(400).json({
          code: 'invalid_input',
          message: 'Missing required fields: agent_name and input are required',
          data: null,
        });
        return;
      }

      // Check if agent exists
      const manifest = agent.getAgentManifest();
      if (manifest.name !== request.agent_name) {
        res.status(404).json({
          code: 'not_found',
          message: `Agent '${request.agent_name}' not found`,
          data: null,
        });
        return;
      }

      const runId = uuidv4() as RunId;
      const sessionId = request.session_id || (uuidv4() as SessionId);
      const mode = request.mode || 'sync';

      // Ensure session exists
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
          id: sessionId,
          runs: new Map(),
          createdAt: new Date(),
          lastActivity: new Date(),
        });
      }

      serverLogger.info(
        {
          runId,
          sessionId,
          agentName: request.agent_name,
          mode,
          inputLength: request.input.length,
        },
        'Creating new run'
      );

      // Handle different modes
      if (mode === 'stream') {
        // Set up streaming response
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        });

        // Send run created event
        const createdRun = {
          agent_name: request.agent_name,
          session_id: sessionId,
          run_id: runId,
          status: 'created' as const,
          await_request: null,
          output: [],
          error: null,
          created_at: new Date().toISOString(),
          finished_at: null,
        };

        res.write(
          `data: ${JSON.stringify({
            type: 'run.created',
            run: createdRun,
          })}\n\n`
        );

        // Execute agent and stream results
        try {
          const result = await agent.runACP(request.input, runId, sessionId);

          // Send final completed event
          res.write(
            `data: ${JSON.stringify({
              type: 'run.completed',
              run: {
                ...createdRun,
                status: 'completed',
                output: result.output,
                finished_at: new Date().toISOString(),
              },
            })}\n\n`
          );

          res.end();
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          res.write(
            `data: ${JSON.stringify({
              type: 'run.failed',
              run: {
                ...createdRun,
                status: 'failed',
                error: {
                  code: 'server_error',
                  message: errorMessage,
                  data: null,
                },
                finished_at: new Date().toISOString(),
              },
            })}\n\n`
          );
          res.end();
        }
      } else {
        // Synchronous or asynchronous mode
        try {
          const result = await agent.runACP(request.input, runId, sessionId);

          if (mode === 'async') {
            // Return 202 for async
            res.status(202).json(result);
          } else {
            // Return 200 for sync
            res.json(result);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          res.status(500).json({
            code: 'server_error',
            message: errorMessage,
            data: null,
          });
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logError(serverLogger, 'Error in /runs endpoint', error as Error);
      res.status(500).json({
        code: 'server_error',
        message: errorMessage,
        data: null,
      });
    }
  });

  // ACP: Get run status
  router.get('/runs/:run_id', (req: Request, res: Response): void => {
    try {
      const runId = req.params.run_id as RunId;
      const run = agent.getRun(runId);

      if (!run) {
        res.status(404).json({
          code: 'not_found',
          message: `Run '${runId}' not found`,
          data: null,
        });
        return;
      }

      res.json(run);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        code: 'server_error',
        message: errorMessage,
        data: null,
      });
    }
  });

  // ACP: Resume a run
  router.post(
    '/runs/:run_id',
    async (req: Request, res: Response): Promise<void> => {
      try {
        const runId = req.params.run_id as RunId;
        const request: RunResumeRequest = req.body;

        // Note: run_id is not required in the request body according to ACP spec
        // We use the runId from the path parameter

        const run = agent.getRun(runId);
        if (!run) {
          res.status(404).json({
            code: 'not_found',
            message: `Run '${runId}' not found`,
            data: null,
          });
          return;
        }

        if (run.status !== 'awaiting') {
          res.status(400).json({
            code: 'invalid_input',
            message: `Run '${runId}' is not in awaiting state`,
            data: null,
          });
          return;
        }

        const result = await agent.resumeRun(runId, request.await_resume);

        if (request.mode === 'async') {
          res.status(202).json(result);
        } else {
          res.json(result);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logError(serverLogger, 'Error in resume run endpoint', error as Error);
        res.status(500).json({
          code: 'server_error',
          message: errorMessage,
          data: null,
        });
      }
    }
  );

  // ACP: Cancel a run
  router.post(
    '/runs/:run_id/cancel',
    async (req: Request, res: Response): Promise<void> => {
      try {
        const runId = req.params.run_id as RunId;
        const result = await agent.cancelRun(runId);

        if (!result) {
          res.status(404).json({
            code: 'not_found',
            message: `Run '${runId}' not found`,
            data: null,
          });
          return;
        }

        res.status(202).json(result);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logError(serverLogger, 'Error in cancel run endpoint', error as Error);
        res.status(500).json({
          code: 'server_error',
          message: errorMessage,
          data: null,
        });
      }
    }
  );

  // ACP: List run events
  router.get('/runs/:run_id/events', (req: Request, res: Response): void => {
    try {
      const runId = req.params.run_id as RunId;
      const events = agent.getRunEvents(runId);

      if (events === null) {
        res.status(404).json({
          code: 'not_found',
          message: `Run '${runId}' not found`,
          data: null,
        });
        return;
      }

      res.json({ events });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        code: 'server_error',
        message: errorMessage,
        data: null,
      });
    }
  });

  // ACP: Get session details
  router.get('/session/:session_id', (req: Request, res: Response): void => {
    try {
      const sessionId = req.params.session_id as SessionId;
      const session = sessions.get(sessionId);

      if (!session) {
        res.status(404).json({
          code: 'not_found',
          message: `Session '${sessionId}' not found`,
          data: null,
        });
        return;
      }

      res.json({
        id: session.id,
        history: [], // TODO: Implement proper history URLs
        state: null, // TODO: Implement session state URL
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        code: 'server_error',
        message: errorMessage,
        data: null,
      });
    }
  });

  return router;
}
