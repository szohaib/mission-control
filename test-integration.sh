#!/bin/bash

echo "🚀 Mission Control Integration Test"
echo "=================================="

# Test 1: Backend health check
echo "📊 Test 1: Backend health check"
curl -s http://localhost:3001/health | jq .

# Test 2: Authentication
echo ""
echo "🔐 Test 2: Authentication"
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"admin123"}' | jq -r .token)

if [ "$TOKEN" != "null" ]; then
    echo "✅ Authentication successful"
    echo "📝 Token: ${TOKEN:0:50}..."
else
    echo "❌ Authentication failed"
    exit 1
fi

# Test 3: WebSocket connection
echo ""
echo "🔌 Test 3: WebSocket connection test"
echo "Using token: ${TOKEN:0:50}..."

# Create WebSocket test script
cat > /tmp/ws-test.js << 'EOF'
const WebSocket = require('ws');
const token = process.argv[2];

console.log('Connecting to WebSocket with token...');
const ws = new WebSocket(`ws://localhost:3001?token=${token}`);

ws.on('open', () => {
  console.log('✅ WebSocket connected successfully!');
  ws.send(JSON.stringify({ type: 'ping' }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log(`📨 Received: ${message.type}`);
  if (message.type === 'agent:status') {
    console.log(`📊 Agent data: ${JSON.stringify(message.data).substring(0, 100)}...`);
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
  process.exit(1);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 WebSocket closed: ${code} ${reason}`);
  process.exit(0);
});

// Close connection after 5 seconds
setTimeout(() => {
  ws.close();
}, 5000);
EOF

node /tmp/ws-test.js "$TOKEN"

# Cleanup
rm -f /tmp/ws-test.js

echo ""
echo "✅ All tests completed!"