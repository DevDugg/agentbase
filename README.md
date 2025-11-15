# AgentBase - Multi-Agent Claude Discord Infrastructure

A scalable, modular, multi-agent Discord infrastructure powered by Claude Agent SDK, TypeScript, Redis, and Docker—with a real-time React dashboard for monitoring and management.

## Features

- **Multi-Agent Coordination**: Deploy multiple specialized AI agents with unique personalities and capabilities
- **Discord Integration**: Each agent runs as a Discord bot, responding to mentions and direct messages
- **Real-time Monitoring**: Live dashboard showing agent status, metrics, and activity logs
- **Containerized Deployment**: Docker-based architecture for easy scaling and isolation
- **Redis Coordination**: Inter-agent communication and metrics via Redis pub/sub
- **TypeScript**: Fully typed codebase for reliability and maintainability

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Dashboard                          │
│  (Real-time WebSocket + REST API for metrics)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
              ┌────────▼─────────┐
              │   Metrics API    │
              │  (Express + WS)  │
              └────────┬─────────┘
                       │
              ┌────────▼─────────┐
              │      Redis       │
              │   Pub/Sub + KV   │
              └────────┬─────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
  ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
  │ Agent   │    │ Agent   │    │ Agent   │
  │ Denver  │    │ Phoenix │    │ Sierra  │
  └─────────┘    └─────────┘    └─────────┘
       │               │               │
       └───────────────┴───────────────┘
                       │
              ┌────────▼─────────┐
              │     Discord      │
              └──────────────────┘
```

## Project Structure

```
agentbase/
├── backend/
│   ├── src/
│   │   ├── agent.ts              # Main agent wrapper class
│   │   ├── coordinator.ts        # Redis coordination layer
│   │   ├── config-parser.ts      # YAML config parser
│   │   ├── metrics-api.ts        # Express + WebSocket API
│   │   └── index.ts              # Agent entrypoint
│   ├── examples/
│   │   └── sample-workforce/
│   │       ├── agent-denver/     # Technical support agent
│   │       ├── agent-phoenix/    # Creative content agent
│   │       ├── agent-sierra/     # Research & analysis agent
│   │       └── workforce.yaml    # Team configuration
│   ├── Dockerfile
│   ├── Dockerfile.metrics
│   ├── docker-compose.yml
│   └── package.json
├── dashboard/
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── hooks/                # Custom hooks
│   │   ├── App.tsx               # Main app component
│   │   └── main.tsx              # Entry point
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Discord bot tokens (one per agent)
- Anthropic API keys (one per agent)

### Step 1: Set Up Discord Bots

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create 3 applications (Denver, Phoenix, Sierra)
3. For each application:
   - Go to "Bot" section
   - Click "Add Bot"
   - Copy the bot token
   - Enable "Message Content Intent" under Privileged Gateway Intents
   - Go to OAuth2 > URL Generator
   - Select `bot` scope and `Send Messages`, `Read Messages/View Channels` permissions
   - Use the generated URL to invite the bot to your server

### Step 2: Configure Environment Variables

```bash
cd backend
cp .env.example .env
```

Edit `.env` and add your API keys and bot tokens:

```env
DENVER_API_KEY=sk-ant-api03-your-denver-key
DENVER_DISCORD_TOKEN=your-denver-bot-token

PHOENIX_API_KEY=sk-ant-api03-your-phoenix-key
PHOENIX_DISCORD_TOKEN=your-phoenix-bot-token

SIERRA_API_KEY=sk-ant-api03-your-sierra-key
SIERRA_DISCORD_TOKEN=your-sierra-bot-token
```

### Step 3: Start the Backend

```bash
cd backend

# Install dependencies
npm install

# Start with Docker Compose
docker-compose up --build
```

This will start:
- Redis (port 6379)
- Agent Denver
- Agent Phoenix
- Agent Sierra
- Metrics API (port 3001)

### Step 4: Start the Dashboard

