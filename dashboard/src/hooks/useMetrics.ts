import { useEffect, useState } from "react";
import axios from "axios";

export interface AgentMetrics {
  agentId: string;
  status: string;
  uptime: string;
  tasksCompleted: number;
  cpu: number;
  memory: number;
  lastUpdated: number;
}

export interface SystemMetrics {
  totalAgents: number;
  activeAgents: number;
  agents: AgentMetrics[];
  timestamp: number;
}

export interface SystemStats {
  totalAgents: number;
  activeAgents: number;
  totalTasksCompleted: number;
  averageCpu: number;
  averageMemory: number;
  efficiency: number;
  errorRate: number;
  timestamp: number;
}

interface UseMetricsOptions {
  refreshInterval?: number;
  autoRefresh?: boolean;
}

export function useMetrics(apiUrl: string, options: UseMetricsOptions = {}) {
  const { refreshInterval = 5000, autoRefresh = true } = options;

  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = async () => {
    try {
      const metricsResponse = await axios.get<SystemMetrics>(
        `${apiUrl}/api/metrics`
      );
      setMetrics(metricsResponse.data);

      try {
        const statsResponse = await axios.get<SystemStats>(
          `${apiUrl}/api/stats`
        );
        setStats(statsResponse.data);
      } catch (statsError) {
        console.warn("Failed to fetch system stats:", statsError);
      }

      setError(null);
    } catch (err) {
      console.error("Failed to fetch metrics:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [apiUrl, refreshInterval, autoRefresh]);

  return {
    metrics,
    stats,
    loading,
    error,
    refetch: fetchMetrics,
  };
}

export function useAgentMetrics(apiUrl: string, agentId: string) {
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAgentMetrics = async () => {
      try {
        const response = await axios.get<AgentMetrics>(
          `${apiUrl}/api/metrics/${agentId}`
        );
        setMetrics(response.data);
        setError(null);
      } catch (err) {
        console.error(`Failed to fetch metrics for ${agentId}:`, err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentMetrics();
    const interval = setInterval(fetchAgentMetrics, 10000);

    return () => clearInterval(interval);
  }, [apiUrl, agentId]);

  return { metrics, loading, error };
}
