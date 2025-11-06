import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TestTube, Search, X, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function LabValues() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedLab, setSelectedLab] = useState(null);

  const { data: labValues, isLoading } = useQuery({
    queryKey: ['labValues'],
    queryFn: () => api.entities.LabValue.list(),
    initialData: [],
  });

  const filteredLabs = labValues.filter(lab => {
    const matchesSearch = searchTerm === "" || 
      lab.test_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || lab.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(labValues.map(l => l.category).filter(Boolean))];

  return (
    <div className="min-h-full bg-neutral-50 dark:bg-neutral-50 pb-6">
      <div className="bg-gradient-to-br from-amber-500 to-amber-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <TestTube className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Lab Values</h1>
            <p className="text-amber-100 text-sm">Reference ranges & interpretation</p>
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
                placeholder="Search lab tests..."
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
          {isLoading ? "Loading..." : `${filteredLabs.length} tests found`}
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
          ) : filteredLabs.length === 0 ? (
            <Card className="border-none">
              <CardContent className="p-8 text-center">
                <TestTube className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-600">No lab tests found</p>
              </CardContent>
            </Card>
          ) : (
            filteredLabs.map((lab) => (
              <Card
                key={lab.id}
                className="border-none hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedLab(selectedLab?.id === lab.id ? null : lab)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-neutral-900 mb-1">
                        {lab.test_name}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {lab.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {lab.units}
                        </Badge>
                      </div>
                      <p className="text-sm text-neutral-700">
                        <span className="font-medium">Normal:</span> {lab.normal_range_adult}
                      </p>
                    </div>
                  </div>

                  {selectedLab?.id === lab.id && (
                    <div className="mt-4 pt-4 border-t border-neutral-200 space-y-3">
                      {lab.clinical_significance_high && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <div className="flex items-start gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="font-semibold text-sm text-red-900 dark:text-red-400">
                              Elevated Values
                            </p>
                          </div>
                          <p className="text-sm text-red-800 dark:text-red-500 mb-2">
                            {lab.clinical_significance_high}
                          </p>
                          {lab.causes_high && lab.causes_high.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-red-900 dark:text-red-400 mb-1">
                                Common causes:
                              </p>
                              <ul className="text-xs text-red-800 dark:text-red-500 space-y-0.5">
                                {lab.causes_high.slice(0, 3).map((cause, idx) => (
                                  <li key={idx}>• {cause}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {lab.clinical_significance_low && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-start gap-2 mb-1">
                            <TrendingDown className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="font-semibold text-sm text-blue-900 dark:text-blue-400">
                              Decreased Values
                            </p>
                          </div>
                          <p className="text-sm text-blue-800 dark:text-blue-500 mb-2">
                            {lab.clinical_significance_low}
                          </p>
                          {lab.causes_low && lab.causes_low.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-blue-900 dark:text-blue-400 mb-1">
                                Common causes:
                              </p>
                              <ul className="text-xs text-blue-800 dark:text-blue-500 space-y-0.5">
                                {lab.causes_low.slice(0, 3).map((cause, idx) => (
                                  <li key={idx}>• {cause}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {(lab.critical_low || lab.critical_high) && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                          <p className="font-semibold text-sm text-amber-900 dark:text-amber-400 mb-1">
                            ⚠️ Critical Values
                          </p>
                          <p className="text-sm text-amber-800 dark:text-amber-500">
                            {lab.critical_low && `Low: ${lab.critical_low}`}
                            {lab.critical_low && lab.critical_high && " | "}
                            {lab.critical_high && `High: ${lab.critical_high}`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}