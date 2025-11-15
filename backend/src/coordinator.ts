import { createClient, RedisClientType } from 'redis';

export interface TaskMessage {
  taskId: string;
  agentId: string;
  priority: number;
  payload: any;
  timestamp: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface AgentStatus {
  agentId: string;
  status: 'online' | 'offline' | 'busy';
  currentTask?: string;
  tasksCompleted: number;
  uptime: string;
  lastSeen: number;
}

export class RedisCoordinator {
  private redis: RedisClientType;
  private subscriber: RedisClientType;
  private agentId: string;
  private taskHandlers: Map<string, (task: TaskMessage) => Promise<void>>;

  constructor(agentId: string, redisUrl?: string) {
    this.agentId = agentId;
    this.taskHandlers = new Map();

    this.redis = createClient({
      url: redisUrl || process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.subscriber = this.redis.duplicate();

    this.redis.on('error', (err) => {
      console.error(`[Coordinator:${agentId}] Redis error:`, err);
    });

    this.subscriber.on('error', (err) => {
      console.error(`[Coordinator:${agentId}] Subscriber error:`, err);
    });
  }

  async connect(): Promise<void> {
    await this.redis.connect();
    await this.subscriber.connect();
    console.log(`[Coordinator:${this.agentId}] Connected to Redis`);

    // Subscribe to agent-specific channel
    await this.subscriber.subscribe(
      `agent:${this.agentId}:tasks`,
      this.handleIncomingTask.bind(this)
    );

    // Subscribe to broadcast channel
    await this.subscriber.subscribe(
      'agent:broadcast',
      this.handleBroadcast.bind(this)
    );
  }

  async disconnect(): Promise<void> {
    await this.subscriber.unsubscribe();
    await this.subscriber.quit();
    await this.redis.quit();
    console.log(`[Coordinator:${this.agentId}] Disconnected from Redis`);
  }

  registerTaskHandler(taskType: string, handler: (task: TaskMessage) => Promise<void>): void {
    this.taskHandlers.set(taskType, handler);
  }

  private async handleIncomingTask(message: string): Promise<void> {
    try {
      const task: TaskMessage = JSON.parse(message);
      console.log(`[Coordinator:${this.agentId}] Received task:`, task.taskId);

      // Update task status to in_progress
      await this.updateTaskStatus(task.taskId, 'in_progress');

      // Find appropriate handler
      const handler = this.taskHandlers.get(task.payload.type);
      if (handler) {
        await handler(task);
        await this.updateTaskStatus(task.taskId, 'completed');
      } else {
        console.warn(`[Coordinator:${this.agentId}] No handler for task type: ${task.payload.type}`);
        await this.updateTaskStatus(task.taskId, 'failed');
      }
    } catch (error) {
      console.error(`[Coordinator:${this.agentId}] Error handling task:`, error);
    }
  }

  private async handleBroadcast(message: string): Promise<void> {
    try {
      const broadcast = JSON.parse(message);
      console.log(`[Coordinator:${this.agentId}] Received broadcast:`, broadcast);

      // Handle different broadcast types
      switch (broadcast.type) {
        case 'shutdown':
          console.log(`[Coordinator:${this.agentId}] Shutdown signal received`);
          break;
        case 'status_check':
          await this.publishStatus();
          break;
        default:
          console.log(`[Coordinator:${this.agentId}] Unknown broadcast type: ${broadcast.type}`);
      }
    } catch (error) {
      console.error(`[Coordinator:${this.agentId}] Error handling broadcast:`, error);
    }
  }

  async publishTask(targetAgent: string, taskPayload: any, priority: number = 5): Promise<string> {
    const taskId = `task:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    const task: TaskMessage = {
      taskId,
      agentId: targetAgent,
      priority,
      payload: taskPayload,
      timestamp: Date.now(),
      status: 'pending'
    };

    // Store task in Redis
    await this.redis.hSet(`task:${taskId}`, {
      data: JSON.stringify(task),
      status: 'pending',
      created_at: Date.now().toString()
    });

    // Publish to agent-specific channel
    await this.redis.publish(`agent:${targetAgent}:tasks`, JSON.stringify(task));

    console.log(`[Coordinator:${this.agentId}] Published task ${taskId} to ${targetAgent}`);
    return taskId;
  }

  async broadcastMessage(message: any): Promise<void> {
    await this.redis.publish('agent:broadcast', JSON.stringify(message));
  }

  async updateTaskStatus(taskId: string, status: TaskMessage['status']): Promise<void> {
    await this.redis.hSet(`task:${taskId}`, {
      status,
      updated_at: Date.now().toString()
    });
  }

  async getTaskStatus(taskId: string): Promise<TaskMessage['status'] | null> {
    const status = await this.redis.hGet(`task:${taskId}`, 'status');
    return status as TaskMessage['status'] | null;
  }

  async publishStatus(): Promise<void> {
    const status: AgentStatus = {
      agentId: this.agentId,
      status: 'online',
      tasksCompleted: 0,
      uptime: '0m',
      lastSeen: Date.now()
    };

    await this.redis.hSet(`agent:${this.agentId}:status`, {
      data: JSON.stringify(status),
      last_updated: Date.now().toString()
    });
  }

  async getAllAgentStatuses(): Promise<AgentStatus[]> {
    const keys = await this.redis.keys('agent:*:status');
    const statuses: AgentStatus[] = [];

    for (const key of keys) {
      const data = await this.redis.hGet(key, 'data');
      if (data) {
        statuses.push(JSON.parse(data));
      }
    }

    return statuses;
  }

  async acquireLock(resource: string, ttl: number = 30000): Promise<boolean> {
    const lockKey = `lock:${resource}`;
    const result = await this.redis.set(lockKey, this.agentId, {
      NX: true,
      PX: ttl
    });
    return result === 'OK';
  }

  async releaseLock(resource: string): Promise<void> {
    const lockKey = `lock:${resource}`;
    const owner = await this.redis.get(lockKey);
    if (owner === this.agentId) {
      await this.redis.del(lockKey);
    }
  }
}
