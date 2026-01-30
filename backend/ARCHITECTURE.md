# Mission Control Backend Architecture

## Overview

The Mission Control Backend is a real-time monitoring and management system for Clawdbot agents. It provides REST APIs and WebSocket connectivity for tracking agent status, managing tasks, and monitoring system activity.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Mission Control                         │
│                                                               │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│  │   Frontend   │◄─►│   Backend    │◄─►│  Clawdbot    │    │
│  │  Dashboard   │   │   (Node.js)  │   │     CLI      │    │
│  └──────────────┘   └──────────────┘   └──────────────┘    │
│         │                   │                   │            │
│         │                   │                   │            │
│    WebSocket           REST API          Shell Exec         │
│         │                   │                   │            │
│         │                   ▼                   │            │
│         │            ┌──────────────┐           │            │
│         └───────────►│   SQLite DB  │◄──────────┘            │
│                      └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. **Express Server** (`server.js`)
- HTTP server for REST API
- Middleware pipeline (CORS, auth, JSON parsing)
- Route mounting and error handling
- Health check endpoint

### 2. **WebSocket Server** (`websocket.js`)
- Real-time bidirectional communication
- Automatic agent status polling (5-second interval)
- Event broadcasting to all connected clients
- Message handling (ping/pong, subscriptions)

### 3. **Database Layer** (`database.js`)
- SQLite with WAL mode for concurrent access
- Schema initialization with indexes
- Tables: tasks, comments, activity_feed, agent_metrics

### 4. **Authentication** (`middleware/auth.js`, `routes/auth.js`)
- Simple password-based authentication
- JWT token generation and verification
- 24-hour token expiry

### 5. **Route Handlers**
- **`routes/agents.js`** - Agent management via Clawdbot CLI
- **`routes/tasks.js`** - Kanban task CRUD operations
- **`routes/feed.js`** - Activity feed and statistics

### 6. **Utilities**
- **`utils/activity.js`** - Activity logging helper

## Data Flow

### Agent Status Updates
```
Clawdbot CLI
    ↓ (polling every 5s)
websocket.js → broadcastAgentStatus()
    ↓
WebSocket clients receive agent:status event
```

### Task Creation Flow
```
POST /api/tasks
    ↓
routes/tasks.js → Create in database
    ↓
logActivity() → Log to activity_feed
    ↓
broadcastTaskUpdate() → Notify WebSocket clients
    ↓
broadcastActivity() → Notify WebSocket clients
```

### Agent Spawning Flow
```
POST /api/agents/spawn
    ↓
Execute: clawdbot sessions spawn --label <name> --task <task>
    ↓
logActivity() → Log to activity_feed
    ↓
broadcastAgentStatus() → Fetch latest status and broadcast
```

## Database Schema

### Tasks Table
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  assignedAgent TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  dueDate INTEGER,
  tags TEXT,           -- JSON array
  metadata TEXT        -- JSON object
);
```

### Comments Table
```sql
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  taskId TEXT NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
);
```

### Activity Feed Table
```sql
CREATE TABLE activity_feed (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,           -- 'task', 'agent', 'comment'
  actor TEXT NOT NULL,          -- Who performed the action
  action TEXT NOT NULL,         -- 'created', 'updated', 'spawned', etc.
  targetType TEXT,              -- 'task', 'agent', etc.
  targetId TEXT,                -- ID of the target
  metadata TEXT,                -- JSON object with additional data
  timestamp INTEGER NOT NULL
);
```

### Agent Metrics Table
```sql
CREATE TABLE agent_metrics (
  id TEXT PRIMARY KEY,
  agentId TEXT NOT NULL,
  sessionId TEXT,
  tokens INTEGER DEFAULT 0,
  cost REAL DEFAULT 0.0,
  runtime INTEGER DEFAULT 0,
  tasksCompleted INTEGER DEFAULT 0,
  timestamp INTEGER NOT NULL
);
```

## API Design

### REST Endpoints

All protected endpoints require `Authorization: Bearer <token>` header.

#### Authentication
- `POST /api/auth/login` - Get JWT token
- `GET /api/auth/verify` - Verify token validity

#### Agents
- `GET /api/agents` - List all agents with metrics
- `GET /api/agents/:id` - Get single agent with history
- `POST /api/agents/spawn` - Spawn new agent
- `POST /api/agents/:id/kill` - Kill agent
- `POST /api/agents/:id/send` - Send message to agent
- `GET /api/agents/:id/transcript` - Get conversation transcript
- `POST /api/agents/:id/metrics` - Record metrics

#### Tasks
- `GET /api/tasks` - List tasks (supports filtering)
- `GET /api/tasks/:id` - Get task with comments
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/comment` - Add comment

