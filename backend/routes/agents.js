const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database');
const { broadcastAgentStatus } = require('../websocket');
const { logActivity } = require('../utils/activity');
const { mockExecAsync } = require('../mock-clawdbot');

const realExecAsync = promisify(exec);
const router = express.Router();

// Use mock in production or when MOCK_CLAWDBOT is set
const USE_MOCK = process.env.NODE_ENV === 'production' || process.env.MOCK_CLAWDBOT === 'true';
const execAsync = USE_MOCK ? mockExecAsync : realExecAsync;

if (USE_MOCK) {
  console.log('⚠️  Using mock Clawdbot data (Railway deployment mode)');
}

// Get all agents with status
router.get('/', async (req, res) => {
  try {
    const { stdout } = await execAsync('clawdbot sessions list --json');
    const sessions = JSON.parse(stdout);

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
    const { stdout } = await execAsync(`clawdbot sessions list --json`);
    const sessions = JSON.parse(stdout);
    const agent = sessions.find(s => s.id === req.params.id);

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

    const modelFlag = model ? `--model ${model}` : '';
    const { stdout } = await execAsync(
      `clawdbot sessions spawn --label "${label}" ${modelFlag} --task "${task}"`
    );

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

    res.json({ success: true, output: stdout });
  } catch (error) {
    console.error('Error spawning agent:', error);
    res.status(500).json({ error: 'Failed to spawn agent' });
  }
});

// Kill agent
router.post('/:id/kill', async (req, res) => {
  try {
    const { id } = req.params;
    await execAsync(`clawdbot sessions kill ${id}`);

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

    await execAsync(`clawdbot sessions send ${id} "${message}"`);

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
    const { stdout } = await execAsync(`clawdbot sessions transcript ${id} --json`);
    const transcript = JSON.parse(stdout);

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
