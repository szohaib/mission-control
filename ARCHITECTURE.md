# Mission Control Dashboard - Technical Architecture

**Version:** 1.0  
**Last Updated:** 2025-01-20  
**Owner:** Eva (Main Agent)  
**User:** Zohaib

---

## 1. Executive Summary

Mission Control is a real-time orchestration dashboard for managing Eva's sub-agent ecosystem. It provides visibility into all active agents, a Kanban-style mission queue, live activity monitoring, and bi-directional control between Eva and Zohaib.

**Core Capabilities:**
- Real-time agent status tracking across all Clawdbot sessions
- Kanban mission queue with drag-drop task management
- Live activity feed with filtering and search
- Metrics dashboard (tokens, cost, runtime)
- Bi-directional control (both Eva and Zohaib can update state)
- Multi-session support (monitors all active Clawdbot sessions)

---

## 2. Technology Stack

### Frontend
- **Framework:** Vue.js 3 (Composition API)
- **UI Library:** Vuetify 3 / PrimeVue (Material Design components)
- **State Management:** Pinia
- **WebSocket Client:** Socket.io-client
- **HTTP Client:** Axios
- **Build Tool:** Vite
- **Charts:** Chart.js / Apache ECharts

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **WebSocket:** Socket.io
- **Database:** SQLite3 with better-sqlite3 driver
- **Auth:** JWT (jsonwebtoken)
- **File Watching:** chokidar
- **Process Monitoring:** Custom Clawdbot session parser
- **Logging:** Winston

### Infrastructure
- **Deployment:** Railway (recommended)
  - Single service deployment (frontend + backend)
  - Persistent volume for SQLite database
  - Environment variable management
  - Automatic HTTPS
- **Alternative:** GitHub Pages (frontend) + Railway (backend only)
  - More complex CORS configuration
  - Separate deployments

### Development
- **TypeScript:** Full stack (Vue 3 + Express)
- **Linting:** ESLint + Prettier
- **Testing:** Vitest (frontend), Jest (backend)
- **Git Hooks:** Husky + lint-staged

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mission Control Dashboard                │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Agent Status │  │    Kanban    │  │ Activity Feed│      │
│  │    Board     │  │    Queue     │  │   & Metrics  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│                    Vue.js Frontend (Vite)                     │
└───────────────────────┬──────────────────────────────────────┘
                        │ WebSocket (Socket.io)
                        │ REST API (Axios)
                        │
┌───────────────────────┴──────────────────────────────────────┐
│                      Backend Server (Express)                 │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   WebSocket  │  │   REST API   │  │     Auth     │      │
│  │    Server    │  │   Endpoints  │  │  (JWT)       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Session    │  │   Database   │  │   Gateway    │      │
│  │   Monitor    │  │   (SQLite)   │  │   API Client │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        │ File System Monitoring
                        │ Gateway API Calls
                        │
┌───────────────────────┴──────────────────────────────────────┐
│                    Clawdbot Environment                       │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Session    │  │   Gateway    │  │   Process    │      │
│  │    Files     │  │     API      │  │    Logs      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

**Agent Status Updates:**
```
Clawdbot Session → Session Files → File Watcher → Parse & Analyze 
  → Update DB → WebSocket Broadcast → Frontend UI Update
```

**Task Management (User Action):**
```
User Action → Frontend → REST API → Validate → Update DB 
  → WebSocket Broadcast → All Connected Clients Update
```

**Eva Control (Agent Action):**
```
Eva (main agent) → REST API Call → Authenticate → Update DB 
  → WebSocket Broadcast → UI Updates → Zohaib sees changes
```

**Live Activity Feed:**
```
Clawdbot Logs → Log Parser → Extract Events → Store in DB 
  → WebSocket Stream → Frontend Live Feed
```

---

## 4. Directory Structure

