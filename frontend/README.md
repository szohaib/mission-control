# ⚡ Mission Control Dashboard

> **NASA meets Stark Industries™**

A real-time agent orchestration dashboard built with Vue 3, featuring live WebSocket updates, drag-and-drop mission management, and a sleek command center interface.

![Mission Control](https://img.shields.io/badge/Status-Operational-success?style=for-the-badge)
![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?style=for-the-badge&logo=vue.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss)

## 🚀 Features

### 👩‍🚀 Squad Leader Panel
- Eva's status and control center
- Real-time active agent count
- WebSocket connection status indicator
- Mission statistics

### 🤖 Agent Status Board
- Grid view of all sub-agents
- Color-coded status indicators:
  - 🟢 **Working** - Shows current task
  - 🟡 **Standby** - Ready for assignment
  - 🔴 **Blocked** - Displays block reason
- Real-time metrics: tokens, cost, runtime
- One-click agent spawning

### 📋 Kanban Mission Queue
- Four-column workflow: **Backlog → In Progress → Review → Done**
- Drag-and-drop between columns
- Click tasks for details and comments
- "Send back to agent" with feedback
- Priority indicators (High/Medium/Low)

### 📡 Live Activity Feed
- Real-time scrolling timeline
- Color-coded log levels (Success/Info/Warning/Error)
- Source attribution
- Relative timestamps

### 🔐 Security
- Password-protected login screen
- Session management
- Environment-based configuration

### 🎨 Design
- Dark theme optimized for long sessions
- Responsive mobile-friendly layout
- Glassmorphism panels with cyan accents
- Smooth animations and transitions
- Custom scrollbars

## 📦 Tech Stack

- **Vue 3** (Composition API)
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Vue Draggable** - Drag-and-drop functionality
- **WebSocket** - Real-time communication

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd mission-control/frontend

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your settings
nano .env
```

### Environment Variables

```env
# WebSocket backend URL
VITE_WS_URL=ws://localhost:8080/ws

# Login password (change in production!)
VITE_PASSWORD=mission-control
```

## 🚀 Development

```bash
# Start development server with hot reload
npm run dev

# Access at http://localhost:5173
```

## 🏗️ Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🚢 Deployment

### Option 1: Railway (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect the configuration from `railway.json`
   - Add environment variables in Railway dashboard:
     - `VITE_WS_URL` - Your WebSocket backend URL
     - `VITE_PASSWORD` - Your login password

3. **Configure Backend URL**
   - Once deployed, update `VITE_WS_URL` to point to your backend
   - Redeploy if needed

### Option 2: Docker

```bash
# Build image
docker build -t mission-control-frontend .

# Run container
docker run -p 8080:80 mission-control-frontend

# Access at http://localhost:8080
```

### Option 3: Static Hosting (Netlify, Vercel, GitHub Pages)

```bash
# Build the app
npm run build

# The dist/ folder contains your static files
# Upload to your hosting provider
```

**Note:** For static hosting, you'll need a separate backend server for WebSocket functionality.

## 🔌 Backend Integration

The frontend expects a WebSocket server at the URL specified in `VITE_WS_URL`.

### Expected WebSocket Message Format

**Incoming (from backend):**

```json
{
  "type": "agent_update",
  "payload": {
    "id": "agent-1",
    "name": "Research Agent Alpha",
    "status": "working",
    "task": "Analyzing data",
    "tokens": 1247,
    "cost": 0.0042,
    "runtime": "00:05:23"
  }
}
```

**Message Types:**
- `agent_update` - Update agent status
- `mission_update` - Update mission status
- `activity` - Add activity log
- `squad_leader_update` - Update squad leader stats

**Outgoing (to backend):**

```json
{
  "type": "spawn_agent",
  "payload": {
    "task": "Research market trends"
  }
}
```

**Action Types:**
- `spawn_agent` - Request new agent
- `create_mission` - Create new mission
- `move_mission` - Move mission between columns

### Mock Data

If the WebSocket connection fails, the app automatically loads mock data for development and testing.

## 🎯 Usage

1. **Login** - Enter password (default: `mission-control`)
2. **Monitor Agents** - View real-time agent status
3. **Spawn Agents** - Click "➕ Spawn Agent" to create new agents
4. **Manage Missions** - Drag tasks between Kanban columns
5. **Review Missions** - Click tasks to view details and add feedback
6. **Track Activity** - Monitor live updates in the activity feed

## 🎨 Customization

### Colors

Edit `tailwind.config.js` to change the theme:

```js
colors: {
  'mission': {
    dark: '#0a0e1a',
    darker: '#050810',
    blue: '#1e40af',
    cyan: '#06b6d4',
    // Add your colors
  }
}
```

### Styling

All custom styles are in `src/style.css` with Tailwind utilities.

## 📱 Mobile Support

The dashboard is fully responsive and works on:
- 📱 Mobile phones (portrait/landscape)
- 📲 Tablets
- 💻 Laptops
- 🖥️ Desktop monitors

## 🐛 Troubleshooting

### WebSocket won't connect
- Check `VITE_WS_URL` in `.env`
- Ensure backend server is running
- Check browser console for errors
- Verify CORS settings on backend

### Build fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Drag-and-drop not working
- Ensure `vuedraggable` is installed: `npm install vuedraggable@next`
- Check browser console for errors

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a PR.

## 🌟 Credits

Built with ❤️ for the Mission Control project.

**"NASA meets Stark Industries™"** - A command center worthy of the future.

---

**Status:** 🟢 Operational  
**Version:** 1.0.0  
**Last Updated:** 2024
