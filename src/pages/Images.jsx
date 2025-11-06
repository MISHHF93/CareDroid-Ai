import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon, Search, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Images() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const { data: images, isLoading } = useQuery({
    queryKey: ['medicalImages'],
    queryFn: () => api.entities.MedicalImage.list(),
    initialData: [],
  });

  const filteredImages = images.filter(img => {
    const matchesSearch = searchTerm === "" || 
      img.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      img.condition?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || img.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(images.map(i => i.category).filter(Boolean))];

  return (
    <div className="min-h-full bg-neutral-50 dark:bg-neutral-50 pb-6">
      <div className="bg-gradient-to-br from-pink-500 to-pink-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <ImageIcon className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Medical Images</h1>
            <p className="text-pink-100 text-sm">Visual diagnosis library</p>
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
                placeholder="Search images..."
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
              {categories.map(cat => (
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
          {isLoading ? "Loading..." : `${filteredImages.length} images found`}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array(4).fill(0).map((_, i) => (
              <Card key={i} className="border-none">
                <CardContent className="p-3">
                  <Skeleton className="w-full h-32 mb-2 rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredImages.length === 0 ? (
          <Card className="border-none shadow-lg">
            <CardContent className="p-8 text-center">
              <ImageIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-600 mb-1">No images found</p>
              <p className="text-sm text-neutral-500">
                Medical image library coming soon
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredImages.map((image) => (
              <Card key={image.id} className="border-none hover:shadow-lg transition-all">
                <CardContent className="p-3">
                  <div className="aspect-square bg-neutral-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                    {image.image_url ? (
                      <img 
                        src={image.image_url} 
                        alt={image.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-neutral-300" />
                    )}
                  </div>
                  <h3 className="font-semibold text-sm text-neutral-900 mb-1 line-clamp-2">
                    {image.title}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {image.category}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}