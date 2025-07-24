// Legacy types - these are being replaced by ACP SDK types
// Keeping for backward compatibility during migration

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
