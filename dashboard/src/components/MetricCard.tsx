import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  status?: string;
}

export function MetricCard({ title, value, status }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="metric-title">{title}</div>
      <div className="metric-value">{value}</div>
      {status && <div className="metric-status">{status}</div>}
    </div>
  );
}
