import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileText, 
  TestTube, 
  Stethoscope, 
  Image as ImageIcon,
  AlertTriangle,
  ChevronRight 
} from "lucide-react";

export default function Library() {
  const resources = [
    {
      title: "Clinical Protocols",
      description: "Evidence-based treatment guidelines",
      icon: FileText,
      color: "from-green-500 to-green-600",
      path: "Protocols",
      count: "300+"
    },
    {
      title: "Lab Values",
      description: "Reference ranges & interpretation",
      icon: TestTube,
      color: "from-amber-500 to-amber-600",
      path: "LabValues",
      count: "200+"
    },
    {
      title: "Procedures",
      description: "Step-by-step clinical procedures",
      icon: Stethoscope,
      color: "from-indigo-500 to-indigo-600",
      path: "Procedures",
      count: "50+"
    },
    {
      title: "Medical Images",
      description: "Visual diagnosis reference library",
      icon: ImageIcon,
      color: "from-pink-500 to-pink-600",
      path: "Images",
      count: "100+"
    },
    {
      title: "Emergency Protocols",
      description: "Rapid response algorithms",
      icon: AlertTriangle,
      color: "from-red-500 to-red-600",
      path: "Emergency",
      count: "Critical"
    }
  ];

  return (
    <div className="min-h-full bg-neutral-50 dark:bg-neutral-50 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Clinical Library</h1>
            <p className="text-indigo-100 text-sm">Comprehensive medical resources</p>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="px-4 -mt-4">
        <div className="space-y-3">
          {resources.map((resource) => (
            <Link key={resource.title} to={createPageUrl(resource.path)}>
              <Card className="border-none hover:shadow-lg transition-all duration-200">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${resource.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                      <resource.icon className="w-8 h-8 text-white" strokeWidth={2.5} />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-900 mb-1">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                        {resource.description}
                      </p>
                      <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        {resource.count} resources
                      </span>
                    </div>

                    <ChevronRight className="w-6 h-6 text-neutral-300 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}