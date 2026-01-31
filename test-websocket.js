const WebSocket = require('ws');

// Test token (you'll need to get this from the login API)
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njk4NTU3OTcsImV4cCI6MTc2OTk0MjE5N30.iSfgi5E8pmWTJxaYna7ALxInMEolw52U1FE-eGLxQiE';

console.log('Testing WebSocket connection with authentication...');

const ws = new WebSocket(`ws://localhost:3001?token=${token}`);

ws.on('open', () => {
  console.log('✅ WebSocket connected successfully!');
  ws.send(JSON.stringify({ type: 'ping' }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('📨 Received:', message);
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 WebSocket closed: ${code} ${reason}`);
});