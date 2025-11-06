import React from "react";
import { X, AlertCircle, CheckCircle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ProtocolDetailModal({ protocol, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-neutral-800 w-full sm:max-w-3xl sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="bg-gradient-to-br from-green-500 to-green-600 px-6 py-4 sm:rounded-t-2xl rounded-t-2xl flex items-start justify-between">
          <div className="flex-1 pr-4">
            <h2 className="text-2xl font-bold text-white mb-2">
              {protocol.condition}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-white/20 text-white border-white/30">
                {protocol.category}
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30">
                {protocol.urgency}
              </Badge>
              {protocol.evidence_level && (
                <Badge className="bg-white/20 text-white border-white/30">
                  {protocol.evidence_level}
                </Badge>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4 pb-4">
            {protocol.overview && (
              <Card className="border-none bg-neutral-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    {protocol.overview}
                  </p>
                </CardContent>
              </Card>
            )}

            {protocol.diagnostic_criteria && protocol.diagnostic_criteria.length > 0 && (
              <Card className="border-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Diagnostic Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {protocol.diagnostic_criteria.map((criterion, idx) => (
                      <li key={idx} className="text-sm text-neutral-700 flex gap-2">
                        <span className="text-green-600">✓</span>
                        <span>{criterion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {protocol.treatment_pathway && protocol.treatment_pathway.length > 0 && (
              <Card className="border-none bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Treatment Pathway
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {protocol.treatment_pathway.map((step, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-neutral-900">
                            {step.action}
                          </p>
                          {step.details && (
                            <p className="text-sm text-neutral-600 mt-1">
                              {step.details}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {protocol.investigations && protocol.investigations.length > 0 && (
              <Card className="border-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Recommended Investigations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {protocol.investigations.map((inv, idx) => (
                      <div key={idx} className="p-3 bg-neutral-50 rounded-lg">
                        <p className="font-medium text-sm text-neutral-900">
                          {inv.test}
                        </p>
                        <p className="text-xs text-neutral-600 mt-1">
                          {inv.indication}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-neutral-200 px-6 py-4">
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}