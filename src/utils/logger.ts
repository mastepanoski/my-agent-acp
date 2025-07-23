import pino from 'pino';
// Runtime info detection
const getRuntimeInfo = () => ({
  runtime: typeof globalThis.Bun !== 'undefined' ? 'bun' : 'node',
  version:
    typeof globalThis.Bun !== 'undefined'
      ? globalThis.Bun.version
      : process.version,
  platform: process.platform,
  arch: process.arch,
});

// Configuración del logger basada en el entorno
const isDevelopment = process.env.NODE_ENV !== 'production';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

// Configuración de transporte para desarrollo (pretty print)
const transport = isDevelopment
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname',
        singleLine: false,
        levelFirst: true,
        messageFormat: '{msg}',
      },
    }
  : undefined;

// Crear el logger principal
const logger = pino({
  level: logLevel,
  transport,
  base: {
    // Información base que aparece en todos los logs
    service: 'acp-agent',
    version: process.env.npm_package_version || '1.0.0',
    runtime: getRuntimeInfo(),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label: string) => {
      return { level: label };
    },
  },
});

// Logger específico para diferentes componentes
export const createComponentLogger = (component: string) => {
  return logger.child({ component });
};

// Loggers predefinidos para diferentes componentes
export const serverLogger = createComponentLogger('server');
export const agentLogger = createComponentLogger('agent');
export const llmLogger = createComponentLogger('llm-client');
export const requestLogger = createComponentLogger('request');

// Logger principal exportado
export { logger };

// Tipos para mejorar la experiencia de desarrollo
export interface LogContext {
  [key: string]: unknown;
}

// Funciones de utilidad para logging común
export const logError = (
  logger: pino.Logger,
  message: string,
  error: Error,
  context?: LogContext
) => {
  logger.error(
    {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...context,
    },
    message
  );
};

export const logRequest = (
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  context?: LogContext
) => {
  requestLogger.info(
    {
      http: {
        method,
        path,
        statusCode,
        duration,
      },
      ...context,
    },
    `${method} ${path} - ${statusCode} (${duration}ms)`
  );
};

export const logAgentExecution = (
  runId: string,
  type: string,
  input: string,
  context?: LogContext
) => {
  agentLogger.info(
    {
      agent: {
        runId,
        type,
        input: input.substring(0, 100), // Limitar para no llenar los logs
      },
      ...context,
    },
    `Agent execution started: ${runId}`
  );
};

export const logAgentResult = (
  runId: string,
  success: boolean,
  duration: number,
  context?: LogContext
) => {
  const level = success ? 'info' : 'error';
  agentLogger[level](
    {
      agent: {
        runId,
        success,
        duration,
      },
      ...context,
    },
    `Agent execution ${success ? 'completed' : 'failed'}: ${runId} (${duration}ms)`
  );
};

export const logLLMRequest = (
  model: string,
  tokens: { prompt: number; completion?: number; total?: number },
  duration: number,
  context?: LogContext
) => {
  llmLogger.info(
    {
      llm: {
        model,
        tokens,
        duration,
      },
      ...context,
    },
    `LLM request completed: ${model} (${duration}ms)`
  );
};

// Función para cerrar el logger correctamente
export const closeLogger = () => {
  logger.flush();
};