```
mission-control/
├── ARCHITECTURE.md              # This file
├── README.md                    # Project overview and setup
├── .env.example                 # Environment variables template
├── .gitignore
├── package.json                 # Root package.json (workspaces)
│
├── frontend/                    # Vue.js application
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   ├── public/
│   │   └── favicon.ico
│   └── src/
│       ├── main.ts
│       ├── App.vue
│       ├── router/
│       │   └── index.ts
│       ├── stores/              # Pinia stores
│       │   ├── agents.ts
│       │   ├── tasks.ts
│       │   ├── activity.ts
│       │   └── auth.ts
│       ├── components/
│       │   ├── AgentStatusBoard.vue
│       │   ├── AgentCard.vue
│       │   ├── KanbanBoard.vue
│       │   ├── KanbanColumn.vue
│       │   ├── TaskCard.vue
│       │   ├── ActivityFeed.vue
│       │   ├── MetricsDashboard.vue
│       │   └── LoginForm.vue
│       ├── views/
│       │   ├── Dashboard.vue
│       │   └── Login.vue
│       ├── services/
│       │   ├── api.ts           # Axios instance
│       │   ├── websocket.ts     # Socket.io client
│       │   └── auth.ts
│       ├── types/
│       │   └── index.ts         # Shared TypeScript types
│       └── assets/
│           └── styles/
│               └── main.css
│
├── backend/                     # Express API server
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts             # Entry point
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   └── environment.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── logging.ts
│   │   ├── routes/
│   │   │   ├── agents.ts
│   │   │   ├── tasks.ts
│   │   │   ├── activity.ts
│   │   │   ├── metrics.ts
│   │   │   └── auth.ts
│   │   ├── services/
│   │   │   ├── sessionMonitor.ts    # Watches Clawdbot sessions
│   │   │   ├── gatewayClient.ts     # Clawdbot Gateway API
│   │   │   ├── logParser.ts         # Parse activity logs
│   │   │   └── metricsCalculator.ts
│   │   ├── models/              # Database models
│   │   │   ├── Agent.ts
│   │   │   ├── Task.ts
│   │   │   ├── Activity.ts
│   │   │   └── Metric.ts
│   │   ├── websocket/
│   │   │   └── server.ts        # Socket.io setup & handlers
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── utils/
│   │       ├── logger.ts
│   │       └── jwt.ts
│   └── database/
│       ├── schema.sql            # SQLite schema
│       └── migrations/
│           └── 001_initial.sql
│
├── shared/                      # Shared types between frontend/backend
│   └── types.ts
│
└── deployment/
    ├── railway.json             # Railway configuration
    ├── Dockerfile               # Multi-stage build
    └── nginx.conf               # Optional: if using nginx
```

---

## 5. Database Schema

### 5.1 SQLite Schema

```sql
-- schema.sql

-- Agents table (tracks all sub-agents and Eva)
CREATE TABLE agents (
    id TEXT PRIMARY KEY,              -- session ID or custom ID
    name TEXT NOT NULL,               -- agent name (e.g., "eva-main", "subagent-xyz")
    type TEXT NOT NULL,               -- "main" | "subagent" | "cron"
    status TEXT NOT NULL,             -- "working" | "standby" | "blocked" | "completed" | "error"
    current_task_id INTEGER,          -- FK to tasks table
    session_id TEXT,                  -- Clawdbot session ID
    started_at INTEGER NOT NULL,      -- Unix timestamp
    last_active INTEGER NOT NULL,     -- Unix timestamp
    metadata TEXT,                    -- JSON: { model, thinking_level, labels, etc. }
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    
    FOREIGN KEY (current_task_id) REFERENCES tasks(id)
);

CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_type ON agents(type);
CREATE INDEX idx_agents_last_active ON agents(last_active);

-- Tasks table (Kanban missions)
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,             -- "backlog" | "todo" | "in_progress" | "blocked" | "done"
    priority TEXT NOT NULL,           -- "low" | "medium" | "high" | "urgent"
    assigned_agent_id TEXT,           -- FK to agents table
    created_by TEXT NOT NULL,         -- "eva" | "zohaib"
    position INTEGER NOT NULL,        -- For ordering within columns
    estimated_tokens INTEGER,
    actual_tokens INTEGER,
    estimated_duration INTEGER,       -- seconds
    actual_duration INTEGER,          -- seconds
    tags TEXT,                        -- JSON array: ["coding", "research"]
    metadata TEXT,                    -- JSON: { repo, files, dependencies, etc. }
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    completed_at INTEGER,
    
    FOREIGN KEY (assigned_agent_id) REFERENCES agents(id)
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_assigned_agent ON tasks(assigned_agent_id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

-- Task comments/history
CREATE TABLE task_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    author TEXT NOT NULL,             -- "eva" | "zohaib" | agent_id
    content TEXT NOT NULL,
    type TEXT NOT NULL,               -- "comment" | "status_change" | "assignment" | "sent_back"
    metadata TEXT,                    -- JSON for structured data
    created_at INTEGER NOT NULL,
    
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_task_comments_task ON task_comments(task_id);
CREATE INDEX idx_task_comments_created_at ON task_comments(created_at);

-- Activity feed (high-level updates)
CREATE TABLE activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,               -- "agent_spawn" | "agent_complete" | "task_create" | "task_update" | "error" | "milestone"
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL,           -- "info" | "warning" | "error" | "success"
    agent_id TEXT,
    task_id INTEGER,
    metadata TEXT,                    -- JSON: additional context
    created_at INTEGER NOT NULL,
    
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_severity ON activities(severity);
CREATE INDEX idx_activities_agent ON activities(agent_id);
CREATE INDEX idx_activities_created_at ON activities(created_at);

-- Metrics table (aggregated statistics)
CREATE TABLE metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT,
    task_id INTEGER,
    metric_type TEXT NOT NULL,        -- "tokens" | "cost" | "runtime" | "errors"
    value REAL NOT NULL,
    unit TEXT,                        -- "tokens" | "usd" | "seconds" | "count"
    metadata TEXT,                    -- JSON: breakdown, model info, etc.
    timestamp INTEGER NOT NULL,
    
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE INDEX idx_metrics_agent ON metrics(agent_id);
CREATE INDEX idx_metrics_task ON metrics(task_id);
CREATE INDEX idx_metrics_type ON metrics(metric_type);
CREATE INDEX idx_metrics_timestamp ON metrics(timestamp);

-- User preferences (single user, but extensible)
CREATE TABLE user_preferences (
    user_id TEXT PRIMARY KEY,
    preferences TEXT NOT NULL,        -- JSON: { theme, notifications, filters, etc. }
    updated_at INTEGER NOT NULL
);

-- Session tokens (for auth)
CREATE TABLE sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

### 5.2 Data Models (TypeScript)

```typescript
// shared/types.ts

