# Mission Control Dashboard 🎯

> **Real-time orchestration dashboard for Eva's sub-agent ecosystem**

A Vue.js webapp with WebSocket-powered live updates for managing AI agents, tracking missions via Kanban board, monitoring activity, and analyzing metrics.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- SQLite3
- Clawdbot Gateway running locally (optional for dev)

### Installation

```bash
# Clone the repo (or work from this directory)
cd mission-control

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Initialize database
cd backend
npm run db:init

# Run development servers
npm run dev:backend  # Terminal 1
npm run dev:frontend # Terminal 2
```

### Access
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **WebSocket:** ws://localhost:3001

### Default Login
- **Username:** zohaib
- **Password:** (set in `.env`)

---

## 📖 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete technical specification
- **[API.md](./API.md)** - API endpoint reference (TBD)
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide (TBD)

---

## 🏗️ Tech Stack

**Frontend:**
- Vue.js 3 (Composition API)
- Pinia (state management)
- Socket.io-client (WebSocket)
- Vuetify / PrimeVue (UI components)
- Vite (build tool)

**Backend:**
- Node.js + Express
- Socket.io (WebSocket server)
- SQLite3 (database)
- JWT (authentication)
- Chokidar (file watching)

**Deployment:**
- Railway (recommended)
- GitHub Pages + Railway (alternative)

---

## 🎯 Key Features

### Agent Status Board
- Real-time tracking of all active agents
- Status indicators (working/standby/blocked/completed)
- Click to view detailed agent history

### Kanban Mission Queue
- Drag-and-drop task management
- 5 columns: Backlog → To Do → In Progress → Blocked → Done
- Comments and task history
- "Send back to agent" functionality
- Priority tagging (low/medium/high/urgent)

### Live Activity Feed
- High-level updates from all agents
- Filtering by type and severity
- Real-time streaming via WebSocket
- Search and export functionality

### Metrics Dashboard
- Token usage tracking
- Cost analysis by model
- Runtime statistics
- Success rate and performance metrics
- Time-series charts

### Bi-directional Control
- Eva can create/update tasks via API
- Zohaib can manage tasks via UI
- Both see real-time updates
- Audit trail for all changes

---

## 🔧 Development

### Project Structure
```
mission-control/
├── frontend/          # Vue.js app
├── backend/           # Express API + WebSocket server
├── shared/            # Shared TypeScript types
└── deployment/        # Docker, Railway config
```

### Commands

```bash
# Development
npm run dev            # Run both frontend & backend
npm run dev:frontend   # Frontend only (Vite)
npm run dev:backend    # Backend only (nodemon)

# Build
npm run build          # Build both
npm run build:frontend # Build Vue.js app
npm run build:backend  # Compile TypeScript

# Testing
npm run test           # Run all tests
npm run test:frontend  # Vitest
npm run test:backend   # Jest
npm run test:e2e       # Playwright

# Database
npm run db:init        # Initialize SQLite schema
npm run db:migrate     # Run migrations
npm run db:seed        # Seed test data

# Deployment
npm run deploy         # Deploy to Railway
```

---

## 🔐 Security

- JWT-based authentication (single user)
- Password hashing with bcrypt
- CORS configured for specific origins
- WebSocket authentication required
- Environment variables for secrets
- SQL injection prevention via parameterized queries

---

## 📊 Database Schema

**Core Tables:**
- `agents` - Active and historical agent sessions
- `tasks` - Kanban mission queue
- `task_comments` - Task history and discussions
- `activities` - Live activity feed events
- `metrics` - Token usage, cost, runtime data
- `sessions` - Auth tokens
- `user_preferences` - UI settings

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full schema.

---

## 🚢 Deployment

### Railway (Recommended)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### GitHub Pages + Railway Backend
See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guide.

---

## 🤖 Integration with Eva

Eva can interact with Mission Control via REST API:

```typescript
// Create a task
await fetch('https://mission-control.railway.app/api/tasks', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${MISSION_CONTROL_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'New Mission',
    description: 'Task details...',
    priority: 'high',
    createdBy: 'eva'
  })
});

// Log activity
await fetch('https://mission-control.railway.app/api/activities', {
  method: 'POST',
  headers: { /* ... */ },
  body: JSON.stringify({
    type: 'agent_spawn',
    title: 'Sub-agent spawned',
    description: 'Working on architecture design',
    severity: 'info'
  })
});
```

---

## 🛠️ Roadmap

### Phase 1: Foundation ✅
- [x] Architecture design
- [ ] Database schema
- [ ] Backend scaffolding
- [ ] Frontend scaffolding
- [ ] Authentication

### Phase 2: Core Features 🚧
- [ ] Agent status monitoring
- [ ] Kanban board
- [ ] WebSocket real-time updates
- [ ] Activity feed
- [ ] Metrics dashboard

### Phase 3: Integration 📋
- [ ] Clawdbot Gateway API
- [ ] Session discovery
- [ ] Eva API client
- [ ] Task comments

### Phase 4: Polish & Deploy 🎨
- [ ] UI/UX refinement
- [ ] Charts & visualizations
- [ ] Railway deployment
- [ ] Documentation

---

## 🐛 Troubleshooting

**WebSocket connection fails:**
- Check backend is running on correct port
- Verify CORS settings in backend
- Ensure JWT token is valid

**Database errors:**
- Run `npm run db:init` to reset schema
- Check file permissions on SQLite file
- Verify `DATABASE_PATH` in `.env`

**Agent status not updating:**
- Ensure Clawdbot sessions are running
- Check `CLAWDBOT_SESSION_DIR` path
- Verify file watcher is active (check logs)

---

## 📝 License

MIT

---

## 👥 Contributors

- **Eva** (Main Agent) - Architecture & Implementation
- **Zohaib** - Product Owner & User

---

**Status:** Architecture Complete, Ready for Implementation  
**Version:** 0.1.0  
**Last Updated:** 2025-01-20
