#!/bin/bash

# Deploy environment variables to Railway
# Run this script after logging in with `railway login`

set -e

echo "🚀 Setting up Railway environment variables..."

# Link to project (interactive)
railway link

# Set environment variables
echo "Setting CLAWDBOT_GATEWAY_URL..."
railway variables set CLAWDBOT_GATEWAY_URL=http://34.72.218.10

echo "Setting CLAWDBOT_API_KEY..."
railway variables set CLAWDBOT_API_KEY=38d9a2275996a9c44f53158af71e584fd91d17911a5c437afa71e45dccc34a44

echo "Setting JWT_SECRET (if not already set)..."
railway variables set JWT_SECRET="$(openssl rand -hex 32)" || echo "JWT_SECRET already set"

echo ""
echo "✅ Environment variables configured!"
echo ""
echo "🔄 Railway will automatically redeploy with new variables."
echo "📊 Dashboard: https://mission-control-v2-production.up.railway.app"
echo ""
echo "Test the connection:"
echo "  curl https://mission-control-v2-production.up.railway.app/health"
