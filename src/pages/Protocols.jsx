import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, X, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ProtocolDetailModal from "../components/protocols/ProtocolDetailModal";

export default function Protocols() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");

  const { data: protocols, isLoading } = useQuery({
    queryKey: ['protocols'],
    queryFn: () => api.entities.Protocol.list(),
    initialData: [],
  });

  const filteredProtocols = protocols.filter(protocol => {
    const matchesSearch = searchTerm === "" || 
      protocol.condition?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || protocol.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(protocols.map(p => p.category).filter(Boolean))];

  const urgencyColors = {
    emergency: "bg-red-100 text-red-800 border-red-200",
    urgent: "bg-amber-100 text-amber-800 border-amber-200",
    routine: "bg-green-100 text-green-800 border-green-200"
  };

  return (
    <div className="min-h-full bg-neutral-50 dark:bg-neutral-50 pb-6">
      <div className="bg-gradient-to-br from-green-500 to-green-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Clinical Protocols</h1>
            <p className="text-green-100 text-sm">Evidence-based guidelines</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <Card className="shadow-lg border-none">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <Input
                type="text"
                placeholder="Search conditions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 h-12 text-base"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-neutral-400" />
                </button>
              )}
            </div>

            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              <Badge
                variant={filterCategory === "all" ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setFilterCategory("all")}
              >
                All
              </Badge>
              {categories.slice(0, 6).map(cat => (
                <Badge
                  key={cat}
                  variant={filterCategory === cat ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setFilterCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 mt-4">
        <p className="text-sm text-neutral-600 mb-3">
          {isLoading ? "Loading..." : `${filteredProtocols.length} protocols found`}
        </p>

        <div className="space-y-3">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <Card key={i} className="border-none">
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))
          ) : filteredProtocols.length === 0 ? (
            <Card className="border-none">
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-600">No protocols found</p>
              </CardContent>
            </Card>
          ) : (
            filteredProtocols.map((protocol) => (
              <Card
                key={protocol.id}
                className="border-none hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedProtocol(protocol)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-neutral-900 mb-2">
                        {protocol.condition}
                      </h3>
                      
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {protocol.category}
                        </Badge>
                        <Badge className={`text-xs ${urgencyColors[protocol.urgency]}`}>
                          {protocol.urgency}
                        </Badge>
                        {protocol.evidence_level && (
                          <Badge variant="outline" className="text-xs">
                            {protocol.evidence_level}
                          </Badge>
                        )}
                      </div>

                      {protocol.overview && (
                        <p className="text-sm text-neutral-600 line-clamp-2">
                          {protocol.overview}
                        </p>
                      )}
                    </div>
                    
                    {protocol.urgency === "emergency" && (
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {selectedProtocol && (
        <ProtocolDetailModal
          protocol={selectedProtocol}
          onClose={() => setSelectedProtocol(null)}
        />
      )}
    </div>
  );
}