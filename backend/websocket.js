const { getGatewayClient } = require('./clawdbot-gateway-client');

let wss = null;
let agentStatusInterval = null;
const gateway = getGatewayClient();

// Fallback mock data
let useMock = false;
const mockAgents = [
  {
    id: 'agent-main-001',
    label: 'main',
    status: 'running',
    model: 'claude-sonnet-4-5',
    created: Date.now() - 3600000,
    lastActivity: Date.now() - 300000
  }
];

gateway.on('connected', () => {
  console.log('✅ WebSocket using real Gateway');
  useMock = false;
  broadcastAgentStatus();
});

gateway.on('disconnected', () => {
  console.log('⚠️  Gateway disconnected, using mock data');
  useMock = true;
});

// Forward Gateway session updates to WebSocket clients
gateway.on('session:update', (data) => {
  broadcastAgentStatus();
});

function setupWebSocket(websocketServer) {
  wss = websocketServer;

  wss.on('connection', (ws) => {
    console.log('📡 WebSocket client connected');

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
      ws.send(JSON.stringify({ type: 'subscribed', channels: payload.channels }));
      break;

    default:
      console.log('Unknown WebSocket message type:', type);
  }
}

async function broadcastAgentStatus() {
  if (!wss) return;

  try {
    let sessions;
    
    if (useMock || !gateway.connected) {
      sessions = mockAgents;
    } else {
      sessions = await gateway.listSessions();
    }

    const message = JSON.stringify({
      type: 'agent:status',
      data: sessions,
      timestamp: Date.now()
    });

    wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  } catch (error) {
    console.error('Error broadcasting agent status:', error);
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
  
  if (gateway) {
    gateway.disconnect();
  }
}

module.exports = {
  setupWebSocket,
  broadcastAgentStatus,
  broadcastTaskUpdate,
  broadcastActivity,
  cleanup
};
