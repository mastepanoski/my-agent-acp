import express, { Express, Request, Response, NextFunction } from 'express';
import { Server } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { createRoutes } from './routes.js';
import type { ACPAgent } from '../agent/agent.js';
import type { ACPServerConfig } from '../types/acp.js';
import { serverLogger, logRequest, logError } from '../utils/logger.js';

export class ACPServer {
  private agent: ACPAgent;
  private app: Express;
  private port: number;
  private host: string;
  private server?: Server;

  constructor(agent: ACPAgent, config: ACPServerConfig) {
    this.agent = agent;
    this.port = config.port;
    this.host = config.host;

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Seguridad básica
    this.app.use(helmet());

    // CORS
    this.app.use(cors());

    // Parsing JSON
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        logRequest(req.method, req.path, res.statusCode, duration, {
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        });
      });

      next();
    });
  }

  private setupRoutes(): void {
    // Rutas principales del agente
    this.app.use('/api/v1', createRoutes(this.agent));

    // Ruta raíz con información básica
    this.app.get('/', (req: Request, res: Response): void => {
      res.json({
        message: 'Servidor ACP activo',
        agent: this.agent.getAgentDetail().name,
        version: this.agent.getAgentDetail().version,
        endpoints: {
          health: '/api/v1/health',
          agent: '/api/v1/agent',
          capabilities: '/api/v1/capabilities',
          run: '/api/v1/run',
          stream: '/api/v1/run/stream',
        },
        timestamp: new Date().toISOString(),
      });
    });

    // Manejo de rutas no encontradas
    this.app.use('*', (req: Request, res: Response): void => {
      res.status(404).json({
        error: 'Endpoint no encontrado',
        path: req.originalUrl,
      });
    });

    // Manejo de errores globales
    this.app.use(
      (err: Error, req: Request, res: Response, _next: NextFunction): void => {
        logError(serverLogger, 'Unhandled server error', err, {
          method: req.method,
          path: req.path,
          ip: req.ip,
        });
        res.status(500).json({
          error: 'Error interno del servidor',
        });
      }
    );
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, this.host, (err?: Error) => {
        if (err) {
          logError(serverLogger, 'Failed to start server', err, {
            port: this.port,
            host: this.host,
          });
          reject(err);
        } else {
          serverLogger.info(
            {
              server: {
                host: this.host,
                port: this.port,
                url: `http://${this.host}:${this.port}`,
              },
            },
            'ACP Server started successfully'
          );
          resolve();
        }
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise(resolve => {
      if (this.server) {
        this.server.close(() => {
          serverLogger.info('ACP Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
