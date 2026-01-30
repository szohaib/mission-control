# Mission Control Backend

Real-time agent monitoring and task management backend for Clawdbot Mission Control Dashboard.

## Features

- **Real-time WebSocket Updates** - Live agent status, task changes, and activity feed
- **Agent Management** - List, spawn, kill, and monitor agents via Clawdbot CLI integration
- **Kanban Task System** - Full CRUD operations with comments and assignments
- **Activity Feed** - Comprehensive logging of all system activities
- **Metrics Collection** - Track tokens, costs, runtime, and task completion
- **Password Authentication** - Simple JWT-based auth with configurable password

## Stack

- **Node.js + Express** - REST API server
- **WebSocket (ws)** - Real-time bidirectional communication
- **SQLite (better-sqlite3)** - Lightweight database with WAL mode
- **JWT** - Token-based authentication
- **Clawdbot CLI** - Direct integration via shell commands

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start server:**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with password, returns JWT token
- `GET /api/auth/verify` - Verify token validity

### Agents
- `GET /api/agents` - List all agents with metrics
- `GET /api/agents/:id` - Get single agent details with history
- `POST /api/agents/spawn` - Spawn new agent
- `POST /api/agents/:id/kill` - Kill agent
- `POST /api/agents/:id/send` - Send message to agent
- `GET /api/agents/:id/transcript` - Get agent transcript
- `POST /api/agents/:id/metrics` - Record agent metrics

### Tasks
- `GET /api/tasks` - List all tasks (supports `?status=` and `?assignedAgent=` filters)
- `GET /api/tasks/:id` - Get task with comments
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/comment` - Add comment to task

### Activity Feed
- `GET /api/feed` - Get activity feed (supports `?limit=`, `?offset=`, `?type=`)
- `GET /api/feed/stats` - Get feed statistics

### Health
- `GET /health` - Health check endpoint

## WebSocket Events

### Server → Client

- **`agent:status`** - Agent status updates (every 5 seconds)
  ```json
  {
    "type": "agent:status",
    "data": [...sessions],
    "timestamp": 1234567890
  }
  ```

- **`task:update`** - Task created/updated/deleted
  ```json
  {
    "type": "task:update",
    "data": {...task},
    "timestamp": 1234567890
  }
  ```

- **`feed:activity`** - New activity logged
  ```json
  {
    "type": "feed:activity",
    "data": {...activity},
    "timestamp": 1234567890
  }
  ```

### Client → Server

- **`ping`** - Keep-alive ping
  ```json
  { "type": "ping" }
  ```

- **`subscribe`** - Subscribe to channels (future use)
  ```json
  {
    "type": "subscribe",
    "payload": { "channels": ["agents", "tasks"] }
  }
  ```

## Authentication Flow

1. **Login:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"password": "admin123"}'
   ```

2. **Use token in subsequent requests:**
   ```bash
   curl http://localhost:3001/api/agents \
     -H "Authorization: Bearer <your-token>"
   ```

3. **WebSocket connection (after getting token):**
   ```javascript
   const ws = new WebSocket('ws://localhost:3001');
   ws.send(JSON.stringify({ type: 'auth', token: '<your-token>' }));
   ```

## Database Schema

### Tables

- **tasks** - Kanban tasks with status, priority, assignments
- **comments** - Task comments with author and timestamp
- **activity_feed** - System-wide activity log
- **agent_metrics** - Historical agent performance metrics

### Indexes

- Task status and assigned agent
- Comment task references
- Activity timestamp
- Agent metrics by agent ID

## Environment Variables

```env
PORT=3001                          # Server port
NODE_ENV=development               # Environment
JWT_SECRET=your-secret-key         # JWT signing secret
DASHBOARD_PASSWORD=admin123        # Simple password auth
CLAWDBOT_CLI_PATH=clawdbot        # Path to clawdbot CLI
```

## Development

```bash
# Install dev dependencies
npm install --save-dev nodemon

# Run with auto-reload
npm run dev

# View logs
tail -f *.log

# Database inspection
sqlite3 mission-control.db
```

## Production Deployment

1. Set strong `JWT_SECRET` and `DASHBOARD_PASSWORD`
2. Set `NODE_ENV=production`
3. Use process manager (PM2, systemd)
4. Enable HTTPS/SSL
5. Configure CORS for your frontend domain
6. Regular database backups
7. Monitor logs and metrics

## Integration with Clawdbot

The backend integrates with Clawdbot CLI via shell commands:

- `clawdbot sessions list --json` - Get all sessions
- `clawdbot sessions spawn --label <name> --task <task>` - Spawn agent
- `clawdbot sessions kill <id>` - Kill agent
- `clawdbot sessions send <id> <message>` - Send message
- `clawdbot sessions transcript <id> --json` - Get transcript

Ensure `clawdbot` is in PATH or set `CLAWDBOT_CLI_PATH` in `.env`.

## License

ISC
