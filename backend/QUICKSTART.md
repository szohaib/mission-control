# Mission Control Backend - Quick Start

## Installation

```bash
cd /home/wakemateclub/clawd/mission-control/backend
npm install
```

## Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Default settings (already configured in `.env`):
- **Port:** 3001
- **Password:** admin123
- **JWT Secret:** mission-control-super-secret-key-change-in-production

**⚠️ Important:** Change the password and JWT secret in production!

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on http://localhost:3001

## Testing the API

### 1. Login to get JWT token
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password": "admin123"}'
```

Save the returned token for subsequent requests.

### 2. List agents (requires token)
```bash
TOKEN="your-token-here"
curl http://localhost:3001/api/agents \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Create a task
```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build frontend dashboard",
    "description": "Create React dashboard with real-time updates",
    "status": "todo",
    "priority": "high",
    "tags": ["frontend", "react"]
  }'
```

### 4. WebSocket connection (browser console)
```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  console.log('Connected');
  ws.send(JSON.stringify({ type: 'ping' }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data.type, data);
};
```

## Testing with the Test Client

Run the included test client:
```bash
node test-client.js
```

This will:
- Test authentication
- Fetch agents
- Create tasks
- Add comments
- Test WebSocket connection

## Seeding Sample Data

To populate the database with sample data for development:
```bash
node scripts/seed-data.js
```

This creates:
- 6 sample tasks
- Comments on tasks
- Activity feed entries
- Agent metrics

## Project Structure

```
backend/
├── server.js               # Main server file
├── database.js             # JSON file storage
├── websocket.js            # WebSocket server & events
├── .env                    # Configuration
├── package.json            # Dependencies
│
├── middleware/
│   └── auth.js             # JWT authentication
│
├── routes/
│   ├── auth.js             # Login & token verification
│   ├── agents.js           # Agent management
│   ├── tasks.js            # Task CRUD operations
│   └── feed.js             # Activity feed
│
├── utils/
│   └── activity.js         # Activity logging helper
│
├── scripts/
│   └── seed-data.js        # Sample data generator
│
├── data/                   # JSON storage (auto-created)
│   ├── tasks.json
│   ├── comments.json
│   ├── activity_feed.json
│   └── agent_metrics.json
│
└── test-client.js          # API test client
```

## Database

The backend uses **JSON file storage** for simplicity:
- No native dependencies or compilation required
- Easy to inspect and debug
- Automatic file creation
- Atomic writes with proper error handling

Data files are stored in `./data/` directory.

## WebSocket Events

The server broadcasts real-time updates:

- **`agent:status`** - Every 5 seconds, lists all Clawdbot agents
- **`task:update`** - When tasks are created/updated/deleted
- **`feed:activity`** - When new activities are logged

## Common Issues

### Port already in use
If port 3001 is busy:
```bash
# Change PORT in .env
PORT=3002
```

### Clawdbot command not found
Ensure `clawdbot` is in your PATH:
```bash
which clawdbot
# or set custom path in .env
CLAWDBOT_CLI_PATH=/path/to/clawdbot
```

### WebSocket not connecting
- Check CORS settings in server.js
- Ensure WebSocket URL matches server address
- Check firewall rules

## Next Steps

1. **Build the frontend** - Connect React dashboard to this backend
2. **Deploy** - Use PM2 or systemd for production
3. **Security** - Change default password and JWT secret
4. **Monitoring** - Add logging and metrics collection

## API Reference

See [README.md](./README.md) for complete API documentation.

## License

ISC
