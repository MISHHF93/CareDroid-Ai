/**
 * WebSocket Connection Status Indicator
 * Shows real-time connection status in the UI
 */

import React, { useState, useEffect } from 'react';
import { getWebSocketManager } from '../services/websocket/WebSocketManager';

export function WebSocketStatus() {
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    const wsManager = getWebSocketManager();
    
    // Check connection status every second
    const interval = setInterval(() => {
      const status = wsManager.getStatus();
      setConnected(status.isConnected);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (!connected) {
    return null; // Don't show anything when disconnected to avoid clutter
  }
  
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '12px',
        background: 'rgba(0, 255, 136, 0.1)',
        border: '1px solid rgba(0, 255, 136, 0.3)',
        fontSize: '12px',
        fontWeight: 500,
        color: 'var(--accent-green)'
      }}
      title="Real-time connection active"
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'var(--accent-green)',
          boxShadow: '0 0 8px var(--accent-green)',
          animation: 'pulse 2s ease-in-out infinite'
        }}
      />
      Live
    </div>
  );
}

export default WebSocketStatus;
