import { useState, useEffect } from "react";
import { Terminal } from "lucide-react";

interface Activity {
  agentId: string;
  timestamp: number;
  action: string;
  content: string;
}

interface ActivityLogsProps {
  activities: Activity[];
  maxItems?: number;
}

export function ActivityLogs({ activities, maxItems = 10 }: ActivityLogsProps) {
  const [displayActivities, setDisplayActivities] = useState<Activity[]>([]);

  useEffect(() => {
    setDisplayActivities(activities.slice(-maxItems));
  }, [activities, maxItems]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", { hour12: false });
  };

  return (
    <div className="activity-logs">
      <div className="activity-header">
        <Terminal size={16} />
        <h2>ACTIVITY LOG</h2>
      </div>
      <div className="activity-list">
        {displayActivities.length === 0 ? (
          <div className="activity-item empty">
            <span>No recent activity</span>
          </div>
        ) : (
          displayActivities.map((activity, index) => (
            <div
              key={`${activity.timestamp}-${index}`}
              className="activity-item"
            >
              <span className="activity-time">
                [{formatTime(activity.timestamp)}]
              </span>
              <span className="activity-agent">
                {activity.agentId.toUpperCase()}
              </span>
              <span className="activity-action">{activity.action}</span>
              <span className="activity-content">{activity.content}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