#### Activity Feed
- `GET /api/feed` - Get activity feed (paginated)
- `GET /api/feed/stats` - Get statistics

### WebSocket Events

#### Server → Client
- `agent:status` - Agent status updates (auto-broadcast every 5s)
- `task:update` - Task created/updated/deleted
- `feed:activity` - New activity logged

#### Client → Server
- `ping` - Keep-alive ping (responds with `pong`)
- `subscribe` - Subscribe to specific channels (future use)

## Integration with Clawdbot

The backend integrates with Clawdbot via shell command execution:

```javascript
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// List all sessions
const { stdout } = await execAsync('clawdbot sessions list --json');
const sessions = JSON.parse(stdout);

// Spawn agent
await execAsync(`clawdbot sessions spawn --label "${label}" --task "${task}"`);

// Kill agent
await execAsync(`clawdbot sessions kill ${id}`);

// Send message
await execAsync(`clawdbot sessions send ${id} "${message}"`);

// Get transcript
const { stdout } = await execAsync(`clawdbot sessions transcript ${id} --json`);
```

## Security Considerations

1. **Authentication**: Simple password-based auth for MVP. Consider OAuth/SSO for production.

2. **Token Management**: JWT tokens expire in 24 hours. No refresh token mechanism yet.

3. **CORS**: Currently allows all origins. Configure for specific domains in production.

4. **Input Validation**: Basic validation in place. Add more comprehensive validation.

5. **SQL Injection**: Using prepared statements with better-sqlite3 (safe).

6. **Command Injection**: User input is escaped when calling Clawdbot CLI.

7. **Rate Limiting**: Not implemented. Consider adding for production.

## Performance Considerations

1. **Database**: SQLite with WAL mode for concurrent reads
2. **WebSocket Polling**: 5-second interval for agent status (configurable)
3. **Connection Pooling**: Single SQLite connection (sufficient for low traffic)
4. **Indexes**: Created on frequently queried columns

## Scalability

Current design is single-server. For horizontal scaling:

1. **Database**: Migrate to PostgreSQL/MySQL
2. **WebSocket**: Use Redis pub/sub for multi-server broadcasting
3. **Session Storage**: Use Redis for JWT blacklist/refresh tokens
4. **Load Balancer**: Add sticky sessions for WebSocket connections

## Deployment

### Development
```bash
npm install
cp .env.example .env
npm run dev
```

### Production
```bash
npm install --production
NODE_ENV=production npm start
```

### Process Manager (PM2)
```bash
pm2 start server.js --name mission-control
pm2 startup
pm2 save
```

### Systemd Service
```ini
[Unit]
Description=Mission Control Backend
After=network.target

[Service]
Type=simple
User=clawdbot
WorkingDirectory=/path/to/mission-control/backend
ExecStart=/usr/bin/node server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

## Monitoring

Recommended monitoring:
- **Application**: PM2 monitoring, New Relic, DataDog
- **Database**: SQLite query performance, database size
- **WebSocket**: Connection count, message throughput
- **System**: CPU, memory, disk I/O

## Future Enhancements

1. **Advanced Auth**: OAuth, RBAC, API keys
2. **Real-time Metrics**: Live token/cost tracking during agent execution
3. **Task Scheduling**: Cron-like task scheduling
4. **Notifications**: Email/Slack alerts for important events
5. **Audit Log**: Comprehensive audit trail
6. **Backup/Restore**: Automated database backups
7. **API Rate Limiting**: Prevent abuse
8. **WebSocket Authentication**: Token-based WS auth
9. **Multi-tenancy**: Support multiple users/organizations
10. **Analytics Dashboard**: Charts, graphs, insights

## Testing

### Manual Testing
```bash
# Start server
npm start

# Run test client
node test-client.js

# Seed sample data
node scripts/seed-data.js
```

### API Testing
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password": "admin123"}'

# Get agents (requires token)
curl http://localhost:3001/api/agents \
  -H "Authorization: Bearer <token>"
```

## License

ISC
