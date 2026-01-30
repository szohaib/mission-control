# 🚀 Quick Start Guide

Get Mission Control running in 60 seconds!

## Step 1: Install Dependencies

```bash
cd /home/wakemateclub/clawd/mission-control/frontend
npm install
```

## Step 2: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit if needed (optional for development)
nano .env
```

Default settings work out of the box with mock data!

## Step 3: Start Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser

## Step 4: Login

- **Password:** `mission-control` (default)

That's it! 🎉

## What You'll See

- **Squad Leader Panel** - Eva's command center
- **Agent Status Board** - 4 mock agents (working, standby, blocked)
- **Kanban Board** - Sample missions across 4 columns
- **Activity Feed** - Live event stream

## Next Steps

### Test Features

1. **Spawn an Agent** - Click "➕ Spawn Agent" in the Agent Status Board
2. **Create a Mission** - Click "➕ Create Mission" in the Kanban Board
3. **Drag Missions** - Drag tasks between Backlog → In Progress → Review → Done
4. **View Mission Details** - Click any mission card
5. **Send Feedback** - Open a mission and use "Send Back to Agent"

### Connect to Real Backend

1. Update `.env`:
   ```env
   VITE_WS_URL=ws://your-backend-url:8080/ws
   ```

2. Restart dev server:
   ```bash
   npm run dev
   ```

### Deploy to Production

#### Railway (Recommended)
```bash
# Push to GitHub
git init
git add .
git commit -m "Mission Control frontend"
git push

# Connect to Railway
# railway.app → New Project → Deploy from GitHub
```

#### Build Static Files
```bash
npm run build
# Upload dist/ folder to any static host
```

## Troubleshooting

### Port 5173 already in use?
```bash
# Kill the process
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

### Build fails?
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Mock data not loading?
- Check browser console (F12)
- WebSocket connection will fail gracefully
- Mock data loads automatically as fallback

## Default Credentials

- **Password:** `mission-control`
- Change in `.env` → `VITE_PASSWORD=your-secure-password`

## Support

- 📖 Read [README.md](./README.md) for full documentation
- 🐛 Check browser console for errors
- 💬 Open an issue on GitHub

---

**Happy commanding!** 🚀👩‍🚀