export type AgentType = 'main' | 'subagent' | 'cron';
export type AgentStatus = 'working' | 'standby' | 'blocked' | 'completed' | 'error';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  currentTaskId?: number;
  sessionId?: string;
  startedAt: number;
  lastActive: number;
  metadata?: {
    model?: string;
    thinkingLevel?: string;
    label?: string;
    spawner?: string;
    [key: string]: any;
  };
  createdAt: number;
  updatedAt: number;
}

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedAgentId?: string;
  createdBy: 'eva' | 'zohaib';
  position: number;
  estimatedTokens?: number;
  actualTokens?: number;
  estimatedDuration?: number;
  actualDuration?: number;
  tags?: string[];
  metadata?: {
    repo?: string;
    files?: string[];
    dependencies?: string[];
    [key: string]: any;
  };
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export type CommentType = 'comment' | 'status_change' | 'assignment' | 'sent_back';

export interface TaskComment {
  id: number;
  taskId: number;
  author: string;
  content: string;
  type: CommentType;
  metadata?: any;
  createdAt: number;
}

export type ActivityType = 
  | 'agent_spawn' 
  | 'agent_complete' 
  | 'task_create' 
  | 'task_update' 
  | 'error' 
  | 'milestone';

export type ActivitySeverity = 'info' | 'warning' | 'error' | 'success';

export interface Activity {
  id: number;
  type: ActivityType;
  title: string;
  description?: string;
  severity: ActivitySeverity;
  agentId?: string;
  taskId?: number;
  metadata?: any;
  createdAt: number;
}

export type MetricType = 'tokens' | 'cost' | 'runtime' | 'errors';

export interface Metric {
  id: number;
  agentId?: string;
  taskId?: number;
  metricType: MetricType;
  value: number;
  unit?: string;
  metadata?: any;
  timestamp: number;
}

export interface UserPreferences {
  userId: string;
  preferences: {
    theme?: 'light' | 'dark';
    notifications?: boolean;
    filters?: {
      agents?: AgentType[];
      activities?: ActivityType[];
    };
    [key: string]: any;
  };
  updatedAt: number;
}
```

---

## 6. WebSocket Event Specification

### 6.1 Connection & Authentication

```typescript
// Client connects
socket.on('connect', () => {
  socket.emit('authenticate', { token: 'JWT_TOKEN' });
});

// Server response
socket.on('authenticated', (data: { userId: string }) => {
  // Connection authenticated
});

socket.on('unauthorized', (error: { message: string }) => {
  // Redirect to login
});
```

### 6.2 Event Types

**Agent Events:**
```typescript
// Server → Client
interface AgentSpawnedEvent {
  type: 'agent:spawned';
  agent: Agent;
}

interface AgentStatusChangedEvent {
  type: 'agent:status_changed';
  agentId: string;
  oldStatus: AgentStatus;
  newStatus: AgentStatus;
  timestamp: number;
}

interface AgentCompletedEvent {
  type: 'agent:completed';
  agentId: string;
  taskId?: number;
  result?: any;
  timestamp: number;
}

interface AgentErrorEvent {
  type: 'agent:error';
  agentId: string;
  error: string;
  timestamp: number;
}
```

**Task Events:**
```typescript
// Server → Client & Client → Server
interface TaskCreatedEvent {
  type: 'task:created';
  task: Task;
}

interface TaskUpdatedEvent {
  type: 'task:updated';
  taskId: number;
  changes: Partial<Task>;
  updatedBy: 'eva' | 'zohaib';
}

interface TaskMovedEvent {
  type: 'task:moved';
  taskId: number;
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
  newPosition: number;
}

