# Mission Control - Quick Start Guide

This guide will get you from zero to running in 10 minutes.

---

## Step 1: Project Structure Setup

Create the directory structure:

```bash
cd /home/wakemateclub/clawd/mission-control

# Create directories
mkdir -p frontend/src/{components,views,stores,services,types,assets/styles}
mkdir -p backend/src/{config,middleware,routes,services,models,websocket,types,utils}
mkdir -p backend/database/migrations
mkdir -p shared
mkdir -p deployment
mkdir -p logs
```

---

## Step 2: Initialize Package.json

### Root workspace
```bash
cat > package.json << 'EOF'
{
  "name": "mission-control",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "frontend",
    "backend"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:backend && npm run build:frontend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
EOF
```

### Backend package.json
```bash
cat > backend/package.json << 'EOF'
{
  "name": "mission-control-backend",
  "version": "0.1.0",
  "scripts": {
    "dev": "nodemon --watch src --ext ts --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:init": "sqlite3 database/mission-control.db < database/schema.sql"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1",
    "better-sqlite3": "^9.2.2",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "chokidar": "^3.5.3",
    "winston": "^3.11.0",
    "axios": "^1.6.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.5",
    "@types/better-sqlite3": "^7.6.8",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcrypt": "^5.0.2",
    "@types/cors": "^2.8.17",
    "typescript": "^5.3.3",
    "nodemon": "^3.0.2",
    "ts-node": "^10.9.2"
  }
}
EOF
```

### Frontend package.json
```bash
cat > frontend/package.json << 'EOF'
{
  "name": "mission-control-frontend",
  "version": "0.1.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.15",
    "vue-router": "^4.2.5",
    "pinia": "^2.1.7",
    "socket.io-client": "^4.6.1",
    "axios": "^1.6.5",
    "vuetify": "^3.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.3",
    "typescript": "^5.3.3",
    "vite": "^5.0.11",
    "vue-tsc": "^1.8.27"
  }
}
EOF
```

---

## Step 3: Install Dependencies

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

---

## Step 4: Set Up Environment Variables

```bash
cp .env.example .env

# Edit .env
nano .env
# Set your password and secrets
```

---

## Step 5: Initialize Database

Copy the schema from ARCHITECTURE.md section 5.1 into `backend/database/schema.sql`, then:

```bash
cd backend
npm run db:init
cd ..
```

---

## Step 6: Create Minimal Backend

```bash
cat > backend/src/index.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// WebSocket
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Mission Control backend running on http://localhost:${PORT}`);
});
EOF
```

Create TypeScript config:
```bash
cat > backend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
EOF
```

---

## Step 7: Create Minimal Frontend

```bash
cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mission Control</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
EOF

cat > frontend/src/main.ts << 'EOF'
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
EOF

cat > frontend/src/App.vue << 'EOF'
<template>
  <div id="app">
    <h1>🎯 Mission Control Dashboard</h1>
    <p>Status: {{ status }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const status = ref('Initializing...');

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/health');
    const data = await res.json();
    status.value = data.status === 'ok' ? '✅ Connected' : '❌ Error';
  } catch (err) {
    status.value = '❌ Backend not reachable';
  }
});
</script>

<style>
#app {
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 2rem;
}
h1 {
  color: #2c3e50;
}
</style>
EOF

cat > frontend/vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});
EOF

cat > frontend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF
```

---

## Step 8: Run Development Servers

```bash
# From mission-control root
npm run dev
```

This will start:
- Backend: http://localhost:3001
- Frontend: http://localhost:5173

---

## Step 9: Verify Setup

Open browser to http://localhost:5173

You should see:
```
🎯 Mission Control Dashboard
Status: ✅ Connected
```

---

## Step 10: Next Steps

Now that the skeleton is running:

1. **Implement authentication** (backend/src/routes/auth.ts)
2. **Add database models** (backend/src/models/)
3. **Build Agent Status Board** (frontend/src/components/AgentStatusBoard.vue)
4. **Implement Kanban** (frontend/src/components/KanbanBoard.vue)
5. **Set up WebSocket events** (backend/src/websocket/server.ts)
6. **Add session monitoring** (backend/src/services/sessionMonitor.ts)

Refer to **ARCHITECTURE.md** for detailed implementation specs.

---

## Troubleshooting

**Port already in use:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or change PORT in .env
```

**SQLite permission denied:**
```bash
chmod 755 backend/database
chmod 644 backend/database/mission-control.db
```

**Frontend can't reach backend:**
- Check backend is running on :3001
- Verify Vite proxy config in vite.config.ts
- Check CORS settings in backend

---

**You're ready to build Mission Control! 🚀**
