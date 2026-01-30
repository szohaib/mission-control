# Railway Environment Variables Setup

## Required Environment Variables

Add these to your Railway project (Mission Control V2 Production):

```bash
# Backend Port
PORT=3001

# JWT Secret (generate a secure random string)
JWT_SECRET=your-secure-jwt-secret-here

# Clawdbot Gateway Connection
CLAWDBOT_GATEWAY_URL=http://34.72.218.10
CLAWDBOT_API_KEY=38d9a2275996a9c44f53158af71e584fd91d17911a5c437afa71e45dccc34a44
```

## How to Set in Railway

1. Go to https://railway.app/dashboard
2. Select your project: "Mission Control V2 Production"
3. Go to Variables tab
4. Add each variable above

Or use Railway CLI:

```bash
railway variables set CLAWDBOT_GATEWAY_URL=http://34.72.218.10
railway variables set CLAWDBOT_API_KEY=38d9a2275996a9c44f53158af71e584fd91d17911a5c437afa71e45dccc34a44
```

## Security Notes

- **API Key**: The key `38d9a2275996a9c44f53158af71e584fd91d17911a5c437afa71e45dccc34a44` is required for all Gateway API requests
- **HTTPS**: Currently using HTTP to the VM's public IP (34.72.218.10)
  - For production, consider:
    - Setting up HTTPS with Let's Encrypt
    - Using CloudFlare Tunnel
    - Using Tailscale
- **Rate Limiting**: Gateway wrapper has rate limiting (100 req/15min)

## Testing

After deployment, test the connection:

```bash
curl https://mission-control-v2-production.up.railway.app/health
```

The dashboard should now show real agents from Clawdbot instead of mock data.
