export interface AgentDetail {
  name: string;
  version: string;
  description: string;
  author: string;
  capabilities: string[];
  metadata: {
    model: string;
    maxTokens: number;
    temperature: number;
    supportedLanguages: string[];
  };
  endpoints: {
    health: string;
    run: string;
    capabilities: string;
  };
}

export interface AgentCapabilitiesInfo {
  capabilities: string[];
  description: string;
  supportedModes: string[];
}

export interface AgentHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  agent: string;
  version: string;
  llm: {
    status: string;
    models?: string[];
    error?: string;
  };
  uptime: number;
  memory: NodeJS.MemoryUsage;
  error?: string;
}

export type RequestType =
  | 'question'
  | 'task'
  | 'conversation'
  | 'text-processing';
