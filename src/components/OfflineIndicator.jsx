import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, CloudOff, CheckCircle, RefreshCw } from "lucide-react";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    const handleSync = () => {
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 2000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('cache-sync-triggered', handleSync);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('cache-sync-triggered', handleSync);
    };
  }, []);

  if (isOnline && !isSyncing) {
    return null; // Don't show indicator when online
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2">
      {isSyncing ? (
        <Badge className="bg-blue-600 text-white shadow-lg px-4 py-2 text-sm">
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          Syncing data...
        </Badge>
      ) : (
        <Badge className="bg-amber-600 text-white shadow-lg px-4 py-2 text-sm">
          <CloudOff className="w-4 h-4 mr-2" />
          Offline Mode - Using cached data
        </Badge>
      )}
    </div>
  );
}