import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pill, Search, X, CloudOff, Download, RefreshCw, CheckCircle } from "lucide-react";
import DrugDetailModal from "../components/drugs/DrugDetailModal";
import { entities } from "../utils/services";

export default function DrugDatabase() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [filterClass, setFilterClass] = useState("all");
  const [drugs, setDrugs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDrugs();
  }, []);

  const loadDrugs = () => {
    setIsLoading(true);
    const allDrugs = entities.Drug.list();
    setDrugs(allDrugs);
    setIsLoading(false);
  };

  const filteredDrugs = drugs.filter((drug) => {
    const matchesSearch =
      searchTerm === "" ||
      drug.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.brand_names?.some(b => b.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesClass = filterClass === "all" || drug.drug_class === filterClass;
    return matchesSearch && matchesClass;
  });

  const drugClasses = [...new Set(drugs.map(d => d.drug_class).filter(Boolean))].sort();

  return (
    <div className="min-h-full bg-neutral-50 pb-6">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Pill className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Drug Reference</h1>
            <p className="text-blue-100 text-sm">Clinical pharmacology database</p>
          </div>
          
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Offline Ready
          </Badge>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <Card className="shadow-lg border-none">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <Input
                type="text"
                placeholder="Search by generic or brand name..."
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
                variant={filterClass === "all" ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setFilterClass("all")}
              >
                All Classes
              </Badge>
              {drugClasses.slice(0, 5).map(drugClass => (
                <Badge
                  key={drugClass}
                  variant={filterClass === drugClass ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setFilterClass(drugClass)}
                >
                  {drugClass}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 mt-4">
        <p className="text-sm text-neutral-600 mb-3">
          {filteredDrugs.length} {filteredDrugs.length === 1 ? 'drug' : 'drugs'} found
        </p>

        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-neutral-500">Loading drugs...</div>
          ) : filteredDrugs.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              No drugs found matching your search
            </div>
          ) : (
            filteredDrugs.map((drug) => (
              <Card
                key={drug.id}
                className="border-none hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedDrug(drug)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base text-neutral-900 mb-1">
                        {drug.generic_name}
                      </h3>
                      {drug.brand_names && drug.brand_names.length > 0 && (
                        <p className="text-sm text-neutral-600 mb-2">
                          Brand: {drug.brand_names.join(', ')}
                        </p>
                      )}
                      {drug.drug_class && (
                        <Badge variant="secondary" className="text-xs">
                          {drug.drug_class}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {selectedDrug && (
        <DrugDetailModal
          drug={selectedDrug}
          onClose={() => setSelectedDrug(null)}
        />
      )}
    </div>
  );
}