import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type { ACPRequest, ACPResponse } from '../types/acp.js';
import type {
  AgentDetail,
  AgentHealthStatus,
  AgentCapabilitiesInfo,
} from '../types/agent.js';

export class ACPClient {
  private client: AxiosInstance;
  private serverUrl: string;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
    this.client = axios.create({
      baseURL: serverUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async discoverAgent(): Promise<AgentDetail> {
    try {
      const response: AxiosResponse<AgentDetail> =
        await this.client.get('/api/v1/agent');
      return response.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al descubrir agente: ${errorMessage}`);
    }
  }

  async runAgent(request: ACPRequest): Promise<ACPResponse> {
    try {
      const response: AxiosResponse<ACPResponse> = await this.client.post(
        '/api/v1/run',
        request
      );
      return response.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al ejecutar agente: ${errorMessage}`);
    }
  }

  async getRunStatus(runId: string): Promise<ACPResponse> {
    try {
      const response = await this.client.get(`/api/v1/run/${runId}`);
      return response.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener estado: ${errorMessage}`);
    }
  }

  async checkHealth(): Promise<AgentHealthStatus> {
    try {
      const response: AxiosResponse<AgentHealthStatus> =
        await this.client.get('/api/v1/health');
      return response.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al verificar salud: ${errorMessage}`);
    }
  }

  async getCapabilities(): Promise<AgentCapabilitiesInfo> {
    try {
      const response: AxiosResponse<AgentCapabilitiesInfo> =
        await this.client.get('/api/v1/capabilities');
      return response.data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error al obtener capacidades: ${errorMessage}`);
    }
  }

  // Método para streaming (ejemplo básico)
  async streamRun(
    request: ACPRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const response = await this.client.post('/api/v1/run/stream', request, {
        responseType: 'stream',
      });

      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'chunk' && data.content) {
                onChunk(data.content);
              }
            } catch {
              // Ignorar líneas que no son JSON válido
            }
          }
        }
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new Error(`Error en streaming: ${errorMessage}`);
    }
  }
}

// Ejemplo de uso
async function ejemploDeUso(): Promise<void> {
  const cliente = new ACPClient('http://localhost:3000');

  try {
    // Descubrir agente
    console.log('🔍 Descubriendo agente...');
    const agentInfo = await cliente.discoverAgent();
    console.log(
      `✅ Agente encontrado: ${agentInfo.name} v${agentInfo.version}`
    );
    console.log(`📝 Descripción: ${agentInfo.description}`);

    // Verificar salud
    const health = await cliente.checkHealth();
    console.log(`✅ Estado del agente: ${health.status}`);

    // Obtener capacidades
    const capabilities = await cliente.getCapabilities();
    console.log(`🛠️  Capacidades: ${capabilities.capabilities.join(', ')}`);

    // Ejecutar diferentes tipos de tareas
    const tareas: ACPRequest[] = [
      {
        input: '¿Qué es la inteligencia artificial?',
        type: 'question',
      },
      {
        input: 'Ayúdame a crear un plan de estudio para aprender TypeScript',
        type: 'task',
        context: {
          maxTokens: 1000,
          temperature: 0.7,
        },
      },
      {
        type: 'conversation',
        messages: [{ role: 'user', content: 'Hola, ¿cómo estás hoy?' }],
      },
    ];

    for (const [index, tarea] of tareas.entries()) {
      console.log(`\n📝 Ejecutando tarea ${index + 1}...`);
      const resultado = await cliente.runAgent(tarea);
      console.log(`✅ Estado: ${resultado.status}`);
      console.log(`📄 Resultado: ${resultado.result?.substring(0, 150)}...`);
      console.log(`⏱️  Duración: ${resultado.metadata.duration}ms`);

      // Verificar estado de la ejecución
      const estado = await cliente.getRunStatus(resultado.runId);
      console.log(`🔍 Estado verificado: ${estado.status}`);
    }

    console.log('\n🎉 ¡Ejemplo completado exitosamente!');
  } catch (error) {
    console.error('❌ Error en el ejemplo:', error);
    if (axios.isAxiosError(error)) {
      console.error('Detalles del error HTTP:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }
  }
}

// Ejecutar ejemplo si es el archivo principal
if (import.meta.main) {
  ejemploDeUso();
}

export { ejemploDeUso };
