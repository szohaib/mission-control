#!/usr/bin/env node

/**
 * Test client for Mission Control Backend
 * Demonstrates API and WebSocket usage
 */

const WebSocket = require('ws');
const http = require('http');

const API_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

let authToken = null;

// Helper function for API requests
async function apiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testAuth() {
  console.log('\n🔐 Testing Authentication...');
  
  const response = await apiRequest('POST', '/api/auth/login', {
    password: 'admin123'
  });

  if (response.token) {
    authToken = response.token;
    console.log('✅ Login successful');
    console.log('   Token:', authToken.substring(0, 20) + '...');
  } else {
    console.error('❌ Login failed:', response);
    throw new Error('Authentication failed');
  }
}

async function testAgents() {
  console.log('\n🤖 Testing Agent Endpoints...');
  
  const agents = await apiRequest('GET', '/api/agents');
  console.log(`✅ Found ${agents.length} agents`);
  
  if (agents.length > 0) {
    console.log('   Sample agent:', agents[0].id);
  }
}

async function testTasks() {
  console.log('\n📋 Testing Task Endpoints...');
  
  // Create task
  const newTask = await apiRequest('POST', '/api/tasks', {
    title: 'Test Task from Client',
    description: 'This is a test task',
    status: 'todo',
    priority: 'high',
    tags: ['test', 'demo']
  });
  
  console.log('✅ Task created:', newTask.id);
  
  // Get all tasks
  const tasks = await apiRequest('GET', '/api/tasks');
  console.log(`✅ Found ${tasks.length} tasks`);
  
  // Add comment
  const comment = await apiRequest('POST', `/api/tasks/${newTask.id}/comment`, {
    content: 'This is a test comment',
    author: 'test-client'
  });
  
  console.log('✅ Comment added:', comment.id);
  
  // Update task
  const updated = await apiRequest('PUT', `/api/tasks/${newTask.id}`, {
    status: 'in-progress'
  });
  
  console.log('✅ Task updated to:', updated.status);
  
  return newTask.id;
}

async function testFeed() {
  console.log('\n📰 Testing Activity Feed...');
  
  const feed = await apiRequest('GET', '/api/feed?limit=10');
  console.log(`✅ Found ${feed.length} activities`);
  
  const stats = await apiRequest('GET', '/api/feed/stats');
  console.log('✅ Feed stats:', {
    total: stats.totalActivities,
    recent24h: stats.recent24h
  });
}

function testWebSocket() {
  return new Promise((resolve) => {
    console.log('\n🔌 Testing WebSocket Connection...');
    
    const ws = new WebSocket(WS_URL);
    let messagesReceived = 0;
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected');
      
      // Send ping
      ws.send(JSON.stringify({ type: 'ping' }));
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      messagesReceived++;
      
      console.log(`📨 Received: ${message.type}`);
      
      if (message.type === 'agent:status') {
        console.log(`   Agents: ${message.data.length}`);
      }
      
      // Close after receiving a few messages
      if (messagesReceived >= 3) {
        ws.close();
        resolve();
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      resolve();
    });
    
    ws.on('close', () => {
      console.log('✅ WebSocket closed');
      resolve();
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      resolve();
    }, 10000);
  });
}

async function runTests() {
  console.log('🚀 Mission Control Backend Test Suite\n');
  console.log('Testing API:', API_URL);
  console.log('Testing WebSocket:', WS_URL);
  
  try {
    await testAuth();
    await testAgents();
    await testTasks();
    await testFeed();
    await testWebSocket();
    
    console.log('\n✅ All tests completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = { apiRequest, testAuth, testAgents, testTasks, testFeed, testWebSocket };
