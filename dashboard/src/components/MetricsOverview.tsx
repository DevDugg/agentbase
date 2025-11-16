import { MetricCard } from "./MetricCard";

interface MetricsOverviewProps {
  totalAgents: number;
  activeAgents: number;
  completedToday: number;
  avgEfficiency: number;
  systemLoad: number;
  errorRate: number;
}

export function MetricsOverview({
  totalAgents,
  activeAgents,
  completedToday,
  avgEfficiency,
  systemLoad,
  errorRate,
}: MetricsOverviewProps) {
  return (
    <div className="metrics-overview">
      <div className="metrics-grid">
        <MetricCard
          title="TOTAL_AGENTS"
          value={totalAgents}
          status="OPERATIONAL"
        />
        <MetricCard
          title="ACTIVE_AGENTS"
          value={activeAgents}
          status="PROCESSING"
        />
        <MetricCard
          title="COMPLETED_TODAY"
          value={completedToday}
          status="NOMINAL"
        />
        <MetricCard
          title="AVG_EFFICIENCY"
          value={`${avgEfficiency}%`}
          status="OPTIMAL"
        />
        <MetricCard
          title="SYSTEM_LOAD"
          value={`${systemLoad}%`}
          status="NORMAL"
        />
        <MetricCard
          title="ERROR_RATE"
          value={`${errorRate}%`}
          status="MINIMAL"
        />
      </div>
    </div>
  );
}
