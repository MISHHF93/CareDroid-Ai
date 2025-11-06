import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TestTube, Plus, X, Sparkles, Loader2, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

export default function LabInterpreter() {
  const [labs, setLabs] = useState([]);
  const [currentLab, setCurrentLab] = useState({ name: "", value: "", unit: "" });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interpretation, setInterpretation] = useState(null);

  const commonLabs = [
    { name: "WBC", unit: "K/μL", normal: "4.5-11" },
    { name: "Hemoglobin", unit: "g/dL", normal: "12-16 (F), 14-18 (M)" },
    { name: "Platelets", unit: "K/μL", normal: "150-400" },
    { name: "Sodium", unit: "mEq/L", normal: "136-145" },
    { name: "Potassium", unit: "mEq/L", normal: "3.5-5.0" },
    { name: "Chloride", unit: "mEq/L", normal: "98-107" },
    { name: "CO2", unit: "mEq/L", normal: "23-29" },
    { name: "BUN", unit: "mg/dL", normal: "7-20" },
    { name: "Creatinine", unit: "mg/dL", normal: "0.6-1.2" },
    { name: "Glucose", unit: "mg/dL", normal: "70-100" },
    { name: "Calcium", unit: "mg/dL", normal: "8.5-10.5" }
  ];

  const addLab = () => {
    if (currentLab.name && currentLab.value) {
      setLabs([...labs, { ...currentLab, id: Date.now() }]);
      setCurrentLab({ name: "", value: "", unit: "" });
      setInterpretation(null);
    }
  };

  const removeLab = (id) => {
    setLabs(labs.filter(lab => lab.id !== id));
    setInterpretation(null);
  };

  const quickAdd = (lab) => {
    setCurrentLab({ ...currentLab, name: lab.name, unit: lab.unit });
  };

  const interpretLabs = async () => {
    if (labs.length === 0) return;

    setIsAnalyzing(true);
    try {
      const labSummary = labs.map(l => `${l.name}: ${l.value} ${l.unit}`).join("\n");

      const prompt = `You are a clinical laboratory specialist. Interpret the following lab results comprehensively.

Lab Results:
${labSummary}

Provide interpretation in this JSON format:
{
  "overall_assessment": "brief clinical summary",
  "abnormalities": [
    {
      "test": "test name",
      "value": "value with unit",
      "status": "high/low/critical",
      "clinical_significance": "what this means",
      "possible_causes": ["cause 1", "cause 2"],
      "recommended_action": "next step"
    }
  ],
  "patterns_identified": ["pattern 1", "pattern 2"],
  "additional_testing": ["test 1", "test 2"],
  "clinical_correlations": "how these labs fit together"
}

Be clinically accurate. Flag critical values. Suggest patterns (e.g., anemia, renal failure, DKA).`;

      const response = await api.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            overall_assessment: { type: "string" },
            abnormalities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  test: { type: "string" },
                  value: { type: "string" },
                  status: { type: "string" },
                  clinical_significance: { type: "string" },
                  possible_causes: { type: "array", items: { type: "string" } },
                  recommended_action: { type: "string" }
                }
              }
            },
            patterns_identified: { type: "array", items: { type: "string" } },
            additional_testing: { type: "array", items: { type: "string" } },
            clinical_correlations: { type: "string" }
          }
        }
      });

      setInterpretation(response);
    } catch (error) {
      console.error("Analysis error:", error);
    }
    setIsAnalyzing(false);
  };

  const getStatusColor = (status) => {
    const lower = status?.toLowerCase();
    if (lower === "critical") return "bg-red-100 text-red-800 border-red-300";
    if (lower === "high") return "bg-orange-100 text-orange-800 border-orange-300";
    if (lower === "low") return "bg-blue-100 text-blue-800 border-blue-300";
    return "bg-neutral-100 text-neutral-800";
  };

  const getStatusIcon = (status) => {
    const lower = status?.toLowerCase();
    if (lower === "high" || lower === "critical") return <TrendingUp className="w-4 h-4" />;
    if (lower === "low") return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  return (
    <div className="min-h-full bg-neutral-50 dark:bg-neutral-50 pb-6">
      <div className="bg-gradient-to-br from-amber-500 to-amber-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <TestTube className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Lab Interpreter</h1>
            <p className="text-amber-100 text-sm">Batch lab result analysis</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle>Enter Lab Values</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-3 sm:col-span-1">
                <Label htmlFor="labName" className="text-xs">Test Name</Label>
                <Input
                  id="labName"
                  placeholder="e.g., WBC"
                  value={currentLab.name}
                  onChange={(e) => setCurrentLab({ ...currentLab, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="labValue" className="text-xs">Value</Label>
                <Input
                  id="labValue"
                  type="number"
                  step="0.01"
                  placeholder="12.5"
                  value={currentLab.value}
                  onChange={(e) => setCurrentLab({ ...currentLab, value: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="labUnit" className="text-xs">Unit</Label>
                <Input
                  id="labUnit"
                  placeholder="g/dL"
                  value={currentLab.unit}
                  onChange={(e) => setCurrentLab({ ...currentLab, unit: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <Button onClick={addLab} disabled={!currentLab.name || !currentLab.value} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Lab Value
            </Button>

            {/* Quick Add */}
            <div>
              <p className="text-xs text-neutral-600 mb-2">Quick add common labs:</p>
              <div className="flex flex-wrap gap-1">
                {commonLabs.slice(0, 8).map((lab, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="cursor-pointer hover:bg-neutral-100 text-xs"
                    onClick={() => quickAdd(lab)}
                  >
                    {lab.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Entered Labs */}
            {labs.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-neutral-700">Entered Labs ({labs.length}):</p>
                {labs.map((lab) => (
                  <div key={lab.id} className="flex items-center justify-between p-2 bg-neutral-50 rounded border">
                    <div>
                      <span className="font-medium text-sm">{lab.name}:</span>
                      <span className="ml-2 text-sm text-neutral-700">{lab.value} {lab.unit}</span>
                    </div>
                    <button onClick={() => removeLab(lab.id)} className="text-red-600 hover:text-red-800">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={interpretLabs}
              disabled={labs.length === 0 || isAnalyzing}
              className="w-full bg-amber-600 hover:bg-amber-700"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing Labs...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Interpret {labs.length} Labs
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {interpretation && (
          <>
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Overall Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {interpretation.overall_assessment}
                </p>
              </CardContent>
            </Card>

            {interpretation.abnormalities && interpretation.abnormalities.length > 0 && (
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">Abnormal Values</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {interpretation.abnormalities.map((abn, idx) => (
                    <Card key={idx} className={`border-2 ${getStatusColor(abn.status)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-2">
                          {getStatusIcon(abn.status)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-base text-neutral-900">{abn.test}</h4>
                              <Badge className={getStatusColor(abn.status)}>
                                {abn.status}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-neutral-700 mb-2">{abn.value}</p>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <p className="text-neutral-800">
                            <strong>Significance:</strong> {abn.clinical_significance}
                          </p>
                          {abn.possible_causes && abn.possible_causes.length > 0 && (
                            <div>
                              <strong>Possible Causes:</strong>
                              <ul className="list-disc list-inside text-neutral-600 ml-2">
                                {abn.possible_causes.map((cause, cIdx) => (
                                  <li key={cIdx}>{cause}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <p className="text-blue-900 font-medium">
                            <strong>Action:</strong> {abn.recommended_action}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {interpretation.patterns_identified && interpretation.patterns_identified.length > 0 && (
              <Card className="border-none shadow-md bg-purple-50 dark:bg-purple-900/20">
                <CardHeader>
                  <CardTitle className="text-base text-purple-900 dark:text-purple-400">
                    Clinical Patterns Identified
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {interpretation.patterns_identified.map((pattern, idx) => (
                      <li key={idx} className="text-sm text-purple-800 dark:text-purple-500 flex gap-2">
                        <span>🔍</span>
                        <span>{pattern}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {interpretation.clinical_correlations && (
              <Card className="border-none shadow-md bg-blue-50 dark:bg-blue-900/20">
                <CardHeader>
                  <CardTitle className="text-base text-blue-900 dark:text-blue-400">
                    Clinical Correlations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-800 dark:text-blue-500 leading-relaxed">
                    {interpretation.clinical_correlations}
                  </p>
                </CardContent>
              </Card>
            )}

            {interpretation.additional_testing && interpretation.additional_testing.length > 0 && (
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">Recommended Additional Testing</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {interpretation.additional_testing.map((test, idx) => (
                      <li key={idx} className="text-sm text-neutral-700">
                        • {test}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <Card className="border-none bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-400 mb-1">
                  Clinical Correlation Required
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-500 leading-relaxed">
                  Lab interpretation requires clinical context. Consider patient history, physical exam, 
                  and other test results. Verify critical values immediately.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}