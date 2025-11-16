import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createClient, RedisClientType } from 'redis';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

interface AgentMetrics {
  agentId: string;
  status: string;
  uptime: string;
  tasksCompleted: number;
  cpu: number;
  memory: number;
  lastUpdated: number;
}

interface SystemMetrics {
  totalAgents: number;
  activeAgents: number;
  agents: AgentMetrics[];
  timestamp: number;
}

class MetricsAPI {
  private app: express.Application;
  private server: ReturnType<typeof createServer>;
  private wss: WebSocketServer;
  private redis: RedisClientType;
  private subscriber: RedisClientType;
  private port: number;

  constructor(port: number = 3001) {
    this.port = port;
    this.app = express();
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });

    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.subscriber = this.redis.duplicate();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupMiddleware(): void {
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }));
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    // Get all metrics
    this.app.get('/api/metrics', async (req, res) => {
      try {
        const metrics = await this.getAllMetrics();
        res.json(metrics);
      } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({ error: 'Failed to fetch metrics' });
      }
    });

    // Get specific agent metrics
    this.app.get('/api/metrics/:agentId', async (req, res) => {
      try {
        const { agentId } = req.params;
        const metrics = await this.getAgentMetrics(agentId);

        if (!metrics) {
          res.status(404).json({ error: 'Agent not found' });
          return;
        }

        res.json(metrics);
      } catch (error) {
        console.error('Error fetching agent metrics:', error);
        res.status(500).json({ error: 'Failed to fetch agent metrics' });
      }
    });

    // Get activity logs
    this.app.get('/api/activity', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 50;
        const activities = await this.getRecentActivity(limit);
        res.json({ activities, count: activities.length });
      } catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ error: 'Failed to fetch activity' });
      }
    });

    // System stats
    this.app.get('/api/stats', async (req, res) => {
      try {
        const stats = await this.getSystemStats();
        res.json(stats);
      } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
      }
    });
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('Dashboard client connected');

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      ws.on('close', () => {
        console.log('Dashboard client disconnected');
      });

      // Send initial metrics
      this.getAllMetrics().then(metrics => {
        ws.send(JSON.stringify({
          type: 'initial_metrics',
          data: metrics
        }));
      });
    });
  }

  private async subscribeToRedis(): Promise<void> {
    await this.subscriber.subscribe('agent-activity', (message) => {
      // Broadcast to all connected WebSocket clients
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'activity',
            data: JSON.parse(message)
          }));
        }
      });
    });

    // Also subscribe to metrics updates
    await this.subscriber.pSubscribe('agent:*:activity', async (message, channel) => {
      const agentId = channel.split(':')[1];
      const metrics = await this.getAgentMetrics(agentId);

      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'metrics_update',
            data: metrics
          }));
        }
      });
    });

    console.log('Subscribed to Redis channels');
  }

  private async getAllMetrics(): Promise<SystemMetrics> {
    const keys = await this.redis.keys('agent:*:activity');
    const agents: AgentMetrics[] = [];

    for (const key of keys) {
      const data = await this.redis.hGetAll(key);
      if (data && Object.keys(data).length > 0) {
        const agentId = key.split(':')[1];
        agents.push({
          agentId,
          status: data.status || 'unknown',
          uptime: data.uptime || '0s',
          tasksCompleted: parseInt(data.tasks_completed || '0'),
          cpu: parseFloat(data.cpu || '0'),
          memory: parseFloat(data.memory || '0'),
          lastUpdated: parseInt(data.last_updated || '0')
        });
      }
    }

    const activeAgents = agents.filter(a => a.status === 'online').length;

    return {
      totalAgents: agents.length,
      activeAgents,
      agents,
      timestamp: Date.now()
    };
  }

  private async getAgentMetrics(agentId: string): Promise<AgentMetrics | null> {
    const data = await this.redis.hGetAll(`agent:${agentId}:activity`);

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      agentId,
      status: data.status || 'unknown',
      uptime: data.uptime || '0s',
      tasksCompleted: parseInt(data.tasks_completed || '0'),
      cpu: parseFloat(data.cpu || '0'),
      memory: parseFloat(data.memory || '0'),
      lastUpdated: parseInt(data.last_updated || '0')
    };
  }

  private async getRecentActivity(limit: number): Promise<any[]> {
    // This is a simplified version - in production you'd want to store activities in a list
    const activities: any[] = [];
    // For now, return empty array - activities will be real-time via WebSocket
    return activities;
  }

  private async getSystemStats(): Promise<any> {
    const metrics = await this.getAllMetrics();
    const totalTasks = metrics.agents.reduce((sum, agent) => sum + agent.tasksCompleted, 0);

    const avgCpu = metrics.agents.length > 0
      ? metrics.agents.reduce((sum, agent) => sum + agent.cpu, 0) / metrics.agents.length
      : 0;

    const avgMemory = metrics.agents.length > 0
      ? metrics.agents.reduce((sum, agent) => sum + agent.memory, 0) / metrics.agents.length
      : 0;

    const efficiency = metrics.totalAgents > 0
      ? (metrics.activeAgents / metrics.totalAgents) * 100
      : 0;

    const errorRate = metrics.totalAgents > 0
      ? ((metrics.totalAgents - metrics.activeAgents) / metrics.totalAgents) * 100
      : 0;

    return {
      totalAgents: metrics.totalAgents,
      activeAgents: metrics.activeAgents,
      totalTasksCompleted: totalTasks,
      averageCpu: Number(avgCpu.toFixed(2)),
      averageMemory: Number(avgMemory.toFixed(2)),
      efficiency: Number(efficiency.toFixed(2)),
      errorRate: Number(errorRate.toFixed(2)),
      timestamp: Date.now()
    };
  }

  async start(): Promise<void> {
    try {
      // Connect to Redis
      await this.redis.connect();
      await this.subscriber.connect();
      console.log('Connected to Redis');

      // Subscribe to Redis channels
      await this.subscribeToRedis();

      // Start HTTP server
      this.server.listen(this.port, () => {
        console.log(`Metrics API running on port ${this.port}`);
        console.log(`WebSocket server running on ws://localhost:${this.port}`);
      });
    } catch (error) {
      console.error('Failed to start Metrics API:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    console.log('Shutting down Metrics API...');

    // Close WebSocket connections
    this.wss.clients.forEach(client => client.close());
    this.wss.close();

    // Close Redis connections
    await this.subscriber.unsubscribe();
    await this.subscriber.quit();
    await this.redis.quit();

    // Close HTTP server
    this.server.close();

    console.log('Metrics API shut down');
  }
}

// Start the server
const metricsAPI = new MetricsAPI(parseInt(process.env.METRICS_PORT || '3001'));

metricsAPI.start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  await metricsAPI.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  await metricsAPI.stop();
  process.exit(0);
});

export { MetricsAPI };
