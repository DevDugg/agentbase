import React from 'react';
import { AgentMetrics } from '../hooks/useMetrics';
import { Power, Activity, Clock } from 'lucide-react';

interface AgentCardProps {
  agent: AgentMetrics;
}

export function AgentCard({ agent }: AgentCardProps) {
  const statusColor = agent.status === 'online' ? 'green' : 'red';

  return (
    <div className="agent-card">
      <div className="agent-header">
        <h3>{agent.agentId.toUpperCase()}</h3>
        <span className={`status-badge status-${statusColor}`}>
          {agent.status.toUpperCase()}
        </span>
      </div>

      <div className="agent-stats">
        <div className="stat">
          <Activity size={14} />
          <span className="stat-label">CURRENT_TASK</span>
          <span className="stat-value">Idle</span>
        </div>
        <div className="stat">
          <Clock size={14} />
          <span className="stat-label">UPTIME</span>
          <span className="stat-value">{agent.uptime}</span>
        </div>
        <div className="stat">
          <span className="stat-label">TASKS_COMPLETED</span>
          <span className="stat-value">{agent.tasksCompleted}</span>
        </div>
      </div>

      <div className="resource-usage">
        <div className="usage-bar">
          <label>CPU</label>
          <div className="bar">
            <div
              className="fill"
              style={{ width: `${Math.min(agent.cpu, 100)}%` }}
            />
          </div>
          <span>{agent.cpu.toFixed(1)}%</span>
        </div>
        <div className="usage-bar">
          <label>MEMORY</label>
          <div className="bar">
            <div
              className="fill"
              style={{ width: `${Math.min(agent.memory, 100)}%` }}
            />
          </div>
          <span>{agent.memory.toFixed(1)}%</span>
        </div>
      </div>

      <div className="agent-actions">
        <button className="action-btn">VIEW LOGS</button>
        <button className="action-btn">CONFIGURE</button>
        <button className="action-btn icon-btn">
          <Power size={14} />
        </button>
      </div>
    </div>
  );
}