interface TaskAssignedEvent {
  type: 'task:assigned';
  taskId: number;
  agentId: string;
  assignedBy: 'eva' | 'zohaib';
}

interface TaskCommentAddedEvent {
  type: 'task:comment_added';
  comment: TaskComment;
}
```

**Activity Events:**
```typescript
// Server → Client (live feed)
interface ActivityCreatedEvent {
  type: 'activity:created';
  activity: Activity;
}
```

**Metrics Events:**
```typescript
// Server → Client
interface MetricsUpdatedEvent {
  type: 'metrics:updated';
  metrics: {
    totalTokens: number;
    totalCost: number;
    activeAgents: number;
    completedTasks: number;
    avgTaskDuration: number;
  };
}
```

### 6.3 Client → Server Commands

```typescript
// Request full state sync
socket.emit('sync:request', {
  entities: ['agents', 'tasks', 'activities', 'metrics']
});

// Response
socket.on('sync:response', (data: {
  agents: Agent[];
  tasks: Task[];
  activities: Activity[];
  metrics: any;
}) => {
  // Update local state
});

// Subscribe to specific channels
socket.emit('subscribe', {
  channels: ['agents', 'tasks', 'activities']
});

// Unsubscribe
socket.emit('unsubscribe', {
  channels: ['activities']
});
```

### 6.4 WebSocket Server Implementation

```typescript
// backend/src/websocket/server.ts

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from '../utils/jwt';

