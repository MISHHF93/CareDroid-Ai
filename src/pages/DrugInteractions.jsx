
import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import EHRPanel, { formatEHRForAI } from "../components/EHRPanel";
import AIWorkflowAssistant from "../components/AIWorkflowAssistant";

export default function DrugInteractions() {
  const [ehrData, setEhrData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleEHRDataLoaded = (data) => {
    setEhrData(data);
  };

  const analyzeInteractions = async () => {
    if (!ehrData) return;

    setIsAnalyzing(true);
    try {
      const ehrContext = formatEHRForAI(ehrData);
      
      // Attempt to safely get eGFR value
      const eGFR_result = ehrData.labs?.results?.find(l => l.test === "eGFR");
      const eGFR_value = eGFR_result ? `${eGFR_result.value} mL/min` : "not available";

      const prompt = `You are a clinical pharmacology AI analyzing drug interactions from EHR data.

${ehrContext}

TASK: Analyze all active medications for potential drug-drug interactions, considering the patient's:
- Renal function (eGFR: ${eGFR_value})
- Current lab abnormalities
- Active medical conditions
- Documented allergies

Provide analysis in JSON format:
{
  "critical_interactions": [
    {
      "drug1": "drug name",
      "drug2": "drug name",
      "severity": "major/moderate/minor",
      "mechanism": "pharmacodynamic/pharmacokinetic explanation",
      "clinical_impact": "what happens to the patient",
      "recommendation": "specific action to take"
    }
  ],
  "renal_considerations": [
    {
      "medication": "drug name",
      "current_dose": "current dose",
      "issue": "why this is problematic with CKD Stage 3",
      "recommended_adjustment": "specific dosing change"
    }
  ],
  "allergy_concerns": [
    {
      "medication": "drug name",
      "allergy": "allergen",
      "cross_reactivity_risk": "high/moderate/low",
      "recommendation": "action"
    }
  ],
  "monitoring_recommendations": [
    "specific lab or clinical parameter to monitor"
  ],
  "overall_risk_assessment": "summary of interaction burden and safety profile"
}`;

      const result = await api.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            critical_interactions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  drug1: { type: "string" },
                  drug2: { type: "string" },
                  severity: { type: "string" },
                  mechanism: { type: "string" },
                  clinical_impact: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            },
            renal_considerations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  medication: { type: "string" },
                  current_dose: { type: "string" },
                  issue: { type: "string" },
                  recommended_adjustment: { type: "string" }
                }
              }
            },
            allergy_concerns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  medication: { type: "string" },
                  allergy: { type: "string" },
                  cross_reactivity_risk: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            },
            monitoring_recommendations: {
              type: "array",
              items: { type: "string" }
            },
            overall_risk_assessment: { type: "string" }
          }
        }
      });

      setAnalysis(result);
    } catch (error) {
      console.error("Error analyzing interactions:", error);
    }
    setIsAnalyzing(false);
  };

  const getSeverityColor = (severity) => {
    const lower = severity?.toLowerCase();
    if (lower === "major") return "bg-red-100 text-red-800 border-red-300";
    if (lower === "moderate") return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-blue-100 text-blue-800 border-blue-300";
  };

  return (
    <div className="min-h-full bg-neutral-50 pb-6">
      <div className="bg-gradient-to-br from-orange-500 to-red-500 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Drug Interaction Checker</h1>
            <p className="text-orange-100 text-sm">EHR-integrated analysis</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        <EHRPanel onDataLoaded={handleEHRDataLoaded} />

        {ehrData && !analysis && <AIWorkflowAssistant ehrData={ehrData} />}

        {ehrData && !analysis && (
          <Button
            onClick={analyzeInteractions}
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 h-12"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Drug Interactions...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Analyze Medication Profile
              </>
            )}
          </Button>
        )}

        {analysis && (
          <>
            <Card className="border-none shadow-lg bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardContent className="p-5">
                <h3 className="font-bold text-lg text-indigo-900 mb-2">Overall Risk Assessment</h3>
                <p className="text-sm text-indigo-800 leading-relaxed">
                  {analysis.overall_risk_assessment}
                </p>
              </CardContent>
            </Card>

            {analysis.critical_interactions && analysis.critical_interactions.length > 0 && (
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Drug-Drug Interactions ({analysis.critical_interactions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.critical_interactions.map((interaction, idx) => (
                    <Card key={idx} className={`border-2 ${getSeverityColor(interaction.severity)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-base text-neutral-900">
                              {interaction.drug1} + {interaction.drug2}
                            </h4>
                          </div>
                          <Badge className={getSeverityColor(interaction.severity)}>
                            {interaction.severity}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-semibold">Mechanism:</span>
                            <p className="text-neutral-700">{interaction.mechanism}</p>
                          </div>
                          
                          <div>
                            <span className="font-semibold">Clinical Impact:</span>
                            <p className="text-neutral-700">{interaction.clinical_impact}</p>
                          </div>
                          
                          <div className="pt-2 border-t border-neutral-200">
                            <span className="font-semibold text-blue-900">💡 Recommendation:</span>
                            <p className="text-blue-800">{interaction.recommendation}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {analysis.renal_considerations && analysis.renal_considerations.length > 0 && (
              <Card className="border-none shadow-lg bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-base text-amber-900">
                    Renal Function Considerations (eGFR: {ehrData.labs?.results?.find(l => l.test === "eGFR")?.value || 'N/A'} mL/min)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysis.renal_considerations.map((renal, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-amber-200">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-amber-900">{renal.medication}</h4>
                        <Badge variant="outline" className="text-xs">
                          Current: {renal.current_dose}
                        </Badge>
                      </div>
                      <p className="text-sm text-amber-800 mb-2">{renal.issue}</p>
                      <div className="p-2 bg-green-50 rounded border border-green-200">
                        <p className="text-sm text-green-900">
                          <strong>Adjustment:</strong> {renal.recommended_adjustment}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {analysis.allergy_concerns && analysis.allergy_concerns.length > 0 && (
              <Card className="border-none shadow-lg border-l-4 border-l-red-500 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-base text-red-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Allergy Cross-Reactivity Concerns
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysis.allergy_concerns.map((concern, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-red-200">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-red-900">{concern.medication}</h4>
                        <Badge className="bg-red-100 text-red-800">
                          {concern.cross_reactivity_risk} risk
                        </Badge>
                      </div>
                      <p className="text-sm text-red-800 mb-2">
                        Patient allergic to: <strong>{concern.allergy}</strong>
                      </p>
                      <p className="text-sm text-red-900 font-medium">
                        → {concern.recommendation}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {analysis.monitoring_recommendations && analysis.monitoring_recommendations.length > 0 && (
              <Card className="border-none shadow-lg bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-base text-blue-900">
                    Recommended Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {analysis.monitoring_recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-blue-800">
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Button
              variant="outline"
              onClick={() => setAnalysis(null)}
              className="w-full"
            >
              Run New Analysis
            </Button>
          </>
        )}

        {!ehrData && (
          <Card className="border-none bg-indigo-50">
            <CardContent className="p-4">
              <p className="text-sm text-indigo-900 leading-relaxed">
                <strong>EHR Integration Demo:</strong> Load patient data from the simulated EHR above 
                to analyze drug-drug interactions, renal dosing, and allergy cross-reactivity using AI.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
