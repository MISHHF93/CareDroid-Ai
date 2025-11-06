import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  BookmarkCheck, 
  Star, 
  Search, 
  X,
  Clock,
  Trash2,
  MessageSquare
} from "lucide-react";
import { entities } from "../utils/services";

export default function SavedQueries() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [savedQueries, setSavedQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadQueries();
  }, []);

  const loadQueries = () => {
    setIsLoading(true);
    try {
      const queries = entities.SavedQuery.list('-created_date');
      setSavedQueries(queries);
    } catch (error) {
      console.error("Error loading queries:", error);
    }
    setIsLoading(false);
  };

  const handleDelete = (id) => {
    if (confirm("Delete this saved query?")) {
      entities.SavedQuery.delete(id);
      loadQueries();
      setSelectedQuery(null);
    }
  };

  const toggleFavorite = (query) => {
    entities.SavedQuery.update(query.id, { 
      is_favorited: !query.is_favorited 
    });
    loadQueries();
  };

  const filteredQueries = savedQueries.filter(query => {
    const matchesSearch = searchTerm === "" || 
      query.query_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.ai_response?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || 
      (filterType === "favorites" && query.is_favorited) ||
      query.query_type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type) => {
    const colors = {
      clinical_question: "bg-blue-100 text-blue-800",
      drug_interaction: "bg-purple-100 text-purple-800",
      differential_diagnosis: "bg-amber-100 text-amber-800",
      guideline_search: "bg-green-100 text-green-800"
    };
    return colors[type] || "bg-neutral-100 text-neutral-800";
  };

  return (
    <div className="min-h-full bg-neutral-50 pb-6">
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <BookmarkCheck className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Saved Queries</h1>
            <p className="text-indigo-100 text-sm">Your clinical Q&A history</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <Card className="shadow-lg border-none">
          <CardContent className="p-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <Input
                type="text"
                placeholder="Search saved queries..."
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

            <div className="flex gap-2 overflow-x-auto pb-1">
              <Badge
                variant={filterType === "all" ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setFilterType("all")}
              >
                All
              </Badge>
              <Badge
                variant={filterType === "favorites" ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setFilterType("favorites")}
              >
                <Star className="w-3 h-3 mr-1" />
                Favorites
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 mt-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="border-none">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-neutral-900">{savedQueries.length}</p>
              <p className="text-xs text-neutral-500">Total Queries</p>
            </CardContent>
          </Card>
          <Card className="border-none">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {savedQueries.filter(q => q.is_favorited).length}
              </p>
              <p className="text-xs text-neutral-500">Favorited</p>
            </CardContent>
          </Card>
          <Card className="border-none">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                {savedQueries.filter(q => q.user_feedback === "helpful").length}
              </p>
              <p className="text-xs text-neutral-500">Helpful</p>
            </CardContent>
          </Card>
        </div>

        <p className="text-sm text-neutral-600 mb-3">
          {filteredQueries.length} queries found
        </p>

        <div className="space-y-3">
          {filteredQueries.length === 0 ? (
            <Card className="border-none">
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-600 mb-1">No saved queries yet</p>
                <p className="text-sm text-neutral-500">
                  Your clinical questions will be saved here automatically
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredQueries.map((query) => (
              <Card
                key={query.id}
                className="border-none hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedQuery(selectedQuery?.id === query.id ? null : query)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`text-xs ${getTypeColor(query.query_type)}`}>
                          {query.query_type.replace(/_/g, ' ')}
                        </Badge>
                        {query.is_favorited && (
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        )}
                      </div>
                      <h3 className="font-semibold text-base text-neutral-900 mb-2 line-clamp-2">
                        {query.query_text}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(query.created_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedQuery?.id === query.id && (
                    <div className="mt-4 pt-4 border-t border-neutral-200 space-y-3">
                      <div className="prose prose-sm max-w-none">
                        <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                          {query.ai_response}
                        </p>
                      </div>

                      <div className="flex gap-2 pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(query);
                          }}
                        >
                          <Star className={`w-4 h-4 mr-1 ${query.is_favorited ? 'fill-amber-500 text-amber-500' : ''}`} />
                          {query.is_favorited ? 'Unfavorite' : 'Favorite'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(query.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
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