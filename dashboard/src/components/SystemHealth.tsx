import { Wifi, WifiOff } from "lucide-react";

interface SystemHealthProps {
  isConnected: boolean;
}

export function SystemHealth({ isConnected }: SystemHealthProps) {
  return (
    <div className="system-health">
      <div className="connection-status">
        {isConnected ? (
          <>
            <Wifi size={16} className="status-icon connected" />
            <span className="status-text connected">CONNECTED</span>
          </>
        ) : (
          <>
            <WifiOff size={16} className="status-icon disconnected" />
            <span className="status-text disconnected">DISCONNECTED</span>
          </>
        )}
      </div>
    </div>
  );
}
