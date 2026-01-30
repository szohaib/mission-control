const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

let wss = null;
let agentStatusInterval = null;

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
    const { stdout } = await execAsync('clawdbot sessions list --json');
    const sessions = JSON.parse(stdout);

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
}

module.exports = {
  setupWebSocket,
  broadcastAgentStatus,
  broadcastTaskUpdate,
  broadcastActivity,
  cleanup
};