export function setupWebSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    
    try {
      const decoded = await verifyToken(token);
      socket.data.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    // Send initial state
    socket.emit('authenticated', { userId: socket.data.userId });
    
    // Handle sync requests
    socket.on('sync:request', async (data) => {
      const state = await getFullState(data.entities);
      socket.emit('sync:response', state);
    });
    
    // Handle subscription management
    socket.on('subscribe', (data) => {
      data.channels.forEach((channel: string) => {
        socket.join(channel);
      });
    });
    
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

// Broadcast helper
export function broadcast(io: SocketIOServer, event: string, data: any, room?: string) {
  if (room) {
    io.to(room).emit(event, data);
  } else {
    io.emit(event, data);
  }
}
```

---

## 7. REST API Endpoints

### 7.1 Authentication

```
POST   /api/auth/login
  Body: { username: string, password: string }
  Response: { token: string, expiresAt: number }

POST   /api/auth/logout
  Headers: Authorization: Bearer <token>
  Response: { success: boolean }

GET    /api/auth/verify
  Headers: Authorization: Bearer <token>
  Response: { valid: boolean, userId: string }
```

### 7.2 Agents

```
GET    /api/agents
  Query: ?status=working&type=subagent
  Response: { agents: Agent[] }

GET    /api/agents/:id
  Response: { agent: Agent }

GET    /api/agents/:id/history
  Response: { history: Activity[] }

PATCH  /api/agents/:id
  Body: { status?: AgentStatus }
  Response: { agent: Agent }
```

### 7.3 Tasks (Kanban)

```
GET    /api/tasks
  Query: ?status=in_progress&assignedAgent=xyz
  Response: { tasks: Task[] }

POST   /api/tasks
  Body: Task (without id)
  Response: { task: Task }

GET    /api/tasks/:id
  Response: { task: Task, comments: TaskComment[] }

PATCH  /api/tasks/:id
  Body: Partial<Task>
  Response: { task: Task }

DELETE /api/tasks/:id
  Response: { success: boolean }

POST   /api/tasks/:id/move
  Body: { toStatus: TaskStatus, position: number }
  Response: { task: Task }

POST   /api/tasks/:id/assign
  Body: { agentId: string }
  Response: { task: Task }

POST   /api/tasks/:id/comments
  Body: { content: string, type: CommentType }
  Response: { comment: TaskComment }

POST   /api/tasks/:id/send-back
  Body: { reason: string }
  Response: { task: Task, comment: TaskComment }
```

### 7.4 Activities

```
GET    /api/activities
  Query: ?type=agent_spawn&severity=error&limit=50&offset=0
  Response: { activities: Activity[], total: number }

POST   /api/activities
  Body: Activity (without id)
  Response: { activity: Activity }
```

### 7.5 Metrics

```
GET    /api/metrics/summary
  Query: ?period=24h&agentId=xyz
  Response: {
    totalTokens: number,
    totalCost: number,
    activeAgents: number,
    completedTasks: number,
    avgTaskDuration: number,
    costBreakdown: { [model: string]: number }
  }

GET    /api/metrics/timeseries
  Query: ?metric=tokens&interval=1h&start=timestamp&end=timestamp
  Response: { dataPoints: Array<{ timestamp: number, value: number }> }

GET    /api/metrics/agents/:id
  Response: { metrics: Metric[] }

GET    /api/metrics/tasks/:id
  Response: { metrics: Metric[] }
```

### 7.6 User Preferences

```
GET    /api/preferences
  Response: { preferences: UserPreferences }

PATCH  /api/preferences
  Body: { preferences: Partial<UserPreferences['preferences']> }
  Response: { preferences: UserPreferences }
```

### 7.7 System

```
GET    /api/health
  Response: { status: 'ok', uptime: number, dbConnected: boolean }

GET    /api/sessions
  Response: { sessions: Array<{ id: string, type: string, active: boolean }> }
```

---

## 8. Session Monitoring Strategy

### 8.1 Clawdbot Session Discovery

The backend monitors Clawdbot sessions through multiple sources:

**Primary Sources:**
1. **Clawdbot Gateway API** (if available)
   - `/api/sessions` endpoint
   - Real-time session status
   
2. **File System Monitoring**
   - Watch `~/.clawdbot/sessions/` directory
   - Parse session metadata files
   - Monitor activity logs

3. **Process Monitoring** (optional)
   - Parse `ps aux | grep clawdbot` output
   - Track running agent processes

### 8.2 Session Monitor Service

```typescript
// backend/src/services/sessionMonitor.ts

import chokidar from 'chokidar';
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';

export class SessionMonitor extends EventEmitter {
  private watcher: chokidar.FSWatcher | null = null;
  private sessions: Map<string, Agent> = new Map();
  
  constructor(private sessionDir: string) {
    super();
  }
  
  async start() {
    // Watch session directory
    this.watcher = chokidar.watch(this.sessionDir, {
      persistent: true,
      ignoreInitial: false,
      depth: 2
    });
    
    this.watcher.on('add', (filePath) => this.handleFileChange(filePath));
    this.watcher.on('change', (filePath) => this.handleFileChange(filePath));
    this.watcher.on('unlink', (filePath) => this.handleFileRemove(filePath));
    
    // Initial scan
    await this.scanExistingSessions();
  }
  
  private async handleFileChange(filePath: string) {
    if (filePath.endsWith('session.json')) {
      const session = await this.parseSessionFile(filePath);
      this.emit('session:updated', session);
    }
  }
  
  private async parseSessionFile(filePath: string): Promise<Agent> {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    return {
      id: data.id,
      name: data.label || data.id,
      type: data.type || 'subagent',
      status: this.inferStatus(data),
      sessionId: data.id,
      startedAt: data.startedAt,
      lastActive: data.lastActive || Date.now(),
      metadata: {
        model: data.model,
        thinkingLevel: data.thinkingLevel,
        spawner: data.spawner
      },
      createdAt: data.createdAt || data.startedAt,
      updatedAt: Date.now()
    };
  }
  
  private inferStatus(sessionData: any): AgentStatus {
    const now = Date.now();
    const lastActive = sessionData.lastActive || 0;
    const inactiveDuration = now - lastActive;
    
    if (sessionData.completed) return 'completed';
    if (sessionData.error) return 'error';
    if (inactiveDuration > 5 * 60 * 1000) return 'standby'; // 5 min
    return 'working';
  }
  
  async stop() {
    if (this.watcher) {
      await this.watcher.close();
    }
  }
}
```

### 8.3 Gateway API Integration

```typescript
// backend/src/services/gatewayClient.ts

import axios from 'axios';

export class GatewayClient {
  private baseURL: string;
  private apiKey?: string;
  
  constructor(baseURL: string, apiKey?: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }
  
  async getSessions(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseURL}/api/sessions`, {
        headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}
      });
      return response.data.sessions || [];
    } catch (error) {
      console.error('Failed to fetch sessions from Gateway:', error);
      return [];
    }
  }
  
  async getSessionDetails(sessionId: string): Promise<any> {
    const response = await axios.get(`${this.baseURL}/api/sessions/${sessionId}`);
    return response.data;
  }
  
  async sendCommand(sessionId: string, command: string): Promise<any> {
    const response = await axios.post(`${this.baseURL}/api/sessions/${sessionId}/command`, {
      command
    });
    return response.data;
  }
}
```

---

## 9. Deployment Strategy

### 9.1 Railway Deployment (Recommended)

**Advantages:**
- Single deployment for frontend + backend
- Persistent storage for SQLite
- Automatic HTTPS
- Environment variable management
- GitHub integration for auto-deploy
- WebSocket support out of the box

**Project Structure:**
```
mission-control/
├── Dockerfile               # Multi-stage build
├── railway.json             # Railway config
├── backend/                 # Express + Socket.io
├── frontend/                # Vue.js (built to static)
└── package.json             # Root workspace
```

**Dockerfile (Multi-stage):**
```dockerfile
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Stage 3: Production
FROM node:20-alpine
WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package.json ./backend/

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy database schema
COPY backend/database ./backend/database

# Expose port
EXPOSE 3000

# Start server (serves both API and static frontend)
CMD ["node", "backend/dist/index.js"]
```

**railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Environment Variables (Railway):**
```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=<random-secret>
DATABASE_PATH=/app/data/mission-control.db
CLAWDBOT_SESSION_DIR=/home/wakemateclub/.clawdbot/sessions
CLAWDBOT_GATEWAY_URL=http://localhost:3021
ADMIN_USERNAME=zohaib
ADMIN_PASSWORD_HASH=<bcrypt-hash>
```

**Persistent Volume:**
- Mount `/app/data` for SQLite database
- Railway: Settings → Volumes → Add Volume → `/app/data`

### 9.2 Alternative: GitHub Pages + Railway Backend

**Frontend (GitHub Pages):**
- Build Vue.js app to static files
- Deploy to `gh-pages` branch
- Use GitHub Actions for auto-deploy
- CORS configured on backend

**Backend (Railway):**
- Same as above, but only API server
- Add CORS middleware for GitHub Pages domain

**CORS Configuration:**
```typescript
// backend/src/index.ts
app.use(cors({
  origin: [
    'https://yourusername.github.io',
    'http://localhost:5173' // dev
  ],
  credentials: true
}));
```

**GitHub Actions (.github/workflows/deploy.yml):**
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - name: Build
        run: |
          cd frontend
          npm ci
          npm run build
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

### 9.3 Local Development

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev   # nodemon with ts-node

# Terminal 2: Frontend
cd frontend
npm install
npm run dev   # Vite dev server

# Terminal 3: Database setup
cd backend
sqlite3 database/mission-control.db < database/schema.sql
```

**.env (local):**
```bash
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
JWT_SECRET=dev-secret-change-in-prod
DATABASE_PATH=./database/mission-control.db
CLAWDBOT_SESSION_DIR=/home/wakemateclub/.clawdbot/sessions
CLAWDBOT_GATEWAY_URL=http://localhost:3021
ADMIN_USERNAME=zohaib
ADMIN_PASSWORD=dev
```

---

## 10. Security Considerations

### 10.1 Authentication

- **JWT-based auth** with short expiry (2 hours)
- **Refresh tokens** stored in httpOnly cookies (optional for future multi-user)
- **Password hashing** with bcrypt (12 rounds minimum)
- **Single user** (Zohaib) - hardcoded in backend config

### 10.2 WebSocket Security

- **Authentication required** before any data transmission
- **Token validation** on every connection
- **Rate limiting** on events (prevent spam)

### 10.3 API Security

- **JWT verification** middleware on all protected routes
- **Input validation** with Zod or Joi
- **SQL injection prevention** via parameterized queries (better-sqlite3)
- **CORS** configured for specific origins only

### 10.4 Environment Variables

```bash
# NEVER commit these
JWT_SECRET=<cryptographically-random-secret>
ADMIN_PASSWORD_HASH=<bcrypt-hash>

# Generate JWT secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate password hash:
node -e "console.log(require('bcrypt').hashSync('your-password', 12))"
```

### 10.5 Database Security

- **File permissions** on SQLite database (600)
- **Regular backups** (Railway volume snapshots)
- **No sensitive data** in plain text
- **Sanitize inputs** before storing

---

## 11. Key Features Implementation

### 11.1 Agent Status Board

**Frontend Component:**
```vue
<!-- frontend/src/components/AgentStatusBoard.vue -->
<template>
  <div class="agent-status-board">
    <div class="status-columns">
      <div v-for="status in statuses" :key="status" class="status-column">
        <h3>{{ status }}</h3>
        <AgentCard 
          v-for="agent in getAgentsByStatus(status)"
          :key="agent.id"
          :agent="agent"
          @click="showAgentDetails(agent)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAgentsStore } from '@/stores/agents';
import AgentCard from './AgentCard.vue';

const agentsStore = useAgentsStore();
const statuses = ['working', 'standby', 'blocked', 'completed'];

const getAgentsByStatus = (status: string) => {
  return agentsStore.agents.filter(a => a.status === status);
};
</script>
```

**Real-time Updates:**
```typescript
// frontend/src/stores/agents.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { websocket } from '@/services/websocket';
import type { Agent } from '@shared/types';

export const useAgentsStore = defineStore('agents', () => {
  const agents = ref<Agent[]>([]);
  
  function init() {
    // Initial fetch
    api.get('/api/agents').then(res => {
      agents.value = res.data.agents;
    });
    
    // WebSocket listeners
    websocket.on('agent:spawned', (event) => {
      agents.value.push(event.agent);
    });
    
    websocket.on('agent:status_changed', (event) => {
      const agent = agents.value.find(a => a.id === event.agentId);
      if (agent) {
        agent.status = event.newStatus;
        agent.updatedAt = event.timestamp;
      }
    });
  }
  
  return { agents, init };
});
```

### 11.2 Kanban Mission Queue

**Drag & Drop:**
```vue
<!-- frontend/src/components/KanbanBoard.vue -->
<template>
  <div class="kanban-board">
    <KanbanColumn
      v-for="status in columns"
      :key="status"
      :status="status"
      :tasks="getTasksByStatus(status)"
      @drop="handleDrop"
    />
  </div>
</template>

<script setup lang="ts">
import { useTasks Store } from '@/stores/tasks';
import { VueDraggable } from 'vue-draggable-plus';

const tasksStore = useTasksStore();
const columns = ['backlog', 'todo', 'in_progress', 'blocked', 'done'];

async function handleDrop(event: { taskId: number, toStatus: string, position: number }) {
  await tasksStore.moveTask(event.taskId, event.toStatus, event.position);
}
</script>
```

**Send Back to Agent:**
```typescript
// frontend/src/components/TaskCard.vue
async function sendBackToAgent(taskId: number, reason: string) {
  await api.post(`/api/tasks/${taskId}/send-back`, { reason });
  
  // Automatically creates comment and moves to "blocked" status
}
```

### 11.3 Live Activity Feed

**Streaming Updates:**
```vue
<!-- frontend/src/components/ActivityFeed.vue -->
<template>
  <div class="activity-feed">
    <div class="filters">
      <select v-model="filterType">
        <option value="all">All Activities</option>
        <option value="agent_spawn">Agent Spawns</option>
        <option value="task_update">Task Updates</option>
        <option value="error">Errors</option>
      </select>
    </div>
    
    <div class="feed-items">
      <div 
        v-for="activity in filteredActivities" 
        :key="activity.id"
        :class="['feed-item', activity.severity]"
      >
        <span class="timestamp">{{ formatTime(activity.createdAt) }}</span>
        <strong>{{ activity.title }}</strong>
        <p>{{ activity.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useActivityStore } from '@/stores/activity';

const activityStore = useActivityStore();
const filterType = ref('all');

const filteredActivities = computed(() => {
  if (filterType.value === 'all') return activityStore.activities;
  return activityStore.activities.filter(a => a.type === filterType.value);
});
</script>
```

### 11.4 Metrics Dashboard

**Token & Cost Tracking:**
```typescript
// backend/src/services/metricsCalculator.ts

export class MetricsCalculator {
  // Model pricing (tokens per dollar)
  private pricing = {
    'claude-sonnet-4': { input: 3, output: 15 },  // per million tokens
    'claude-sonnet-3.5': { input: 3, output: 15 },
    'gpt-4': { input: 30, output: 60 }
  };
  
  calculateCost(tokens: number, model: string, type: 'input' | 'output'): number {
    const rate = this.pricing[model]?.[type] || 0;
    return (tokens / 1_000_000) * rate;
  }
  
  async getAggregatedMetrics(period: string = '24h'): Promise<any> {
    const since = this.parsePeriod(period);
    
    const metrics = await db.query(`
      SELECT 
        SUM(CASE WHEN metric_type = 'tokens' THEN value ELSE 0 END) as totalTokens,
        SUM(CASE WHEN metric_type = 'cost' THEN value ELSE 0 END) as totalCost,
        COUNT(DISTINCT agent_id) as uniqueAgents,
        AVG(CASE WHEN metric_type = 'runtime' THEN value ELSE NULL END) as avgRuntime
      FROM metrics
      WHERE timestamp >= ?
    `, [since]);
    
    return metrics;
  }
}
```

**Real-time Chart Updates:**
```vue
<!-- frontend/src/components/MetricsDashboard.vue -->
<template>
  <div class="metrics-dashboard">
    <div class="metric-cards">
      <MetricCard title="Total Tokens" :value="metrics.totalTokens" />
      <MetricCard title="Total Cost" :value="`$${metrics.totalCost.toFixed(2)}`" />
      <MetricCard title="Active Agents" :value="metrics.activeAgents" />
      <MetricCard title="Avg Duration" :value="`${metrics.avgTaskDuration}s`" />
    </div>
    
    <div class="charts">
      <LineChart :data="tokenTimeseries" title="Token Usage (24h)" />
      <PieChart :data="costBreakdown" title="Cost by Model" />
    </div>
  </div>
</template>
```

---

## 12. Integration with Eva (Main Agent)

### 12.1 Eva API Client

Eva can interact with Mission Control via REST API:

```typescript
// Eva's tooling (add to TOOLS.md or skill)

async function createMissionTask(title: string, description: string, priority: string) {
  const response = await fetch('https://mission-control.railway.app/api/tasks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MISSION_CONTROL_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title,
      description,
      status: 'todo',
      priority,
      createdBy: 'eva'
    })
  });
  
  return response.json();
}

