require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const { setupWebSocket } = require('./websocket');
const { initDatabase } = require('./database');
const authMiddleware = require('./middleware/auth');

// Route imports
const authRoutes = require('./routes/auth');
const agentRoutes = require('./routes/agents');
const taskRoutes = require('./routes/tasks');
const feedRoutes = require('./routes/feed');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

// Setup WebSocket
setupWebSocket(wss);

// Log server startup
console.log('🔐 Authentication: Password-based login enabled');
console.log('🔌 WebSocket: Authentication required for connection');

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/agents', authMiddleware, agentRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/feed', authMiddleware, feedRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Mission Control Backend running on port ${PORT}`);
  console.log(`📊 WebSocket server ready for real-time updates`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, wss };
