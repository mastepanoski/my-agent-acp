#!/usr/bin/env bun
import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

console.log('🚀 Starting integration test suite...');

// Check if LM Studio is available
try {
  const response = await fetch('http://localhost:1234/v1/models');
  if (!response.ok) {
    throw new Error('LM Studio not available');
  }
  console.log('✅ LM Studio is running');
} catch (error) {
  console.log('❌ LM Studio is not running. Please start LM Studio first.');
  console.log('   Make sure it\'s running on http://localhost:1234');
  process.exit(1);
}

// Start the server
console.log('🔧 Starting ACP server...');
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
  
  // Try to ping the server
  try {
    const response = await fetch('http://localhost:3000/');
    if (response.ok) {
      serverReady = true;
      console.log('✅ Server is ready');
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

// Run integration tests
console.log('🧪 Running integration tests...');
const testProcess = spawn('bun', ['run', 'dist/test/test-agent.js'], {
  stdio: 'inherit'
});

// Handle test completion
testProcess.on('exit', (code) => {
  console.log(`\n🔧 Stopping server...`);
  serverProcess.kill();
  
  if (code === 0) {
    console.log('✅ Integration tests completed successfully');
  } else {
    console.log('❌ Integration tests failed');
  }
  
  process.exit(code);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping integration tests...');
  testProcess.kill();
  serverProcess.kill();
  process.exit(0);
});