async function updateTaskStatus(taskId: number, status: string, comment?: string) {
  await fetch(`https://mission-control.railway.app/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${process.env.MISSION_CONTROL_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  });
  
  if (comment) {
    await fetch(`https://mission-control.railway.app/api/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISSION_CONTROL_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: comment,
        type: 'comment'
      })
    });
  }
}

async function logActivity(type: string, title: string, description: string) {
  await fetch('https://mission-control.railway.app/api/activities', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MISSION_CONTROL_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type,
      title,
      description,
      severity: 'info'
    })
  });
}
```

### 12.2 Auto-tracking Sub-agent Spawns

**Hook into `sessions_spawn`:**
```typescript
// When Eva spawns a sub-agent
const subagent = await sessions_spawn({
  label: 'mission-control-architect',
  task: '...'
});

// Automatically create task in Mission Control
await createMissionTask(
  'Design Mission Control Architecture',
  task,
  'high'
);
```

---

## 13. Development Phases

### Phase 1: Foundation (Week 1)
- [x] Architecture design (this document)
- [ ] Database schema setup
- [ ] Backend scaffolding (Express + Socket.io)
- [ ] Frontend scaffolding (Vue.js + Vite)
- [ ] Authentication (JWT)
- [ ] Basic API endpoints

### Phase 2: Core Features (Week 2)
- [ ] Agent status monitoring (file watcher)
- [ ] Kanban board (CRUD + drag-drop)
- [ ] WebSocket real-time updates
- [ ] Activity feed (basic)
- [ ] Metrics calculation (tokens, cost)

### Phase 3: Integration (Week 3)
- [ ] Clawdbot Gateway API integration
- [ ] Session discovery & parsing
- [ ] Eva API client (for auto-tracking)
- [ ] Task comments & history
- [ ] Send-back functionality

### Phase 4: Polish & Deploy (Week 4)
- [ ] UI/UX refinement
- [ ] Charts & visualizations
- [ ] Deployment to Railway
- [ ] Testing & bug fixes
- [ ] Documentation

---

## 14. Future Enhancements

### Post-MVP Features:
- **Multi-user support** (if needed)
- **Advanced filtering** (by date range, tags, agents)
- **Task templates** (common mission types)
- **Notifications** (Telegram/email alerts)
- **Agent performance analytics** (success rate, avg time)
- **Cost optimization suggestions** (model recommendations)
- **Task dependencies** (DAG visualization)
- **Voice control** (integration with VAPI for task creation)
- **Mobile app** (React Native or PWA)
- **AI-powered insights** (analyze patterns, suggest optimizations)

---

## 15. Testing Strategy

### Backend Tests
```typescript
// backend/tests/api/tasks.test.ts
describe('Tasks API', () => {
  it('should create a new task', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Task',
        status: 'todo',
        priority: 'medium'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.task).toHaveProperty('id');
  });
});
```

### Frontend Tests
```typescript
// frontend/tests/components/KanbanBoard.spec.ts
describe('KanbanBoard', () => {
  it('should render all columns', () => {
    const wrapper = mount(KanbanBoard);
    expect(wrapper.findAll('.kanban-column')).toHaveLength(5);
  });
  
  it('should move task on drop', async () => {
    // Test drag-drop functionality
  });
});
```

### E2E Tests (Playwright)
```typescript
// e2e/mission-control.spec.ts
test('full user flow', async ({ page }) => {
  await page.goto('https://mission-control.railway.app');
  await page.fill('[name="username"]', 'zohaib');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('.agent-status-board')).toBeVisible();
  
  // Create task
  await page.click('button:has-text("New Task")');
  await page.fill('[name="title"]', 'Test Task');
  await page.click('button:has-text("Create")');
  
  // Verify task appears in Kanban
  await expect(page.locator('.task-card:has-text("Test Task")')).toBeVisible();
});
```

---

## 16. Monitoring & Logging

### Application Logging
```typescript
// backend/src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

### Performance Monitoring
- **Railway metrics** (CPU, memory, requests/sec)
- **Custom metrics** endpoint for health checks
- **Error tracking** (Sentry integration optional)

---

## 17. Conclusion

This architecture provides a solid foundation for Mission Control Dashboard with:

✅ Real-time updates via WebSocket  
✅ Scalable REST API design  
✅ Flexible database schema  
✅ Secure authentication  
✅ Easy deployment to Railway  
✅ Bi-directional control (Eva + Zohaib)  
✅ Multi-session support  
✅ Extensible for future features  

**Next Steps:**
1. Review this architecture with Zohaib
2. Set up project structure
3. Begin Phase 1 development
4. Iterate based on feedback

---

**Document Version:** 1.0  
**Author:** Eva (Mission Control Architect Sub-agent)  
**Date:** 2025-01-20  
**Status:** Ready for Implementation
