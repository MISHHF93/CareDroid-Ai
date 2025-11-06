import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GitBranch, Sparkles, Loader2, AlertTriangle, Target, CheckCircle } from "lucide-react";

export default function DifferentialDx() {
  const [presentation, setPresentation] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [differential, setDifferential] = useState(null);

  const generateDifferential = async () => {
    if (!presentation.trim()) return;

    setIsGenerating(true);
    try {
      const prompt = `You are a clinical assistant helping generate differential diagnoses.

Patient Presentation:
${presentation}

Generate a comprehensive differential diagnosis with the following JSON structure:
{
  "chief_complaint_summary": "brief restatement",
  "life_threatening": ["immediate threats to consider"],
  "most_likely": [
    {
      "diagnosis": "condition name",
      "likelihood": "high/moderate/low",
      "supporting_features": ["feature 1", "feature 2"],
      "distinguishing_features": "what makes this stand out",
      "next_steps": ["diagnostic step 1", "diagnostic step 2"]
    }
  ],
  "less_likely_but_important": [
    {
      "diagnosis": "condition",
      "reason": "why to consider despite lower likelihood"
    }
  ],
  "red_flags": ["warning sign 1", "warning sign 2"],
  "recommended_workup": ["investigation 1", "investigation 2"]
}

Use clinical reasoning. Be comprehensive but practical.`;

      const response = await api.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            chief_complaint_summary: { type: "string" },
            life_threatening: { type: "array", items: { type: "string" } },
            most_likely: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  diagnosis: { type: "string" },
                  likelihood: { type: "string" },
                  supporting_features: { type: "array", items: { type: "string" } },
                  distinguishing_features: { type: "string" },
                  next_steps: { type: "array", items: { type: "string" } }
                }
              }
            },
            less_likely_but_important: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  diagnosis: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            red_flags: { type: "array", items: { type: "string" } },
            recommended_workup: { type: "array", items: { type: "string" } }
          }
        }
      });

      setDifferential(response);
    } catch (error) {
      console.error("Generation error:", error);
    }
    setIsGenerating(false);
  };

  const getLikelihoodColor = (likelihood) => {
    const lower = likelihood?.toLowerCase();
    if (lower === "high") return "bg-red-100 text-red-800";
    if (lower === "moderate") return "bg-amber-100 text-amber-800";
    return "bg-blue-100 text-blue-800";
  };

  return (
    <div className="min-h-full bg-neutral-50 dark:bg-neutral-50 pb-6">
      <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <GitBranch className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Differential Diagnosis</h1>
            <p className="text-cyan-100 text-sm">AI-powered DDx builder</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle>Enter Clinical Presentation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Describe the patient presentation including:&#10;- Chief complaint&#10;- Key symptoms & duration&#10;- Pertinent positives & negatives&#10;- Vital signs if relevant&#10;- Risk factors&#10;&#10;Example: '55 yo M with acute onset severe chest pain radiating to left arm, started 2 hours ago, associated with diaphoresis and nausea. HTN, smoking history. BP 160/95, HR 102.'"
              value={presentation}
              onChange={(e) => setPresentation(e.target.value)}
              className="min-h-[200px] text-sm"
              rows={10}
            />

            <Button
              onClick={generateDifferential}
              disabled={!presentation.trim() || isGenerating}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Differential...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Differential Diagnosis
                </>
              )}
            </Button>

            <p className="text-xs text-neutral-500 text-center">
              Use de-identified patient information only. No names or MRNs.
            </p>
          </CardContent>
        </Card>

        {differential && (
          <>
            {/* Life-Threatening */}
            {differential.life_threatening && differential.life_threatening.length > 0 && (
              <Card className="border-none shadow-md border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-red-900 dark:text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    Life-Threatening Considerations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {differential.life_threatening.map((condition, idx) => (
                      <li key={idx} className="text-sm text-red-800 dark:text-red-500 flex gap-2 font-medium">
                        <span>⚠️</span>
                        <span>{condition}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Most Likely */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Most Likely Diagnoses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {differential.most_likely?.map((dx, idx) => (
                  <Card key={idx} className="bg-neutral-50 dark:bg-neutral-100 border-none">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h4 className="font-bold text-lg text-neutral-900 flex-1">
                          {idx + 1}. {dx.diagnosis}
                        </h4>
                        <Badge className={getLikelihoodColor(dx.likelihood)}>
                          {dx.likelihood} likelihood
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-neutral-700 mb-1">Supporting Features:</p>
                          <ul className="space-y-1">
                            {dx.supporting_features?.map((feature, fIdx) => (
                              <li key={fIdx} className="text-sm text-neutral-600 flex gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-2 border-t border-neutral-200">
                          <p className="text-xs font-semibold text-neutral-700 mb-1">Key Distinguishing Features:</p>
                          <p className="text-sm text-neutral-900 font-medium">{dx.distinguishing_features}</p>
                        </div>

                        <div className="pt-2 border-t border-neutral-200">
                          <p className="text-xs font-semibold text-neutral-700 mb-1">Next Steps:</p>
                          <ul className="space-y-1">
                            {dx.next_steps?.map((step, sIdx) => (
                              <li key={sIdx} className="text-sm text-blue-900 dark:text-blue-600">
                                • {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Less Likely */}
            {differential.less_likely_but_important && differential.less_likely_but_important.length > 0 && (
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">Less Likely But Important</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {differential.less_likely_but_important.map((item, idx) => (
                    <div key={idx} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <p className="font-semibold text-sm text-amber-900 dark:text-amber-400 mb-1">
                        {item.diagnosis}
                      </p>
                      <p className="text-xs text-amber-800 dark:text-amber-500">
                        {item.reason}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Red Flags */}
            {differential.red_flags && differential.red_flags.length > 0 && (
              <Card className="border-none shadow-md bg-orange-50 dark:bg-orange-900/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-orange-900 dark:text-orange-400">
                    <AlertTriangle className="w-5 h-5" />
                    Red Flags to Monitor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {differential.red_flags.map((flag, idx) => (
                      <li key={idx} className="text-sm text-orange-800 dark:text-orange-500 flex gap-2">
                        <span>🚩</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Recommended Workup */}
            {differential.recommended_workup && differential.recommended_workup.length > 0 && (
              <Card className="border-none shadow-md bg-blue-50 dark:bg-blue-900/20">
                <CardHeader>
                  <CardTitle className="text-base text-blue-900 dark:text-blue-400">
                    Recommended Workup
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {differential.recommended_workup.map((item, idx) => (
                      <li key={idx} className="text-sm text-blue-800 dark:text-blue-500">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Disclaimer */}
        <Card className="border-none bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-400 mb-1">
                  Clinical Judgment Required
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-500 leading-relaxed">
                  This AI-generated differential is for reference only. Consider patient-specific factors, 
                  local epidemiology, and clinical context. Always verify with evidence-based resources 
                  and senior consultation when appropriate.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}