# AgentBase Setup Guide

Quick guide to get your multi-agent Discord infrastructure running.

## Prerequisites

- Node.js 20+
- Docker Desktop
- Discord account
- Anthropic API key (get from https://console.anthropic.com/)

## Step 1: Create Discord Bots

For each agent you want to deploy, create a Discord bot:

### Dev Workforce (3 bots)
- **Backend** - Senior Backend Engineer
- **DevOps** - Senior DevOps Engineer
- **Frontend** - Senior Frontend Engineer

### Creating Each Bot:

1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Name it (e.g., "Backend Engineer", "DevOps Engineer", "Frontend Engineer")
4. Go to **Bot** section:
   - Click "Add Bot"
   - Click "Reset Token" and copy it (save for later!)
   - Enable **"Message Content Intent"** under Privileged Gateway Intents
   - Optional: Upload custom avatar, set status
5. Go to **OAuth2** → **URL Generator**:
   - Select scopes: `bot`
   - Select permissions:
     - ✅ Read Messages/View Channels
     - ✅ Send Messages
     - ✅ Embed Links
     - ✅ Read Message History
   - Copy the generated URL
   - Open URL in browser and invite to your server

**Repeat for all 3 bots!**

## Step 2: Get Anthropic API Keys

1. Go to https://console.anthropic.com/
2. Sign in or create account
3. Go to API Keys section
4. Create 3 separate API keys (one per agent)
   - Or use the same key for all (simpler but less isolated)

## Step 3: Configure Environment Variables

```bash
cd backend
cp .env.example .env
```

Edit `.env` file with your actual tokens:

```bash
# Agent Backend
BACKEND_API_KEY=sk-ant-api03-YOUR_ACTUAL_KEY_HERE
BACKEND_DISCORD_TOKEN=YOUR_ACTUAL_DISCORD_TOKEN_HERE

# Agent DevOps
DEVOPS_API_KEY=sk-ant-api03-YOUR_ACTUAL_KEY_HERE
DEVOPS_DISCORD_TOKEN=YOUR_ACTUAL_DISCORD_TOKEN_HERE

# Agent Frontend
FRONTEND_API_KEY=sk-ant-api03-YOUR_ACTUAL_KEY_HERE
FRONTEND_DISCORD_TOKEN=YOUR_ACTUAL_DISCORD_TOKEN_HERE
```

**Important:**
- Each `DISCORD_TOKEN` must be **different** (from different Discord applications)
- API keys can be the same or different (your choice)
- Don't commit the `.env` file to git (already in .gitignore)

## Step 4: Install Dependencies

```bash
# Backend
cd backend
npm install

# Dashboard (optional, if you want the web UI)
cd ../dashboard
npm install
```

## Step 5: Start with Docker Compose

```bash
cd backend
docker-compose up --build
```

You should see:
```
✅ agentbase-redis       | Ready to accept connections
✅ agentbase-backend     | Connected to Discord
✅ agentbase-devops      | Connected to Discord
✅ agentbase-frontend    | Connected to Discord
✅ agentbase-metrics     | Metrics API running on port 3001
```

## Step 6: Test in Discord

In your Discord server, you should now see the bots online!

Try mentioning them:
```
@Backend Help me design a REST API for a todo app
@DevOps Set up a CI/CD pipeline for my project
@Frontend Create a responsive navbar component
```

Or send them DMs directly!

## Step 7: Start Dashboard (Optional)

The React dashboard provides real-time monitoring:

```bash
cd dashboard
npm run dev
```

Open http://localhost:5173 to see:
- Agent status and metrics
- CPU/Memory usage
- Tasks completed
- Real-time activity logs

## Troubleshooting

### "Variable is not set" warnings

**Problem:**
```
The "BACKEND_API_KEY" variable is not set. Defaulting to a blank string.
```

**Solution:**
- Make sure you created `.env` file (not `.env.example`)
- Check that `.env` is in the `backend/` directory
- Verify tokens are on the correct lines (no extra spaces)

### Bots not responding in Discord

**Problem:** Bots are online but don't respond

**Possible causes:**
1. **Message Content Intent not enabled**
   - Go to Discord Developer Portal → Your App → Bot
   - Enable "Message Content Intent"
   - Restart containers: `docker-compose restart`

2. **Bot not mentioned correctly**
   - Use `@BotName` (not just typing the name)
   - Or send a DM directly to the bot

3. **Check logs:**
   ```bash
   docker logs agentbase-backend
   docker logs agentbase-devops
   docker logs agentbase-frontend
   ```

### "Failed to connect to Redis"

**Problem:** Agents can't connect to Redis

**Solution:**
```bash
# Check if Redis is running
docker ps | grep redis

# If not, restart everything
docker-compose down
docker-compose up --build
```

### High API costs

**Problem:** Worried about Anthropic API costs

**Tips:**
- Each message costs ~$0.003 - $0.015 depending on length
- Estimated: $15-30/month for moderate usage (1000 messages/agent)
- Set billing limits in Anthropic Console
- Use Claude Haiku for cheaper option (modify agent code)

## Next Steps

### Customize Agent Personalities

Edit the `CLAUDE.md` files:
- `backend/examples/dev-workforce/agent-backend/CLAUDE.md`
- `backend/examples/dev-workforce/agent-devops/CLAUDE.md`
- `backend/examples/dev-workforce/agent-frontend/CLAUDE.md`

After editing, restart containers:
```bash
docker-compose restart
```

### Add More Agents

1. Create new directory in `backend/examples/dev-workforce/`
2. Add `CLAUDE.md` with system prompt
3. Add credentials to `.env`
4. Add service to `docker-compose.yml`
5. Rebuild: `docker-compose up --build`

### Deploy to Production

See the main README.md for deployment options:
- Fly.io (recommended, ~$6/month)
- Railway
- AWS ECS
- Google Cloud Run

## Support

- Issues: https://github.com/anthropics/claude-code/issues
- Discord: Create your own server for testing
- Docs: Check the README.md files in each directory

---

**You're all set! 🎉**

Your AI agent workforce is ready to help in Discord!
