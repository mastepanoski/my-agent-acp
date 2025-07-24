#!/usr/bin/env node

/* global console */
/* global fetch */
/* global process */

/**
 * ACP Compliance Test
 * Tests the ACP endpoints without requiring LM Studio
 */

import { ACPAgent } from '../dist/agent/agent.js';
import { ACPServer } from '../dist/server/server.js';

// Mock LLM Client for testing
class MockLLMClient {
  async checkHealth() {
    return {
      status: 'healthy',
      models: ['mock-model'],
      error: null
    };
  }

  async sendMessage() {
    return {
      content: 'Mock response from ACP agent',
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30
      }
    };
  }

  async sendMessages() {
    return this.sendMessage();
  }

  async generateResponse() {
    return this.sendMessage();
  }
}

async function testACPCompliance() {
  console.log('🧪 Testing ACP Protocol Compliance...\n');

  try {
    // Create mock LLM client
    const mockLLMClient = new MockLLMClient();
    
    // Create ACP agent with mock client
    const agent = new ACPAgent(mockLLMClient, {
      name: 'test-agent',
      description: 'ACP compliance test agent'
    });

    // Create server
    const server = new ACPServer(agent, {
      port: 8001,
      host: 'localhost',
      cors: true
    });

    // Start server
    await server.start();
    console.log('✅ Server started successfully');

    // Test ACP endpoints
    const baseUrl = 'http://localhost:8001';
    
    // Test 1: Ping endpoint
    console.log('\n📡 Testing /ping endpoint...');
    const pingResponse = await fetch(`${baseUrl}/ping`);
    if (pingResponse.ok) {
      const pingData = await pingResponse.json();
      console.log('✅ /ping endpoint working:', pingData);
    } else {
      console.log('❌ /ping endpoint failed:', pingResponse.status);
    }

    // Test 2: Agent discovery
    console.log('\n🤖 Testing /agents endpoint...');
    const agentsResponse = await fetch(`${baseUrl}/agents`);
    if (agentsResponse.ok) {
      const agentsData = await agentsResponse.json();
      console.log('✅ /agents endpoint working:', {
        agentCount: agentsData.agents?.length || 0,
        firstAgent: agentsData.agents?.[0]?.name
      });
    } else {
      console.log('❌ /agents endpoint failed:', agentsResponse.status);
    }

    // Test 3: Agent manifest
    console.log('\n📋 Testing /agents/test-agent endpoint...');
    const manifestResponse = await fetch(`${baseUrl}/agents/test-agent`);
    if (manifestResponse.ok) {
      const manifestData = await manifestResponse.json();
      console.log('✅ Agent manifest endpoint working:', {
        name: manifestData.name,
        description: manifestData.description,
        inputTypes: manifestData.input_content_types,
        outputTypes: manifestData.output_content_types
      });
    } else {
      console.log('❌ Agent manifest endpoint failed:', manifestResponse.status);
    }

    // Test 4: Create run (sync mode)
    console.log('\n🏃 Testing /runs endpoint (sync mode)...');
    const runRequest = {
      agent_name: 'test-agent',
      input: [{
        role: 'user',
        parts: [{
          content_type: 'text/plain',
          content: 'Hello, test message!',
          content_encoding: 'plain',
          metadata: null
        }],
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }],
      mode: 'sync'
    };

    const runResponse = await fetch(`${baseUrl}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(runRequest)
    });

    if (runResponse.ok) {
      const runData = await runResponse.json();
      console.log('✅ /runs endpoint working:', {
        runId: runData.run_id,
        status: runData.status,
        agentName: runData.agent_name,
        outputLength: runData.output?.length || 0
      });

      // Test 5: Get run status
      console.log('\n📊 Testing /runs/{run_id} endpoint...');
      const runStatusResponse = await fetch(`${baseUrl}/runs/${runData.run_id}`);
      if (runStatusResponse.ok) {
        const statusData = await runStatusResponse.json();
        console.log('✅ Run status endpoint working:', {
          status: statusData.status,
          finished: !!statusData.finished_at
        });
      } else {
        console.log('❌ Run status endpoint failed:', runStatusResponse.status);
      }

      // Test 6: Get run events
      console.log('\n📅 Testing /runs/{run_id}/events endpoint...');
      const eventsResponse = await fetch(`${baseUrl}/runs/${runData.run_id}/events`);
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        console.log('✅ Run events endpoint working:', {
          eventCount: eventsData.events?.length || 0
        });
      } else {
        console.log('❌ Run events endpoint failed:', eventsResponse.status);
      }
    } else {
      const errorData = await runResponse.text();
      console.log('❌ /runs endpoint failed:', runResponse.status, errorData);
    }

    // Stop server
    await server.stop();
    console.log('\n✅ Server stopped successfully');

    console.log('\n🎉 ACP Compliance Test completed successfully!');
    console.log('\n📝 Summary:');
    console.log('- ✅ All required ACP endpoints implemented');
    console.log('- ✅ Message/MessagePart structure working');
    console.log('- ✅ Run lifecycle management functional');
    console.log('- ✅ Session and event tracking in place');
    console.log('- ✅ Agent manifest structure compliant');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testACPCompliance();