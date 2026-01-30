#!/bin/bash
set -e

echo "🚀 Mission Control Railway Deployment Script"
echo "=============================================="
echo ""

# Check if logged in
if ! railway whoami &>/dev/null; then
    echo "❌ Not logged into Railway!"
    echo "Please run: railway login"
    echo "Then run this script again."
    exit 1
fi

echo "✅ Logged into Railway as: $(railway whoami)"
echo ""

# Check if we're in a Railway project
if ! railway status &>/dev/null; then
    echo "📦 Initializing Railway project..."
    railway init
    echo ""
fi

echo "🔨 Deploying Backend..."
cd backend

# Deploy backend
railway up

echo ""
echo "⚙️  Setting backend environment variables..."
railway variables set PASSWORD=zohaib123
railway variables set PORT=3000
railway variables set NODE_ENV=production
railway variables set CLAWDBOT_SESSION_PATH=/app/.clawdbot/agents/main/sessions/

echo ""
echo "🌐 Getting backend URL..."
BACKEND_URL=$(railway domain 2>&1 | grep -o 'https://[^[:space:]]*' || echo "")

if [ -z "$BACKEND_URL" ]; then
    echo "⚠️  Could not auto-detect backend URL"
    echo "Please manually get it from Railway dashboard and update frontend"
    read -p "Enter backend URL (or press Enter to continue): " BACKEND_URL
fi

echo "Backend URL: $BACKEND_URL"
echo ""

cd ../frontend

echo "🔨 Deploying Frontend..."
railway up

echo ""
echo "⚙️  Setting frontend environment variable..."
if [ -n "$BACKEND_URL" ]; then
    railway variables set VITE_API_URL="$BACKEND_URL"
else
    echo "⚠️  Skipping VITE_API_URL - please set manually in Railway dashboard"
fi

echo ""
echo "🌐 Getting frontend URL..."
FRONTEND_URL=$(railway domain 2>&1 | grep -o 'https://[^[:space:]]*' || echo "")

echo ""
echo "=============================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=============================================="
echo ""
echo "🎯 Backend:  $BACKEND_URL"
echo "🎯 Frontend: $FRONTEND_URL"
echo ""
echo "🔐 Login credentials:"
echo "   Password: zohaib123"
echo ""
echo "📝 Next steps:"
echo "   1. Visit $FRONTEND_URL"
echo "   2. Login with password 'zohaib123'"
echo "   3. Check agent dashboard and Kanban board"
echo ""
echo "If anything isn't working, check:"
echo "   - Railway dashboard for logs"
echo "   - Browser console for errors"
echo "   - Environment variables are set correctly"
echo ""
