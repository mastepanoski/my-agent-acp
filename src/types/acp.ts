import { z } from 'zod';

// Esquemas de validación con Zod
export const ACPRequestSchema = z.object({
  input: z.string().optional(),
  message: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string(),
      })
    )
    .optional(),
  type: z
    .enum(['question', 'task', 'conversation', 'text-processing'])
    .optional(),
  context: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().min(1).max(8192).optional(),
      stream: z.boolean().optional(),
    })
    .optional(),
});

export const ACPResponseSchema = z.object({
  runId: z.string(),
  status: z.enum(['in_progress', 'completed', 'failed', 'awaiting']),
  result: z.string().optional(),
  error: z.string().optional(),
  metadata: z.object({
    duration: z.number(),
    usage: z
      .object({
        promptTokens: z.number().optional(),
        completionTokens: z.number().optional(),
        totalTokens: z.number().optional(),
      })
      .optional(),
    model: z.string().optional(),
  }),
});

// Tipos TypeScript derivados de los esquemas
export type ACPRequest = z.infer<typeof ACPRequestSchema>;
export type ACPResponse = z.infer<typeof ACPResponseSchema>;

export interface ACPRunHistory {
  id: string;
  status: 'in_progress' | 'completed' | 'failed' | 'awaiting';
  startTime: number;
  endTime?: number;
  request: ACPRequest;
  result?: unknown;
  error?: string;
  duration?: number;
}

export interface ACPServerConfig {
  port: number;
  host: string;
  cors?: boolean;
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
}