```bash
cd dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

The dashboard will be available at [http://localhost:5173](http://localhost:5173)

## Usage

### Interacting with Agents

In Discord, mention an agent or send it a direct message:

```
@Denver My computer won't boot, what should I do?
@Phoenix Help me write a blog post about productivity
@Sierra What are the latest trends in renewable energy?
```

### Customizing Agents

Each agent has its own system prompt in `backend/examples/sample-workforce/agent-{name}/CLAUDE.md`. Edit these files to customize agent behavior.

### Adding New Agents

1. Create a new directory: `backend/examples/sample-workforce/agent-{name}/`
2. Add a `CLAUDE.md` file with the system prompt
3. Add the agent to `workforce.yaml`:

```yaml
agents:
  - name: "yourname"
    config_path: "examples/sample-workforce/agent-yourname"
    env:
      ANTHROPIC_API_KEY: "${YOURNAME_API_KEY}"
      DISCORD_BOT_TOKEN: "${YOURNAME_DISCORD_TOKEN}"
    volumes:
      workspace: "/agent-workspace"
```

4. Add the agent service to `docker-compose.yml` (or regenerate using the config parser)
5. Update your `.env` file with the new credentials

## Development

### Backend Development

```bash
cd backend

# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Run metrics API separately
npm run metrics
```

### Dashboard Development

```bash
cd dashboard

# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## API Endpoints

### Metrics API

- `GET /health` - Health check
- `GET /api/metrics` - Get all agent metrics
- `GET /api/metrics/:agentId` - Get specific agent metrics
- `GET /api/activity` - Get recent activity logs
- `GET /api/stats` - Get system statistics
- `WebSocket ws://localhost:3001` - Real-time updates

### Example Response

```json
{
  "totalAgents": 3,
  "activeAgents": 3,
  "agents": [
    {
      "agentId": "denver",
      "status": "online",
      "uptime": "2h 15m",
      "tasksCompleted": 42,
      "cpu": 12.5,
      "memory": 35.8,
      "lastUpdated": 1703123456789
    }
  ],
  "timestamp": 1703123456789
}
```

## Deployment

### Production Deployment

1. **Backend**: Deploy to any Docker-compatible platform (AWS ECS, Fly.io, Railway, etc.)
2. **Dashboard**: Deploy to Vercel, Netlify, or any static hosting
3. **Redis**: Use a managed Redis service (Upstash, Redis Cloud, AWS ElastiCache)

### Environment-Specific Configuration

For production, update `docker-compose.yml` and environment variables accordingly.

### Estimated Costs

| Component | Service | Cost |
|-----------|---------|------|
| 3 Agents | Fly.io | $5.82/mo |
| Redis | Upstash Free | $0 |
| Metrics API | Railway | $5/mo |
| Dashboard | Vercel | $0 |
| **Total** | | **~$11/mo** |

## Troubleshooting

### Agents Not Connecting to Discord

- Verify bot tokens are correct
- Ensure "Message Content Intent" is enabled in Discord Developer Portal
- Check that bots are invited to your server

### Dashboard Not Showing Metrics

- Ensure Metrics API is running on port 3001
- Check CORS settings in `metrics-api.ts`
- Verify Redis is accessible

### WebSocket Connection Failed

- Check firewall settings
- Ensure WS_URL in dashboard `.env` is correct
- Verify Metrics API is running

## Architecture Details

### Agent Lifecycle

1. Agent initializes with system prompt from `CLAUDE.md`
2. Connects to Redis for coordination
3. Logs into Discord
4. Starts metrics reporting (every 10 seconds)
5. Listens for Discord messages
6. Processes messages via Claude API
7. Publishes activity to Redis
8. Updates metrics in Redis

### Metrics Flow

1. Agents publish metrics to Redis (`agent:{id}:activity`)
2. Agents publish activities to Redis pub/sub (`agent-activity`)
3. Metrics API subscribes to Redis channels
4. Metrics API broadcasts to WebSocket clients
5. Dashboard receives real-time updates

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT

## Credits

Built with:
- [Claude Agent SDK](https://github.com/anthropics/anthropic-sdk-typescript)
- [Discord.js](https://discord.js.org/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Redis](https://redis.io/)
- [Docker](https://www.docker.com/)
#   a g e n t b a s e  
 