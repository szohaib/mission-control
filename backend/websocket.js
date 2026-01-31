const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

let wss = null;
let agentStatusInterval = null;

function setupWebSocket(websocketServer) {
  wss = websocketServer;

  wss.on('connection', (ws, req) => {
    console.log('📡 WebSocket connection attempt');
    
    // Extract token from query parameter or header
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token') || req.headers.authorization?.substring(7);
    
    if (!token) {
      console.log('❌ WebSocket connection rejected: No token provided');
      ws.close(1008, 'Authentication required');
      return;
    }

    // Verify token
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
      const decoded = jwt.verify(token, JWT_SECRET);
      ws.user = decoded;
      console.log('✅ WebSocket client authenticated:', decoded.user);
    } catch (error) {
      console.log('❌ WebSocket connection rejected: Invalid token');
      ws.close(1008, 'Invalid authentication token');
      return;
    }

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        handleWebSocketMessage(ws, data);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('📡 WebSocket client disconnected');
    });

    // Send initial agent status
    broadcastAgentStatus();
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      data: { user: decoded.user, message: 'Mission Control WebSocket connected' },
      timestamp: Date.now()
    }));
  });

  // Poll agent status every 5 seconds
  agentStatusInterval = setInterval(() => {
    broadcastAgentStatus();
  }, 5000);

  console.log('✅ WebSocket server configured');
}

function handleWebSocketMessage(ws, data) {
  const { type, payload } = data;

  switch (type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
    
    case 'subscribe':
      // Could implement channel-based subscriptions here
      ws.send(JSON.stringify({ type: 'subscribed', channels: payload.channels }));
      break;

    default:
      console.log('Unknown WebSocket message type:', type);
  }
}

async function broadcastAgentStatus() {
  if (!wss) return;

  try {
    console.log('📡 Fetching agent status from clawdbot...');
    const { stdout } = await execAsync('clawdbot sessions list --json');
    const sessions = JSON.parse(stdout);
    
    console.log(`📊 Found ${sessions.length} active sessions`);

    const message = JSON.stringify({
      type: 'agent:status',
      data: sessions,
      timestamp: Date.now()
    });

    let sentCount = 0;
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
        sentCount++;
      }
    });
    
    console.log(`📡 Sent agent status to ${sentCount} connected clients`);
  } catch (error) {
    console.error('❌ Error broadcasting agent status:', error);
    
    // Send error message to connected clients
    const errorMessage = JSON.stringify({
      type: 'error',
      data: { message: 'Failed to fetch agent status', error: error.message },
      timestamp: Date.now()
    });
    
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(errorMessage);
      }
    });
  }
}

function broadcastTaskUpdate(task) {
  if (!wss) return;

  const message = JSON.stringify({
    type: 'task:update',
    data: task,
    timestamp: Date.now()
  });

  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

function broadcastActivity(activity) {
  if (!wss) return;

  const message = JSON.stringify({
    type: 'feed:activity',
    data: activity,
    timestamp: Date.now()
  });

  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

function cleanup() {
  if (agentStatusInterval) {
    clearInterval(agentStatusInterval);
  }
}

module.exports = {
  setupWebSocket,
  broadcastAgentStatus,
  broadcastTaskUpdate,
  broadcastActivity,
  cleanup
};
