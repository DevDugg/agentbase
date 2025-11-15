import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

export interface AgentConfig {
  name: string;
  config_path: string;
  env: Record<string, string>;
  volumes?: {
    workspace: string;
    sessions: string;
  };
}

export interface WorkforceConfig {
  version: string;
  agents: AgentConfig[];
  redis?: {
    url: string;
    port?: number;
  };
  metrics?: {
    port?: number;
    enabled?: boolean;
  };
}

export class ConfigParser {
  static parseWorkforceConfig(yamlPath: string): WorkforceConfig {
    try {
      const content = fs.readFileSync(yamlPath, 'utf8');
      const config = yaml.load(content) as WorkforceConfig;

      // Validate required fields
      if (!config.agents || !Array.isArray(config.agents)) {
        throw new Error('Invalid workforce config: missing agents array');
      }

      // Validate each agent
      config.agents.forEach((agent, index) => {
        if (!agent.name) {
          throw new Error(`Agent at index ${index} missing name`);
        }
        if (!agent.config_path) {
          throw new Error(`Agent ${agent.name} missing config_path`);
        }
      });

      return config;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse workforce config: ${error.message}`);
      }
      throw error;
    }
  }

  static loadSystemPrompt(promptPath: string): string {
    try {
      const fullPath = path.resolve(promptPath);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`System prompt file not found: ${fullPath}`);
      }
      return fs.readFileSync(fullPath, 'utf-8');
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Failed to load system prompt: ${error.message}`);
      }
      return 'You are a helpful AI assistant.';
    }
  }

  static validateEnvironment(agentConfig: AgentConfig): void {
    const requiredEnvVars = ['ANTHROPIC_API_KEY', 'DISCORD_BOT_TOKEN'];

    requiredEnvVars.forEach(envVar => {
      const value = agentConfig.env[envVar] || process.env[envVar];
      if (!value) {
        throw new Error(
          `Missing required environment variable ${envVar} for agent ${agentConfig.name}`
        );
      }
    });
  }

  static generateDockerCompose(config: WorkforceConfig, outputPath: string): void {
    const services: Record<string, any> = {
      redis: {
        image: 'redis:7-alpine',
        container_name: 'agentbase-redis',
        ports: [`${config.redis?.port || 6379}:6379`],
        networks: ['agent-network'],
        healthcheck: {
          test: ['CMD', 'redis-cli', 'ping'],
          interval: '10s',
          timeout: '5s',
          retries: 5
        }
      }
    };

    // Add agent services
    config.agents.forEach(agent => {
      const serviceName = `agent-${agent.name.toLowerCase()}`;
      services[serviceName] = {
        build: {
          context: '.',
          args: {
            AGENT_CONFIG_PATH: agent.config_path
          }
        },
        container_name: `agentbase-${agent.name.toLowerCase()}`,
        environment: [
          `AGENT_ID=${agent.name.toLowerCase()}`,
          `REDIS_URL=${config.redis?.url || 'redis://redis:6379'}`,
          ...Object.entries(agent.env).map(([key, value]) => `${key}=${value}`)
        ],
        volumes: agent.volumes
          ? [`${agent.name.toLowerCase()}-workspace:/agent-workspace`]
          : [],
        networks: ['agent-network'],
        depends_on: ['redis']
      };
    });

    // Add metrics API service
    if (config.metrics?.enabled !== false) {
      services['metrics-api'] = {
        build: {
          context: '.',
          dockerfile: 'Dockerfile.metrics'
        },
        container_name: 'agentbase-metrics',
        ports: [`${config.metrics?.port || 3001}:3001`],
        environment: [
          `REDIS_URL=${config.redis?.url || 'redis://redis:6379'}`
        ],
        networks: ['agent-network'],
        depends_on: ['redis']
      };
    }

    const dockerCompose = {
      version: '3.8',
      services,
      volumes: config.agents.reduce((acc, agent) => {
        acc[`${agent.name.toLowerCase()}-workspace`] = null;
        return acc;
      }, {} as Record<string, null>),
      networks: {
        'agent-network': {
          driver: 'bridge'
        }
      }
    };

    fs.writeFileSync(outputPath, yaml.dump(dockerCompose, { lineWidth: -1 }));
    console.log(`Generated docker-compose.yml at ${outputPath}`);
  }
}
