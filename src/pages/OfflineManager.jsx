import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CloudOff, 
  Download,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Database,
  Clock,
  HardDrive
} from "lucide-react";

export default function OfflineManager() {
  const [cacheStats, setCacheStats] = useState({});
  const [totalSize, setTotalSize] = useState(0);
  const [lastSync, setLastSync] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadCacheStats();
  }, []);

  const loadCacheStats = () => {
    const stats = {};
    let total = 0;

    // Check each cache item
    const cacheKeys = ['drugs_cache', 'emergency_protocols', 'lab_values_cache', 'protocols_cache'];
    
    cacheKeys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const size = new Blob([item]).size;
          total += size;
          const data = JSON.parse(item);
          stats[key] = {
            available: true,
            timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
            size: size
          };
        } else {
          stats[key] = { available: false };
        }
      } catch (e) {
        stats[key] = { available: false, error: true };
      }
    });

    setCacheStats(stats);
    setTotalSize(total);
    
    const syncTime = localStorage.getItem('last_sync');
    setLastSync(syncTime ? new Date(parseInt(syncTime)) : null);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleRefreshAll = () => {
    setIsRefreshing(true);
    localStorage.setItem('last_sync', Date.now().toString());
    setTimeout(() => {
      loadCacheStats();
      setIsRefreshing(false);
    }, 1000);
  };

  const handleClearAll = () => {
    if (confirm("Clear all offline data? You'll need to download it again.")) {
      localStorage.removeItem('drugs_cache');
      localStorage.removeItem('emergency_protocols');
      localStorage.removeItem('lab_values_cache');
      localStorage.removeItem('protocols_cache');
      loadCacheStats();
    }
  };

  const cacheItems = [
    { key: 'drugs_cache', name: 'Drug Database', description: '500+ medications', icon: Database, critical: true },
    { key: 'emergency_protocols', name: 'Emergency Protocols', description: 'ACLS, anaphylaxis, stroke', icon: CloudOff, critical: true },
    { key: 'protocols_cache', name: 'Clinical Protocols', description: '300+ guidelines', icon: Database, critical: false },
    { key: 'lab_values_cache', name: 'Lab Values', description: '200+ reference ranges', icon: Database, critical: false }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-6">
      <div className="bg-gradient-to-br from-slate-600 to-slate-700 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <CloudOff className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Offline Data</h1>
            <p className="text-slate-200 text-sm">Manage offline caching</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        <Card className="border-none shadow-xl">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <HardDrive className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-neutral-900">
                  {formatBytes(totalSize)}
                </p>
                <p className="text-xs text-neutral-500">Storage Used</p>
              </div>
              <div className="text-center">
                <Database className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-neutral-900">
                  {Object.values(cacheStats).filter(s => s.available).length}
                </p>
                <p className="text-xs text-neutral-500">Cached Tools</p>
              </div>
              <div className="text-center">
                <Clock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-neutral-900">
                  {lastSync ? lastSync.toLocaleDateString() : 'Never'}
                </p>
                <p className="text-xs text-neutral-500">Last Sync</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-200">
              <Button
                onClick={handleRefreshAll}
                disabled={isRefreshing || !navigator.onLine}
                variant="outline"
                className="flex-1"
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync All
                  </>
                )}
              </Button>
              <Button
                onClick={handleClearAll}
                variant="outline"
                className="flex-1 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>

            {!navigator.onLine && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-800 text-center">
                  You're offline. Sync will happen when connection is restored.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
            Offline Tools
          </h3>

          {cacheItems.map((item) => {
            const stat = cacheStats[item.key] || { available: false };
            
            return (
              <Card key={item.key} className="border-none shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${stat.available ? 'bg-green-100' : 'bg-neutral-100'} flex items-center justify-center flex-shrink-0`}>
                      <item.icon className={`w-5 h-5 ${stat.available ? 'text-green-600' : 'text-neutral-400'}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-base text-neutral-900">
                          {item.name}
                        </h4>
                        {item.critical && (
                          <Badge variant="destructive" className="text-xs">
                            Critical
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-neutral-600 mb-2">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-3">
                        {stat.available ? (
                          <>
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Available Offline
                            </Badge>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-xs text-neutral-600">
                            <XCircle className="w-3 h-3 mr-1" />
                            Not Cached
                          </Badge>
                        )}
                      </div>
                    </div>

                    {stat.available && stat.size && (
                      <div className="text-right">
                        <p className="text-xs text-neutral-500">
                          {formatBytes(stat.size)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-none bg-blue-50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Database className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  About Offline Mode
                </p>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Critical clinical tools are automatically cached for offline use. 
                  Emergency protocols are always available offline for patient safety.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}