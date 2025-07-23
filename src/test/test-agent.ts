import axios, { AxiosResponse } from 'axios';
import type { ACPRequest, ACPResponse } from '../types/acp.js';
import type {
  AgentDetail,
  AgentHealthStatus,
  AgentCapabilitiesInfo,
} from '../types/agent.js';

const BASE_URL = 'http://localhost:3000/api/v1';

interface TestResult {
  name: string;
  success: boolean;
  result?: unknown;
  error?: string;
  duration: number;
}

async function runTest(
  testName: string,
  testFunction: () => Promise<unknown>
): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const result = await testFunction();
    return {
      name: testName,
      success: true,
      result,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return {
      name: testName,
      success: false,
      error: errorMessage,
      duration: Date.now() - startTime,
    };
  }
}

async function testAgent(): Promise<void> {
  console.log('🧪 Iniciando pruebas del agente ACP con TypeScript...\n');

  // Check if server is running
  try {
    await axios.get('http://localhost:3000/', { timeout: 2000 });
    console.log('✅ Server is running on http://localhost:3000\n');
  } catch (error) {
    console.log('❌ Server is not running on http://localhost:3000');
    console.log('📋 To run integration tests:');
    console.log('   1. Start LM Studio on http://localhost:1234');
    console.log('   2. Start the ACP server: bun run start');
    console.log('   3. Run integration tests: bun run test:integration\n');
    console.log('💡 Or use: bun run test:integration (auto-starts server)\n');
    throw new Error('Server not available');
  }

  const tests: TestResult[] = [];

  // Test 1: Health check
  tests.push(
    await runTest('Health Check', async () => {
      const response: AxiosResponse<AgentHealthStatus> = await axios.get(
        `${BASE_URL}/health`
      );
      if (response.data.status !== 'healthy') {
        throw new Error(`Estado no saludable: ${response.data.status}`);
      }
      return response.data;
    })
  );

  // Test 2: Obtener detalles del agente
  tests.push(
    await runTest('Agent Details', async () => {
      const response: AxiosResponse<AgentDetail> = await axios.get(
        `${BASE_URL}/agent`
      );
      if (!response.data.name || !response.data.version) {
        throw new Error('Detalles del agente incompletos');
      }
      return response.data;
    })
  );

  // Test 3: Obtener capacidades
  tests.push(
    await runTest('Agent Capabilities', async () => {
      const response: AxiosResponse<AgentCapabilitiesInfo> = await axios.get(
        `${BASE_URL}/capabilities`
      );
      if (
        !response.data.capabilities ||
        response.data.capabilities.length === 0
      ) {
        throw new Error('No se encontraron capacidades');
      }
      return response.data;
    })
  );

  // Test 4: Pregunta simple
  tests.push(
    await runTest('Simple Question', async () => {
      const request: ACPRequest = {
        input: '¿Cuál es la capital de España?',
        type: 'question',
      };
      const response: AxiosResponse<ACPResponse> = await axios.post(
        `${BASE_URL}/run`,
        request
      );
      if (response.data.status !== 'completed' || !response.data.result) {
        throw new Error('Respuesta incompleta o fallida');
      }
      return response.data;
    })
  );

  // Test 5: Asistencia con tarea
  tests.push(
    await runTest('Task Assistance', async () => {
      const request: ACPRequest = {
        input: 'Ayúdame a organizar mi día de trabajo',
        type: 'task',
        context: {
          maxTokens: 500,
        },
      };
      const response: AxiosResponse<ACPResponse> = await axios.post(
        `${BASE_URL}/run`,
        request
      );
      if (response.data.status !== 'completed' || !response.data.result) {
        throw new Error('Respuesta incompleta o fallida');
      }
      return response.data;
    })
  );

  // Test 6: Conversación
  tests.push(
    await runTest('Conversation', async () => {
      const request: ACPRequest = {
        type: 'conversation',
        messages: [
          { role: 'user', content: 'Hola, ¿cómo estás?' },
          {
            role: 'assistant',
            content: 'Hola! Estoy muy bien, gracias por preguntar.',
          },
          { role: 'user', content: '¿Puedes ayudarme con algo?' },
        ],
      };
      const response: AxiosResponse<ACPResponse> = await axios.post(
        `${BASE_URL}/run`,
        request
      );
      if (response.data.status !== 'completed' || !response.data.result) {
        throw new Error('Respuesta incompleta o fallida');
      }
      return response.data;
    })
  );

  // Test 7: Verificar estado de ejecución
  tests.push(
    await runTest('Run Status Check', async () => {
      // Primero ejecutar una tarea
      const request: ACPRequest = {
        input: 'Test para verificar estado',
        type: 'text-processing',
      };
      const runResponse: AxiosResponse<ACPResponse> = await axios.post(
        `${BASE_URL}/run`,
        request
      );

      // Luego verificar el estado
      const statusResponse = await axios.get(
        `${BASE_URL}/run/${runResponse.data.runId}`
      );
      if (
        !statusResponse.data.id ||
        statusResponse.data.status !== 'completed'
      ) {
        throw new Error('Estado de ejecución inválido');
      }
      return statusResponse.data;
    })
  );

  // Mostrar resultados
  console.log('\n📊 Resultados de las pruebas:\n');

  let successCount = 0;
  for (const test of tests) {
    const status = test.success ? '✅' : '❌';
    const duration = `${test.duration}ms`;
    console.log(`${status} ${test.name} (${duration})`);

    if (test.success) {
      successCount++;
      if (test.name === 'Simple Question' && test.result) {
        const result = test.result as ACPResponse;
        console.log(`   Respuesta: ${result.result?.substring(0, 100)}...`);
      }
    } else {
      console.log(`   Error: ${test.error}`);
    }
  }

  console.log(`\n📈 Resumen: ${successCount}/${tests.length} pruebas exitosas`);

  if (successCount === tests.length) {
    console.log('🎉 ¡Todas las pruebas completadas exitosamente!');
  } else {
    console.log('⚠️  Algunas pruebas fallaron. Revisa la configuración.');
    process.exit(1);
  }
}

// Ejecutar pruebas con manejo de errores
async function main(): Promise<void> {
  try {
    await testAgent();
  } catch (error) {
    console.error('❌ Error general en las pruebas:', error);
    if (axios.isAxiosError(error)) {
      console.error('Detalles del error HTTP:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }
    process.exit(1);
  }
}

// Ejecutar si es el archivo principal
if (import.meta.main) {
  main();
}
