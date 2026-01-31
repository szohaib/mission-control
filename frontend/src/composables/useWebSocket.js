import { ref, onMounted, onUnmounted } from 'vue'

const ws = ref(null)
const connected = ref(false)
const agents = ref([])
const missions = ref({
  backlog: [],
  inProgress: [],
  review: [],
  done: []
})
const activityFeed = ref([])
const squadLeader = ref({
  name: 'Eva',
  status: 'active',
  tasksCompleted: 0,
  activeAgents: 0
})

let reconnectTimeout = null

export function useWebSocket() {
  const connect = (authToken = null) => {
    if (!authToken) {
      console.log('No auth token provided, using mock data for development')
      loadMockData()
      return
    }
    
    // Use correct port and include auth token
    const wsUrl = (import.meta.env.VITE_WS_URL || 'ws://localhost:3001') + '?token=' + authToken
    
    try {
      ws.value = new WebSocket(wsUrl)
      
      ws.value.onopen = () => {
        connected.value = true
        console.log('🚀 Mission Control: WebSocket connected')
        addActivity('System', 'WebSocket connection established', 'success')
      }
      
      ws.value.onmessage = (event) => {
        const data = JSON.parse(event.data)
        handleMessage(data)
      }
      
      ws.value.onerror = (error) => {
        console.error('WebSocket error:', error)
        addActivity('System', 'WebSocket error occurred', 'error')
        // Don't fall back to mock data on error - let user know there's a problem
      }
      
      ws.value.onclose = (event) => {
        connected.value = false
        console.log('WebSocket disconnected:', event.code, event.reason)
        
        if (event.code === 1008) {
          // Authentication error
          addActivity('System', 'WebSocket authentication failed', 'error')
        } else {
          addActivity('System', 'WebSocket disconnected, reconnecting...', 'warning')
          
          // Attempt to reconnect after 3 seconds (only if we have auth token)
          reconnectTimeout = setTimeout(() => {
            if (authToken) {
              connect(authToken)
            }
          }, 3000)
        }
      }
    } catch (error) {
      console.error('Failed to connect:', error)
      connected.value = false
      addActivity('System', 'WebSocket connection failed: ' + error.message, 'error')
    }
  }
  
  const handleMessage = (data) => {
    console.log('📨 Received WebSocket message:', data.type, data)
    
    switch (data.type) {
      case 'agent:status':
        // Replace all agents with new data
        agents.value = data.data || []
        break
      case 'task:update':
        updateMission(data.data)
        break
      case 'feed:activity':
        addActivity(data.data.source, data.data.message, data.data.level)
        break
      case 'error':
        addActivity('System', 'Error: ' + data.data.message, 'error')
        break
      default:
        console.log('Unknown message type:', data.type)
    }
  }
  
  const updateAgent = (agent) => {
    const index = agents.value.findIndex(a => a.id === agent.id)
    if (index !== -1) {
      agents.value[index] = { ...agents.value[index], ...agent }
    } else {
      agents.value.push(agent)
    }
  }
  
  const updateMission = (mission) => {
    const column = missions.value[mission.status]
    if (!column) return
    
    // Remove from all columns first
    Object.keys(missions.value).forEach(key => {
      missions.value[key] = missions.value[key].filter(m => m.id !== mission.id)
    })
    
    // Add to correct column
    column.push(mission)
  }
  
  const addActivity = (source, message, level = 'info') => {
    activityFeed.value.unshift({
      id: Date.now(),
      source,
      message,
      level,
      timestamp: new Date().toISOString()
    })
    
    // Keep only last 100 activities
    if (activityFeed.value.length > 100) {
      activityFeed.value = activityFeed.value.slice(0, 100)
    }
  }
  
  const sendMessage = (type, payload) => {
    if (ws.value && connected.value) {
      ws.value.send(JSON.stringify({ type, payload }))
    } else {
      console.warn('WebSocket not connected')
    }
  }
  
  const spawnAgent = (taskDescription) => {
    sendMessage('spawn_agent', { task: taskDescription })
    addActivity('User', `Spawning new agent: ${taskDescription}`, 'info')
  }
  
  const createMission = (mission) => {
    sendMessage('create_mission', mission)
    addActivity('User', `Created mission: ${mission.title}`, 'info')
  }
  
  const moveMission = (missionId, newStatus, comment = null) => {
    sendMessage('move_mission', { missionId, newStatus, comment })
  }
  
  const loadMockData = () => {
    // Mock agents for development
    agents.value = [
      {
        id: 'agent-1',
        name: 'Research Agent Alpha',
        status: 'working',
        task: 'Analyzing market trends for Q1 2024',
        tokens: 1247,
        cost: 0.0042,
        runtime: '00:05:23'
      },
      {
        id: 'agent-2',
        name: 'Code Agent Beta',
        status: 'working',
        task: 'Implementing authentication module',
        tokens: 3891,
        cost: 0.0128,
        runtime: '00:12:47'
      },
      {
        id: 'agent-3',
        name: 'Data Agent Gamma',
        status: 'standby',
        task: null,
        tokens: 0,
        cost: 0,
        runtime: '00:00:00'
      },
      {
        id: 'agent-4',
        name: 'Deploy Agent Delta',
        status: 'blocked',
        task: 'Waiting for API credentials',
        blockReason: 'Missing AWS_SECRET_KEY environment variable',
        tokens: 542,
        cost: 0.0018,
        runtime: '00:01:34'
      }
    ]
    
    // Mock missions
    missions.value = {
      backlog: [
        { id: 'm1', title: 'Implement user dashboard', description: 'Create responsive user dashboard with charts', priority: 'high' },
        { id: 'm2', title: 'Write API documentation', description: 'Document all REST endpoints', priority: 'medium' },
      ],
      inProgress: [
        { id: 'm3', title: 'Build authentication system', description: 'JWT-based auth with refresh tokens', priority: 'high', assignedTo: 'agent-2' },
        { id: 'm4', title: 'Market research report', description: 'Compile Q1 2024 market analysis', priority: 'medium', assignedTo: 'agent-1' },
      ],
      review: [
        { id: 'm5', title: 'Deploy to staging', description: 'Set up staging environment', priority: 'medium', comments: ['Need to verify SSL certificates'] },
      ],
      done: [
        { id: 'm6', title: 'Setup CI/CD pipeline', description: 'GitHub Actions workflow', priority: 'high' },
      ]
    }
    
    // Mock activity feed
    addActivity('Eva', 'Mission Control initialized', 'success')
    addActivity('Agent Alpha', 'Started market analysis task', 'info')
    addActivity('Agent Beta', 'Authentication module 60% complete', 'info')
    addActivity('Agent Delta', 'Blocked: Missing credentials', 'error')
  }
  
  onMounted(() => {
    connect()
  })
  
  onUnmounted(() => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
    }
    if (ws.value) {
      ws.value.close()
    }
  })
  
  return {
    connected,
    agents,
    missions,
    activityFeed,
    squadLeader,
    spawnAgent,
    createMission,
    moveMission,
    addActivity
  }
}
