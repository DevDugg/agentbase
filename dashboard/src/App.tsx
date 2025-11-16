import { useState, useEffect, useMemo } from "react";
import { useMetrics } from "./hooks/useMetrics";
import { useWebSocket } from "./hooks/useWebSocket";
import { MetricsOverview } from "./components/MetricsOverview";
import { AgentCard } from "./components/AgentCard";
import { ActivityLogs } from "./components/ActivityLogs";
import { SystemHealth } from "./components/SystemHealth";
import { Search, Filter, Download, RefreshCw } from "lucide-react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3001";

interface Activity {
  agentId: string;
  timestamp: number;
  action: string;
  content: string;
}

type AgentStatusFilter = "all" | "online" | "offline";

function App() {
  const { metrics, stats, loading, error, refetch } = useMetrics(API_URL);
  const { isConnected, lastMessage } = useWebSocket(WS_URL);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<AgentStatusFilter>("all");
  const [highLoadOnly, setHighLoadOnly] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    text: string;
    tone: "success" | "warning";
  } | null>(null);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === "activity") {
        setActivities((prev) => [...prev, lastMessage.data].slice(-50));
      } else if (lastMessage.type === "metrics_update") {
        // Metrics are already being refreshed by the useMetrics hook
        refetch();
      }
    }
  }, [lastMessage, refetch]);

  useEffect(() => {
    if (!showFilterMenu) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof HTMLElement)) {
        return;
      }
      if (!event.target.closest(".filter-control")) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showFilterMenu]);

  useEffect(() => {
    if (!exportStatus) {
      return;
    }

    const timer = setTimeout(() => setExportStatus(null), 4000);
    return () => clearTimeout(timer);
  }, [exportStatus]);

  const filteredAgents = useMemo(() => {
    if (!metrics?.agents) {
      return [];
    }

    return metrics.agents.filter((agent) => {
      const matchesSearch =
        searchQuery === "" ||
        agent.agentId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || agent.status.toLowerCase() === filterStatus;
      const matchesLoad = !highLoadOnly || agent.cpu >= 80;

      return matchesSearch && matchesStatus && matchesLoad;
    });
  }, [metrics, searchQuery, filterStatus, highLoadOnly]);

  const hasActiveFilter = filterStatus !== "all" || highLoadOnly;

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

  const totalTasks =
    metrics?.agents.reduce((sum, agent) => sum + agent.tasksCompleted, 0) || 0;
  const avgCpu = metrics?.agents.length
    ? metrics.agents.reduce((sum, agent) => sum + agent.cpu, 0) /
      metrics.agents.length
    : 0;

  const totalAgents = stats?.totalAgents ?? metrics?.totalAgents ?? 0;
  const activeAgents = stats?.activeAgents ?? metrics?.activeAgents ?? 0;
  const completedToday = stats?.totalTasksCompleted ?? totalTasks;
  const avgEfficiency =
    stats?.efficiency ?? (totalAgents ? (activeAgents / totalAgents) * 100 : 0);
  const systemLoad = stats?.averageCpu ?? avgCpu;
  const errorRate =
    stats?.errorRate ??
    (totalAgents ? ((totalAgents - activeAgents) / totalAgents) * 100 : 0);

  const handleExport = () => {
    if (!filteredAgents.length) {
      setExportStatus({
        text: "NO AGENTS MATCH CURRENT FILTERS",
        tone: "warning",
      });
      return;
    }

    const headers = [
      "agentId",
      "status",
      "uptime",
      "tasksCompleted",
      "cpu",
      "memory",
      "lastUpdated",
    ];
    const rows = filteredAgents.map((agent) =>
      [
        agent.agentId,
        agent.status,
        agent.uptime,
        agent.tasksCompleted,
        agent.cpu.toFixed(2),
        agent.memory.toFixed(2),
        new Date(agent.lastUpdated).toISOString(),
      ].join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `agent-metrics-${new Date().toISOString()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    setExportStatus({
      text: `EXPORTED ${filteredAgents.length} AGENT${
        filteredAgents.length === 1 ? "" : "S"
      }`,
      tone: "success",
    });
  };

  const resetFilters = () => {
    setFilterStatus("all");
    setHighLoadOnly(false);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>AGENTBASE WORKFORCE MANAGEMENT SYSTEM</h1>
          <div className="header-subtitle">
            v1.0.0 | MULTI-AGENT COORDINATION
          </div>
        </div>
        <SystemHealth isConnected={isConnected} />
      </header>

      <MetricsOverview
        totalAgents={totalAgents}
        activeAgents={activeAgents}
        completedToday={completedToday}
        avgEfficiency={Number(avgEfficiency.toFixed(1))}
        systemLoad={Number(systemLoad.toFixed(1))}
        errorRate={Number(errorRate.toFixed(1))}
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
        <div className="filter-control">
          <button
            className={`toolbar-btn ${hasActiveFilter ? "active" : ""}`}
            onClick={() => setShowFilterMenu((prev) => !prev)}
            aria-expanded={showFilterMenu}
            aria-controls="toolbar-filter-menu"
          >
            <Filter size={16} />
            FILTER
          </button>
          {showFilterMenu && (
            <div id="toolbar-filter-menu" className="filter-menu">
              <div className="filter-section">
                <div className="filter-section-title">STATUS</div>
                <label className="filter-option">
                  <input
                    type="radio"
                    name="agent-status-filter"
                    value="all"
                    checked={filterStatus === "all"}
                    onChange={() => setFilterStatus("all")}
                  />
                  ALL
                </label>
                <label className="filter-option">
                  <input
                    type="radio"
                    name="agent-status-filter"
                    value="online"
                    checked={filterStatus === "online"}
                    onChange={() => setFilterStatus("online")}
                  />
                  ONLINE
                </label>
                <label className="filter-option">
                  <input
                    type="radio"
                    name="agent-status-filter"
                    value="offline"
                    checked={filterStatus === "offline"}
                    onChange={() => setFilterStatus("offline")}
                  />
                  OFFLINE
                </label>
              </div>
              <div className="filter-section">
                <div className="filter-section-title">RESOURCE LOAD</div>
                <label className="filter-option checkbox">
                  <input
                    type="checkbox"
                    checked={highLoadOnly}
                    onChange={(e) => setHighLoadOnly(e.target.checked)}
                  />
                  SHOW ONLY HIGH LOAD (&gt; 80% CPU)
                </label>
              </div>
              <div className="filter-actions">
                <button
                  className="filter-action-btn secondary"
                  onClick={() => {
                    resetFilters();
                    setShowFilterMenu(false);
                  }}
                >
                  RESET
                </button>
                <button
                  className="filter-action-btn primary"
                  onClick={() => setShowFilterMenu(false)}
                >
                  APPLY
                </button>
              </div>
            </div>
          )}
        </div>
        <button
          className="toolbar-btn"
          onClick={handleExport}
          disabled={filteredAgents.length === 0}
        >
          <Download size={16} />
          EXPORT
        </button>
        <button className="toolbar-btn" onClick={refetch}>
          <RefreshCw size={16} />
          REFRESH
        </button>
      </div>
      {exportStatus && (
        <div className={`toolbar-message ${exportStatus.tone}`}>
          {exportStatus.text}
        </div>
      )}

      <section className="agent-roster">
        <h2>AGENT ROSTER</h2>
        {filteredAgents.length === 0 ? (
          <div className="no-agents">
            {searchQuery
              ? `NO AGENTS MATCH "${searchQuery}"`
              : "NO AGENTS AVAILABLE"}
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
          SYSTEM TIME: {new Date().toLocaleString("en-US", { hour12: false })}
        </div>
        <div className="footer-info">
          REDIS: CONNECTED | AGENTS: {metrics?.activeAgents}/
          {metrics?.totalAgents}
        </div>
      </footer>
    </div>
  );
}

export default App;
