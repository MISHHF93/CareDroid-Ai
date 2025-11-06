import React from "react";
import { X, AlertTriangle, ShieldAlert, Activity, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DrugDetailModal({ drug, onClose }) {
  const sections = [
    { 
      title: "Indications", 
      content: drug.indications, 
      icon: Info,
      type: "list" 
    },
    { 
      title: "Adult Dosing", 
      content: drug.adult_dosing, 
      icon: Activity,
      type: "text" 
    },
    { 
      title: "Pediatric Dosing", 
      content: drug.pediatric_dosing, 
      icon: Activity,
      type: "text" 
    },
    { 
      title: "Contraindications", 
      content: drug.contraindications, 
      icon: AlertTriangle,
      type: "list",
      highlight: true 
    },
    { 
      title: "Adverse Effects", 
      content: drug.adverse_effects, 
      icon: AlertTriangle,
      type: "list" 
    },
    { 
      title: "Drug Interactions", 
      content: drug.interactions, 
      icon: AlertTriangle,
      type: "interactions" 
    },
    { 
      title: "Renal Adjustments", 
      content: drug.renal_adjustments, 
      icon: Info,
      type: "text" 
    },
    { 
      title: "Hepatic Adjustments", 
      content: drug.hepatic_adjustments, 
      icon: Info,
      type: "text" 
    },
    { 
      title: "Monitoring", 
      content: drug.monitoring, 
      icon: Activity,
      type: "text" 
    },
    { 
      title: "Administration", 
      content: drug.administration, 
      icon: Info,
      type: "text" 
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-neutral-800 w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-4 sm:rounded-t-2xl rounded-t-2xl flex items-start justify-between">
          <div className="flex-1 pr-4">
            <h2 className="text-2xl font-bold text-white mb-1">
              {drug.generic_name}
            </h2>
            {drug.brand_names && drug.brand_names.length > 0 && (
              <p className="text-blue-100 text-sm">
                {drug.brand_names.join(", ")}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge className="bg-white/20 text-white border-white/30">
                {drug.drug_class}
              </Badge>
              {drug.pregnancy_category && (
                <Badge className="bg-white/20 text-white border-white/30">
                  Pregnancy: {drug.pregnancy_category}
                </Badge>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Black Box Warning */}
        {drug.black_box_warning && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
            <div className="flex gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-400 text-sm mb-1">
                  FDA Black Box Warning
                </p>
                <p className="text-sm text-red-800 dark:text-red-500">
                  {drug.black_box_warning}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4 pb-4">
            {sections.map((section) => {
              if (!section.content || 
                  (Array.isArray(section.content) && section.content.length === 0)) {
                return null;
              }

              return (
                <Card key={section.title} className={`border-none ${section.highlight ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <section.icon className="w-4 h-4" />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {section.type === "list" && Array.isArray(section.content) ? (
                      <ul className="space-y-2">
                        {section.content.map((item, idx) => (
                          <li key={idx} className="text-sm text-neutral-700 dark:text-neutral-300 flex gap-2">
                            <span className="text-neutral-400">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : section.type === "interactions" && Array.isArray(section.content) ? (
                      <div className="space-y-3">
                        {section.content.map((interaction, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-neutral-700 rounded-lg">
                            <Badge 
                              variant={
                                interaction.severity === "major" ? "destructive" :
                                interaction.severity === "moderate" ? "default" : "secondary"
                              }
                              className="text-xs whitespace-nowrap"
                            >
                              {interaction.severity}
                            </Badge>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                                {interaction.drug}
                              </p>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                {interaction.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        {section.content}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-neutral-200 dark:border-neutral-700 px-6 py-4">
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}