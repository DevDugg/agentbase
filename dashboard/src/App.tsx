import { useState, useEffect } from 'react';
import { useMetrics } from './hooks/useMetrics';
import { useWebSocket } from './hooks/useWebSocket';
import { MetricsOverview } from './components/MetricsOverview';
import { AgentCard } from './components/AgentCard';
import { ActivityLogs } from './components/ActivityLogs';
import { SystemHealth } from './components/SystemHealth';
import { Search, Filter, Download, RefreshCw } from 'lucide-react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

interface Activity {
  agentId: string;
  timestamp: number;
  action: string;
  content: string;
}

function App() {
  const { metrics, loading, error, refetch } = useMetrics(API_URL);
  const { isConnected, lastMessage } = useWebSocket(WS_URL);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'activity') {
        setActivities((prev) => [...prev, lastMessage.data].slice(-50));
      } else if (lastMessage.type === 'metrics_update') {
        // Metrics are already being refreshed by the useMetrics hook
        refetch();
      }
    }
  }, [lastMessage, refetch]);

  if (loading) {
    return (
      <div className="dashboard loading">
        <div className="loading-message">INITIALIZING AGENTBASE SYSTEM...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard error">
        <div className="error-message">
          ERROR: FAILED TO CONNECT TO METRICS API
          <br />
          {error.message}
        </div>
      </div>
    );
  }

  const totalTasks = metrics?.agents.reduce((sum, agent) => sum + agent.tasksCompleted, 0) || 0;
  const avgCpu = metrics?.agents.length
    ? metrics.agents.reduce((sum, agent) => sum + agent.cpu, 0) / metrics.agents.length
    : 0;

  const filteredAgents = metrics?.agents.filter(agent =>
    searchQuery === '' || agent.agentId.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>AGENTBASE WORKFORCE MANAGEMENT SYSTEM</h1>
          <div className="header-subtitle">v1.0.0 | MULTI-AGENT COORDINATION</div>
        </div>
        <SystemHealth isConnected={isConnected} />
      </header>

      <MetricsOverview
        totalAgents={metrics?.totalAgents || 0}
        activeAgents={metrics?.activeAgents || 0}
        completedToday={totalTasks}
        avgEfficiency={15.4}
        systemLoad={avgCpu}
        errorRate={0.2}
      />

      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={16} />
          <input
            type="text"
            placeholder="SEARCH AGENTS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="toolbar-btn">
          <Filter size={16} />
          FILTER
        </button>
        <button className="toolbar-btn">
          <Download size={16} />
          EXPORT
        </button>
        <button className="toolbar-btn" onClick={refetch}>
          <RefreshCw size={16} />
          REFRESH
        </button>
      </div>

      <section className="agent-roster">
        <h2>AGENT ROSTER</h2>
        {filteredAgents.length === 0 ? (
          <div className="no-agents">
            {searchQuery ? `NO AGENTS MATCH "${searchQuery}"` : 'NO AGENTS AVAILABLE'}
          </div>
        ) : (
          <div className="agent-grid">
            {filteredAgents.map((agent) => (
              <AgentCard key={agent.agentId} agent={agent} />
            ))}
          </div>
        )}
      </section>

      <ActivityLogs activities={activities} maxItems={10} />

      <footer className="dashboard-footer">
        <div className="footer-info">
          SYSTEM TIME: {new Date().toLocaleString('en-US', { hour12: false })}
        </div>
        <div className="footer-info">
          REDIS: CONNECTED | AGENTS: {metrics?.activeAgents}/{metrics?.totalAgents}
        </div>
      </footer>
    </div>
  );
}

export default App;
