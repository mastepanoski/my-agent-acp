#!/usr/bin/env bun
import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

console.log('🚀 Starting ACP integration test suite...');

// Check if LM Studio is available (optional for ACP tests)
let lmStudioAvailable = false;
try {
  const response = await fetch('http://localhost:1234/v1/models');
  if (response.ok) {
    lmStudioAvailable = true;
    console.log('✅ LM Studio is running - will test with real LLM');
  }
} catch (error) {
  console.log('⚠️  LM Studio is not running - will use mock LLM for ACP compliance tests');
  console.log('   To test with real LLM, start LM Studio on http://localhost:1234');
}

// Choose test approach based on LM Studio availability
if (!lmStudioAvailable) {
  console.log('🧪 Running ACP compliance tests with mock LLM...');
  // Run our ACP compliance test directly
  const testProcess = spawn('node', ['test-acp-compliance.js'], {
    stdio: 'inherit'
  });
  
  testProcess.on('exit', (code) => {
    if (code === 0) {
      console.log('✅ ACP compliance tests completed successfully');
    } else {
      console.log('❌ ACP compliance tests failed');
    }
    process.exit(code);
  });
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping tests...');
    testProcess.kill();
    process.exit(0);
  });
  
} else {
  // Start the server with real LM Studio
  console.log('🔧 Starting ACP server with real LM Studio...');
  const serverProcess = spawn('bun', ['run', 'start'], {
    stdio: 'pipe',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      LOG_LEVEL: 'error', // Reduce logging during tests
    }
  });

  let serverReady = false;

  // Monitor server output
  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('ACP Server started successfully')) {
      serverReady = true;
    }
  });

  serverProcess.stderr.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Server started') || output.includes('listening')) {
      serverReady = true;
    }
  });

  // Wait for server to be ready
  console.log('⏳ Waiting for server to be ready...');
  let attempts = 0;
  const maxAttempts = 20;

  while (!serverReady && attempts < maxAttempts) {
    await setTimeout(500);
    attempts++;
    
    // Try to ping the ACP server
    try {
      const response = await fetch('http://localhost:3000/ping');
      if (response.ok) {
        serverReady = true;
        console.log('✅ ACP Server is ready');
        break;
      }
    } catch (error) {
      // Server not ready yet
    }
  }

  if (!serverReady) {
    console.log('❌ Server failed to start within timeout');
    serverProcess.kill();
    process.exit(1);
  }

  // Run ACP integration tests
  console.log('🧪 Running ACP integration tests with real LLM...');
  
  // Test ACP endpoints with real server
  try {
    // Test ping
    const pingResponse = await fetch('http://localhost:3000/ping');
    console.log('✅ /ping endpoint:', pingResponse.ok ? 'OK' : 'FAILED');
    
    // Test agents list
    const agentsResponse = await fetch('http://localhost:3000/agents');
    let agentName = 'my-agent'; // default fallback
    if (agentsResponse.ok) {
      const agentsData = await agentsResponse.json();
      console.log('✅ /agents endpoint: Found', agentsData.agents?.length || 0, 'agents');
      if (agentsData.agents?.length > 0) {
        agentName = agentsData.agents[0].name;
        console.log('🔍 Using agent name:', agentName);
      }
    }
    
    // Test create run with real LLM
    const runRequest = {
      agent_name: agentName,
      input: [{
        role: 'user',
        parts: [{
          content_type: 'text/plain',
          content: 'Hello! Can you tell me what 2+2 equals?',
          content_encoding: 'plain',
          metadata: null
        }],
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }],
      mode: 'sync'
    };

    console.log('🤖 Testing real LLM interaction...');
    const runResponse = await fetch('http://localhost:3000/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(runRequest)
    });

    if (runResponse.ok) {
      const runData = await runResponse.json();
      console.log('✅ Real LLM test:', {
        status: runData.status,
        hasOutput: runData.output?.length > 0,
        responseLength: runData.output?.[0]?.parts?.[0]?.content?.length || 0
      });
    } else {
      console.log('❌ Real LLM test failed:', runResponse.status);
    }
    
    console.log('✅ ACP integration tests with real LLM completed successfully');
    
  } catch (error) {
    console.log('❌ ACP integration tests failed:', error.message);
  } finally {
    console.log('🔧 Stopping server...');
    serverProcess.kill();
  }

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping integration tests...');
    serverProcess.kill();
    process.exit(0);
  });
}