const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database');
const { broadcastAgentStatus } = require('../websocket');
const { logActivity } = require('../utils/activity');
const { getGatewayClient } = require('../clawdbot-gateway-client');

const router = express.Router();

// Get Gateway client (connects to real Clawdbot or uses mock in fallback)
const gateway = getGatewayClient();

// Fallback to mock data if gateway unavailable
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
  console.log('✅ Using real Clawdbot Gateway API');
  useMock = false;
});

gateway.on('error', () => {
  if (!useMock) {
    console.log('⚠️  Gateway unavailable, using mock data');
    useMock = true;
  }
});

// Get all agents with status
router.get('/', async (req, res) => {
  try {
    let sessions;
    
    if (useMock || !gateway.connected) {
      sessions = mockAgents;
    } else {
      sessions = await gateway.listSessions();
    }

    // Enrich with metrics from database
    const db = getDatabase();
    const agents = sessions.map(session => {
      const metrics = db.prepare(`
        SELECT 
          SUM(tokens) as totalTokens,
          SUM(cost) as totalCost,
          SUM(runtime) as totalRuntime,
          SUM(tasksCompleted) as tasksCompleted
        FROM agent_metrics
        WHERE agentId = ?
      `).get(session.id);

      return {
        ...session,
        metrics: metrics || {
          totalTokens: 0,
          totalCost: 0,
          totalRuntime: 0,
          tasksCompleted: 0
        }
      };
    });

    res.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// Get single agent details
router.get('/:id', async (req, res) => {
  try {
    let agent;
    
    if (useMock || !gateway.connected) {
      agent = mockAgents.find(a => a.id === req.params.id);
    } else {
      agent = await gateway.getSession(req.params.id);
    }

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Get metrics
    const db = getDatabase();
    const metrics = db.prepare(`
      SELECT * FROM agent_metrics
      WHERE agentId = ?
      ORDER BY timestamp DESC
      LIMIT 100
    `).all(req.params.id);

    res.json({ ...agent, metricsHistory: metrics });
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({ error: 'Failed to fetch agent details' });
  }
});

// Spawn new agent
router.post('/spawn', async (req, res) => {
  try {
    const { label, task, model } = req.body;

    if (!label || !task) {
      return res.status(400).json({ error: 'Label and task required' });
    }

    let result;
    
    if (useMock || !gateway.connected) {
      result = {
        id: `agent-${Date.now()}`,
        label,
        status: 'running',
        model: model || 'claude-sonnet-4',
        created: Date.now(),
        lastActivity: Date.now()
      };
      mockAgents.push(result);
    } else {
      result = await gateway.spawnSession({
        label,
        task,
        model
      });
    }

    // Log activity
    logActivity({
      type: 'agent',
      actor: 'admin',
      action: 'spawned',
      targetType: 'agent',
      targetId: label,
      metadata: JSON.stringify({ task, model })
    });

    broadcastAgentStatus();

    res.json({ success: true, agent: result });
  } catch (error) {
    console.error('Error spawning agent:', error);
    res.status(500).json({ error: 'Failed to spawn agent' });
  }
});

// Kill agent
router.post('/:id/kill', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (useMock || !gateway.connected) {
      const index = mockAgents.findIndex(a => a.id === id);
      if (index !== -1) {
        mockAgents.splice(index, 1);
      }
    } else {
      await gateway.killSession(id);
    }

    // Log activity
    logActivity({
      type: 'agent',
      actor: 'admin',
      action: 'killed',
      targetType: 'agent',
      targetId: id
    });

    broadcastAgentStatus();

    res.json({ success: true });
  } catch (error) {
    console.error('Error killing agent:', error);
    res.status(500).json({ error: 'Failed to kill agent' });
  }
});

// Send message to agent
router.post('/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    if (useMock || !gateway.connected) {
      // Mock: just acknowledge
    } else {
      await gateway.sendMessage(id, message);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get agent transcript
router.get('/:id/transcript', async (req, res) => {
  try {
    const { id } = req.params;
    let transcript;
    
    if (useMock || !gateway.connected) {
      transcript = [];
    } else {
      transcript = await gateway.getTranscript(id);
    }

    res.json(transcript);
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({ error: 'Failed to fetch transcript' });
  }
});

// Record agent metrics
router.post('/:id/metrics', async (req, res) => {
  try {
    const { id } = req.params;
    const { tokens, cost, runtime, tasksCompleted } = req.body;

    const db = getDatabase();
    const metricId = uuidv4();

    db.prepare(`
      INSERT INTO agent_metrics (id, agentId, tokens, cost, runtime, tasksCompleted, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(metricId, id, tokens || 0, cost || 0, runtime || 0, tasksCompleted || 0, Date.now());

    res.json({ success: true, id: metricId });
  } catch (error) {
    console.error('Error recording metrics:', error);
    res.status(500).json({ error: 'Failed to record metrics' });
  }
});

module.exports = router;
