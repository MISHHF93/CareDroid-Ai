import React from "react";
import { api } from "@/api/apiClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuditLog() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => api.entities.AuditLog.list('-created_date', 50),
    initialData: [],
  });

  const actionTypeColors = {
    view_drug: "bg-blue-100 text-blue-800",
    view_protocol: "bg-green-100 text-green-800",
    use_calculator: "bg-purple-100 text-purple-800",
    view_lab: "bg-amber-100 text-amber-800",
    view_procedure: "bg-indigo-100 text-indigo-800",
    search_query: "bg-pink-100 text-pink-800",
    view_image: "bg-cyan-100 text-cyan-800",
    voice_search: "bg-orange-100 text-orange-800"
  };

  return (
    <div className="min-h-full bg-neutral-50 dark:bg-neutral-50 pb-6">
      <div className="bg-gradient-to-br from-slate-500 to-slate-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Audit Log</h1>
            <p className="text-slate-100 text-sm">HIPAA compliance tracking</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <Card className="shadow-lg border-none mb-4 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-400 mb-1">
                  Compliance & Security
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-500 leading-relaxed">
                  All access to clinical data is logged with immutable timestamps. 
                  This audit trail ensures compliance with HIPAA regulations and 
                  provides malpractice defense documentation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-neutral-600 mb-3">
          {isLoading ? "Loading..." : `${logs.length} recent access events`}
        </p>

        <div className="space-y-2">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <Card key={i} className="border-none">
                <CardContent className="p-3">
                  <Skeleton className="h-5 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))
          ) : logs.length === 0 ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-8 text-center">
                <Eye className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-600 mb-1">No activity logged yet</p>
                <p className="text-sm text-neutral-500">
                  Your access history will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            logs.map((log) => (
              <Card key={log.id} className="border-none hover:shadow-md transition-all">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`text-xs ${actionTypeColors[log.action_type]}`}>
                          {log.action_type.replace(/_/g, ' ')}
                        </Badge>
                        {log.user_role && (
                          <Badge variant="outline" className="text-xs">
                            {log.user_role}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-neutral-900 mb-1">
                        {log.resource_accessed}
                      </p>
                      {log.search_query && (
                        <p className="text-xs text-neutral-600 italic">
                          Query: "{log.search_query}"
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs text-neutral-500 mb-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.created_date).toLocaleTimeString()}
                      </div>
                      <p className="text-xs text-neutral-400">
                        {new Date(log.created_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}