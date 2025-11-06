import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, CheckCircle, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Procedures() {
  const [selectedProcedure, setSelectedProcedure] = useState(null);

  const { data: procedures, isLoading } = useQuery({
    queryKey: ['procedures'],
    queryFn: () => api.entities.Procedure.list(),
    initialData: [],
  });

  const skillColors = {
    basic: "bg-green-100 text-green-800",
    intermediate: "bg-amber-100 text-amber-800",
    advanced: "bg-red-100 text-red-800"
  };

  return (
    <div className="min-h-full bg-neutral-50 dark:bg-neutral-50 pb-6">
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Stethoscope className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Clinical Procedures</h1>
            <p className="text-indigo-100 text-sm">Step-by-step guides</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="border-none">
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))
        ) : procedures.length === 0 ? (
          <Card className="border-none shadow-lg">
            <CardContent className="p-8 text-center">
              <Stethoscope className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-600 mb-4">No procedures available yet</p>
              <p className="text-sm text-neutral-500">
                Procedure guides coming soon
              </p>
            </CardContent>
          </Card>
        ) : (
          procedures.map((procedure) => (
            <Card
              key={procedure.id}
              className="border-none shadow-lg hover:shadow-xl transition-all cursor-pointer"
              onClick={() => setSelectedProcedure(selectedProcedure?.id === procedure.id ? null : procedure)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-neutral-900 mb-2">
                      {procedure.procedure_name}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {procedure.category}
                      </Badge>
                      <Badge className={`text-xs ${skillColors[procedure.skill_level]}`}>
                        {procedure.skill_level}
                      </Badge>
                      {procedure.consent_required && (
                        <Badge variant="outline" className="text-xs">
                          Consent Required
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                </div>

                {selectedProcedure?.id === procedure.id && (
                  <div className="mt-4 pt-4 border-t border-neutral-200 space-y-4">
                    {procedure.indications && procedure.indications.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-neutral-900 mb-2">Indications</h4>
                        <ul className="space-y-1">
                          {procedure.indications.map((ind, idx) => (
                            <li key={idx} className="text-sm text-neutral-700 flex gap-2">
                              <span className="text-green-600">✓</span>
                              <span>{ind}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {procedure.contraindications && procedure.contraindications.length > 0 && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <h4 className="font-semibold text-sm text-red-900 dark:text-red-400 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Contraindications
                        </h4>
                        <ul className="space-y-1">
                          {procedure.contraindications.map((contra, idx) => (
                            <li key={idx} className="text-sm text-red-800 dark:text-red-500">
                              • {contra}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {procedure.equipment_needed && procedure.equipment_needed.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-neutral-900 mb-2">Equipment Needed</h4>
                        <div className="flex flex-wrap gap-2">
                          {procedure.equipment_needed.map((equip, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {equip}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {procedure.procedural_steps && procedure.procedural_steps.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm text-neutral-900 mb-3">Procedure Steps</h4>
                        <ol className="space-y-3">
                          {procedure.procedural_steps.map((step, idx) => (
                            <li key={idx} className="flex gap-3">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0 ${
                                step.critical_point ? 'bg-red-500 text-white' : 'bg-indigo-100 text-indigo-700'
                              }`}>
                                {step.step_number}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-neutral-900">{step.action}</p>
                                {step.safety_note && (
                                  <p className="text-xs text-amber-700 mt-1 flex items-start gap-1">
                                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    {step.safety_note}
                                  </p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ol>
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
  );
}