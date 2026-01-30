/**
 * Mock Clawdbot CLI responses for Railway deployment
 * Since Railway can't access the local clawdbot CLI, we mock the responses
 */

const mockAgents = [
  {
    id: 'agent-main-001',
    label: 'main',
    status: 'running',
    model: 'claude-sonnet-4-5',
    created: Date.now() - 3600000,
    lastActivity: Date.now() - 300000
  },
  {
    id: 'agent-research-001',
    label: 'research-agent',
    status: 'idle',
    model: 'claude-sonnet-4',
    created: Date.now() - 7200000,
    lastActivity: Date.now() - 1800000
  },
  {
    id: 'agent-code-001',
    label: 'code-writer',
    status: 'running',
    model: 'claude-sonnet-4-5',
    created: Date.now() - 1800000,
    lastActivity: Date.now() - 60000
  }
];

const mockTranscripts = {
  'agent-main-001': [
    { role: 'user', content: 'Deploy the Mission Control dashboard', timestamp: Date.now() - 600000 },
    { role: 'assistant', content: 'Starting deployment process...', timestamp: Date.now() - 590000 }
  ],
  'agent-research-001': [
    { role: 'user', content: 'Research best practices for WebSocket scaling', timestamp: Date.now() - 3600000 }
  ],
  'agent-code-001': [
    { role: 'user', content: 'Fix the authentication middleware', timestamp: Date.now() - 120000 },
    { role: 'assistant', content: 'Analyzing the auth middleware...', timestamp: Date.now() - 110000 }
  ]
};

async function mockExecAsync(command) {
  // Mock clawdbot sessions list --json
  if (command.includes('sessions list')) {
    return { stdout: JSON.stringify(mockAgents) };
  }

  // Mock clawdbot sessions spawn
  if (command.includes('sessions spawn')) {
    const labelMatch = command.match(/--label "([^"]+)"/);
    const taskMatch = command.match(/--task "([^"]+)"/);
    const modelMatch = command.match(/--model (\S+)/);

    const newAgent = {
      id: `agent-${Date.now()}`,
      label: labelMatch ? labelMatch[1] : 'unnamed',
      status: 'running',
      model: modelMatch ? modelMatch[1] : 'claude-sonnet-4',
      created: Date.now(),
      lastActivity: Date.now()
    };

    mockAgents.push(newAgent);
    return { stdout: `Spawned agent ${newAgent.id}` };
  }

  // Mock clawdbot sessions kill
  if (command.includes('sessions kill')) {
    const idMatch = command.match(/sessions kill (\S+)/);
    if (idMatch) {
      const index = mockAgents.findIndex(a => a.id === idMatch[1]);
      if (index !== -1) {
        mockAgents.splice(index, 1);
      }
    }
    return { stdout: 'Agent killed' };
  }

  // Mock clawdbot sessions send
  if (command.includes('sessions send')) {
    return { stdout: 'Message sent' };
  }

  // Mock clawdbot sessions transcript
  if (command.includes('sessions transcript')) {
    const idMatch = command.match(/sessions transcript (\S+)/);
    const agentId = idMatch ? idMatch[1] : 'agent-main-001';
    const transcript = mockTranscripts[agentId] || [];
    return { stdout: JSON.stringify(transcript) };
  }

  return { stdout: '{}' };
}

module.exports = { mockExecAsync };
