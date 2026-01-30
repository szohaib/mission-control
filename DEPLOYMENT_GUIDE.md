# Mission Control Deployment Guide

## 🚀 Quick Deploy Options

### Option 1: Railway (Recommended)

**Railway CLI isn't working in non-interactive mode. Use the web dashboard:**

1. **Go to [railway.app](https://railway.app)** and login
2. **Click "New Project" → "Deploy from GitHub repo"**
3. **Select the repository** (or import from this path)
4. **Create TWO services:**

#### Backend Service:
- **Root Directory:** `mission-control/backend`
- **Environment Variables:**
  ```
  PASSWORD=zohaib123
  PORT=3000
  NODE_ENV=production
  CLAWDBOT_SESSION_PATH=/app/.clawdbot/agents/main/sessions/
  ```
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Port:** 3000

#### Frontend Service:
- **Root Directory:** `mission-control/frontend`
- **Environment Variables:**
  ```
  VITE_API_URL=<BACKEND_URL_FROM_RAILWAY>
  ```
  (Replace with your backend's Railway URL after it deploys)
- **Build Command:** `npm install && npm run build`
- **Start Command:** Uses Dockerfile (nginx serves static files)

---

### Option 2: Render.com (Alternative)

1. **Go to [render.com](https://render.com)** and login
2. **Click "New" → "Blueprint"**
3. **Connect your repository**
4. **Select the `render.yaml` file** from the root of mission-control
5. **Set the `VITE_API_URL`** environment variable for the frontend after the backend deploys

The `render.yaml` file is pre-configured with all settings!

---

### Option 3: Vercel (Frontend) + Railway/Render (Backend)

#### Deploy Backend:
Use Railway or Render (see above)

#### Deploy Frontend to Vercel:
```bash
cd /home/wakemateclub/clawd/mission-control/frontend
npm install -g vercel
vercel login
vercel --prod
```

When prompted, set:
- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variable:** `VITE_API_URL=<your-backend-url>`

---

## 📋 Environment Variables Reference

### Backend:
| Variable | Value | Description |
|----------|-------|-------------|
| `PASSWORD` | `zohaib123` | Dashboard login password |
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `production` | Environment mode |
| `CLAWDBOT_SESSION_PATH` | `/path/to/sessions/` | Path to agent sessions |

### Frontend:
| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | `https://your-backend.railway.app` | Backend API URL |

---

## ✅ Post-Deployment Checklist

1. **Backend deployed** ✓
   - Visit: `https://your-backend.railway.app/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Frontend deployed** ✓
   - Visit: `https://your-frontend.railway.app`
   - Login page should load

3. **Test login** ✓
   - Password: `zohaib123`
   - Should see agent dashboard

4. **Test WebSocket** ✓
   - Check browser console for "WebSocket connected"
   - Should see real-time updates

5. **Test Kanban board** ✓
   - Drag and drop tasks
   - Create new tasks

---

## 🔧 Manual Railway Deployment (If CLI Needed)

Since Railway CLI requires interactive login, here's how to authenticate:

```bash
# 1. Start login process
railway login

# 2. Open the URL in your browser and authorize

# 3. Once logged in, initialize the project
cd /home/wakemateclub/clawd/mission-control
railway init

# 4. Create and deploy backend
cd backend
railway up

# 5. Set backend environment variables
railway variables set PASSWORD=zohaib123
railway variables set PORT=3000
railway variables set NODE_ENV=production
railway variables set CLAWDBOT_SESSION_PATH=/app/.clawdbot/agents/main/sessions/

# 6. Get backend URL
railway domain

# 7. Deploy frontend
cd ../frontend
railway up

# 8. Set frontend environment variable (use backend URL from step 6)
railway variables set VITE_API_URL=https://your-backend-url.railway.app
```

---

## 🐛 Troubleshooting

### Backend won't start:
- Check logs: `railway logs` or view in Railway dashboard
- Verify all environment variables are set
- Ensure `CLAWDBOT_SESSION_PATH` is accessible

### Frontend can't connect to backend:
- Verify `VITE_API_URL` is set correctly
- Check backend CORS settings (should allow your frontend domain)
- Open browser console for error messages

### WebSocket connection fails:
- Backend must support WebSocket upgrades
- Check if Railway/platform supports WebSockets (it does!)
- Verify no firewall blocking connections

---

## 📱 Access Your Dashboard

After successful deployment:

**Frontend:** `https://your-project-frontend.railway.app`  
**Backend:** `https://your-project-backend.railway.app`  
**Password:** `zohaib123`

---

## 🔐 Security Notes

- Change the default password in production!
- Consider adding rate limiting
- Use environment variables for sensitive data
- Enable HTTPS (Railway does this automatically)

---

Made with ❤️ by Claude Code
