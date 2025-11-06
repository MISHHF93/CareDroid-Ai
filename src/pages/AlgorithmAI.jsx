
import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  GitBranch, 
  Sparkles, 
  Loader2,
  AlertTriangle,
  Target,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import EHRPanel, { formatEHRForAI } from "../components/EHRPanel";
import AIWorkflowAssistant from "../components/AIWorkflowAssistant";

export default function AlgorithmAI() {
  const [scenario, setScenario] = useState("");
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("");
  const [parameters, setParameters] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiGuidance, setAiGuidance] = useState(null);
  const [ehrData, setEhrData] = useState(null);
  const [showEHRPanel, setShowEHRPanel] = useState(false);

  const algorithms = [
    { id: "chest_pain", name: "Chest Pain Algorithm", params: ["age", "sex", "pain_type", "ecg_findings", "troponin", "risk_factors"] },
    { id: "dyspnea", name: "Shortness of Breath", params: ["onset", "severity", "o2_sat", "lung_sounds", "leg_swelling", "history"] },
    { id: "abdominal_pain", name: "Abdominal Pain", params: ["location", "onset", "character", "fever", "peritoneal_signs", "imaging"] },
    { id: "altered_mental", name: "Altered Mental Status", params: ["onset", "glucose", "vitals", "focal_deficits", "history", "medications"] },
    { id: "syncope", name: "Syncope", params: ["exertional", "palpitations", "family_hx", "ecg", "orthostatics", "cardiac_hx"] }
  ];

  const handleEHRDataLoaded = (data) => {
    setEhrData(data);
    autoPopulateFromEHR(data);
  };

  const autoPopulateFromEHR = async (data) => {
    if (!data) return;

    try {
      const ehrContext = formatEHRForAI(data);
      
      const prompt = `You are a clinical AI analyzing patient data to recommend the most appropriate diagnostic algorithm.

${ehrContext}

Available Algorithms:
1. Chest Pain Algorithm - for chest pain evaluation
2. Shortness of Breath - for dyspnea evaluation
3. Abdominal Pain - for acute abdominal complaints
4. Altered Mental Status - for confusion/AMS
5. Syncope - for loss of consciousness

TASK: Based on this patient's active problems and clinical presentation, determine:
{
  "recommended_algorithm": "which algorithm is most relevant (use exact name from list)",
  "reasoning": "why this algorithm is appropriate",
  "auto_populated_parameters": {
    "parameter_name": "value extracted from EHR"
  },
  "clinical_scenario": "a brief 1-2 sentence clinical scenario to populate the scenario field"
}`;

      const result = await api.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_algorithm: { type: "string" },
            reasoning: { type: "string" },
            auto_populated_parameters: {
              type: "object",
              additionalProperties: { type: "string" }
            },
            clinical_scenario: { type: "string" }
          }
        }
      });

      // Auto-select algorithm
      const algorithmMatch = algorithms.find(a => 
        a.name.toLowerCase().includes(result.recommended_algorithm.toLowerCase())
      );
      
      if (algorithmMatch) {
        setSelectedAlgorithm(algorithmMatch.id);
        setScenario(result.clinical_scenario);
        
        // Filter auto-populated parameters to only include those relevant to the selected algorithm
        const filteredParams = {};
        algorithmMatch.params.forEach(paramKey => {
            if (result.auto_populated_parameters && result.auto_populated_parameters[paramKey]) {
                filteredParams[paramKey] = result.auto_populated_parameters[paramKey];
            }
        });
        setParameters(filteredParams);
        
        alert(`✨ AI Auto-Populated:\n\nAlgorithm: ${algorithmMatch.name}\n\nReasoning: ${result.reasoning}`);
      } else {
        alert(`AI recommended algorithm "${result.recommended_algorithm}" not found in our list. Please select manually.`);
      }
    } catch (error) {
      console.error("Error auto-populating:", error);
      alert("Failed to auto-populate from EHR data. Please try again or fill manually.");
    }
  };

  const analyzeWithAI = async () => {
    if (!selectedAlgorithm || !scenario) return;

    setIsAnalyzing(true);
    try {
      const algorithmName = algorithms.find(a => a.id === selectedAlgorithm)?.name;
      
      const parametersList = Object.entries(parameters)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");

      const prompt = `You are a clinical decision support AI analyzing a diagnostic algorithm.

Algorithm: ${algorithmName}

Clinical Scenario:
${scenario}

Patient Parameters:
${parametersList}

Provide AI-guided analysis in this JSON format:
{
  "most_probable_pathway": "which diagnostic/treatment path is most appropriate",
  "pathway_rationale": "detailed clinical reasoning for this pathway",
  "probability_score": "high/moderate/low confidence",
  "decision_points": [
    {
      "step": "decision step",
      "recommendation": "what to do",
      "reasoning": "why this is recommended",
      "critical_factors": ["factor 1", "factor 2"]
    }
  ],
  "red_flags": ["warning sign 1", "warning sign 2"],
  "alternative_pathways": [
    {
      "pathway": "alternative path",
      "when_to_consider": "circumstances"
    }
  ],
  "next_steps": ["immediate action 1", "action 2"],
  "key_questions": ["question to clarify diagnosis 1", "question 2"],
  "time_sensitivity": "immediate/urgent/routine"
}

Be clinically precise and evidence-based.`;

      const response = await api.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            most_probable_pathway: { type: "string" },
            pathway_rationale: { type: "string" },
            probability_score: { type: "string" },
            decision_points: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  step: { type: "string" },
                  recommendation: { type: "string" },
                  reasoning: { type: "string" },
                  critical_factors: { type: "array", items: { type: "string" } }
                }
              }
            },
            red_flags: { type: "array", items: { type: "string" } },
            alternative_pathways: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  pathway: { type: "string" },
                  when_to_consider: { type: "string" }
                }
              }
            },
            next_steps: { type: "array", items: { type: "string" } },
            key_questions: { type: "array", items: { type: "string" } },
            time_sensitivity: { type: "string" }
          }
        }
      });

      setAiGuidance(response);
    } catch (error) {
      console.error("Analysis error:", error);
    }
    setIsAnalyzing(false);
  };

  const getTimeSensitivityColor = (sensitivity) => {
    const lower = sensitivity?.toLowerCase();
    if (lower === "immediate") return "bg-red-100 text-red-800";
    if (lower === "urgent") return "bg-orange-100 text-orange-800";
    return "bg-blue-100 text-blue-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 pb-6">
      <div className="bg-gradient-to-br from-cyan-600 to-blue-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <GitBranch className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Algorithm Guidance</h1>
            <p className="text-cyan-100 text-sm">Smart diagnostic pathway analysis</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* EHR Integration Toggle */}
        <Card className="border-none shadow-lg bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-semibold text-purple-900">
                  AI Auto-Population from EHR
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowEHRPanel(!showEHRPanel)}
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                {showEHRPanel ? 'Hide' : 'Load'} EHR Data
              </Button>
            </div>
            {ehrData && (
              <p className="text-xs text-purple-700 mt-2">
                ✓ EHR data loaded - algorithm auto-populated with patient parameters
              </p>
            )}
          </CardContent>
        </Card>

        {/* EHR Panel */}
        {showEHRPanel && <EHRPanel onDataLoaded={handleEHRDataLoaded} />}

        {/* AI Workflow Assistant */}
        {ehrData && !aiGuidance && <AIWorkflowAssistant ehrData={ehrData} />}

        {/* Input Section */}
        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-base">Clinical Scenario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="algorithm">Select Algorithm</Label>
              <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                <SelectTrigger id="algorithm" className="mt-1">
                  <SelectValue placeholder="Choose diagnostic algorithm" />
                </SelectTrigger>
                <SelectContent>
                  {algorithms.map(alg => (
                    <SelectItem key={alg.id} value={alg.id}>
                      {alg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {ehrData && selectedAlgorithm && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Auto-selected based on patient data
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="scenario">Patient Presentation</Label>
              <textarea
                id="scenario"
                placeholder="Describe the clinical scenario (e.g., '55 yo M with acute onset chest pain, diaphoretic, HTN history...')"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                className="w-full mt-1 p-3 border rounded-lg min-h-[100px] text-sm"
                rows={4}
              />
              {ehrData && scenario && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Auto-populated from EHR
                </p>
              )}
            </div>

            {selectedAlgorithm && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-neutral-700">Key Parameters:</p>
                {algorithms.find(a => a.id === selectedAlgorithm)?.params.map(param => (
                  <div key={param}>
                    <Label htmlFor={param} className="text-xs capitalize">
                      {param.replace(/_/g, ' ')}
                    </Label>
                    <Input
                      id={param}
                      placeholder={`Enter ${param.replace(/_/g, ' ')}`}
                      value={parameters[param] || ""}
                      onChange={(e) => setParameters({...parameters, [param]: e.target.value})}
                      className="mt-1"
                    />
                    {ehrData && parameters[param] && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Auto-populated from EHR
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={analyzeWithAI}
              disabled={!selectedAlgorithm || !scenario || isAnalyzing}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing Pathway...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* AI Guidance Results */}
        {aiGuidance && (
          <>
            {/* Most Probable Pathway */}
            <Card className="border-none shadow-xl bg-gradient-to-r from-green-50 to-emerald-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-3">
                  <Target className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-green-900 mb-2">
                      Recommended Pathway
                    </h3>
                    <p className="text-base text-green-800 font-medium mb-3">
                      {aiGuidance.most_probable_pathway}
                    </p>
                    <Badge className={getTimeSensitivityColor(aiGuidance.time_sensitivity)}>
                      {aiGuidance.time_sensitivity} urgency
                    </Badge>
                  </div>
                </div>
                <div className="pt-3 border-t border-green-200">
                  <p className="text-sm font-semibold text-green-900 mb-1">Rationale:</p>
                  <p className="text-sm text-green-800 leading-relaxed">
                    {aiGuidance.pathway_rationale}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Red Flags */}
            {aiGuidance.red_flags && aiGuidance.red_flags.length > 0 && (
              <Card className="border-none shadow-lg border-l-4 border-l-red-500 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-red-900">
                    <AlertTriangle className="w-5 h-5" />
                    Red Flags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {aiGuidance.red_flags.map((flag, idx) => (
                      <li key={idx} className="text-sm text-red-800 font-medium flex gap-2">
                        <span>🚩</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Decision Points */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-base">AI-Guided Decision Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiGuidance.decision_points?.map((point, idx) => (
                  <Card key={idx} className="bg-blue-50 border-none">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-base text-blue-900 mb-2">
                            {point.step}
                          </h4>
                          <p className="text-sm text-blue-800 mb-2">
                            <strong>Recommendation:</strong> {point.recommendation}
                          </p>
                          <p className="text-sm text-blue-700 mb-2">
                            <strong>Reasoning:</strong> {point.reasoning}
                          </p>
                          {point.critical_factors && point.critical_factors.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold text-blue-900 mb-1">Critical Factors:</p>
                              <ul className="space-y-0.5">
                                {point.critical_factors.map((factor, fIdx) => (
                                  <li key={fIdx} className="text-xs text-blue-700 flex gap-1">
                                    <CheckCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                    <span>{factor}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card className="border-none shadow-lg bg-green-50">
              <CardHeader>
                <CardTitle className="text-base text-green-900 flex items-center gap-2">
                  <ArrowRight className="w-5 h-5" />
                  Immediate Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {aiGuidance.next_steps?.map((step, idx) => (
                    <li key={idx} className="text-sm text-green-800 flex gap-2">
                      <span className="font-bold">{idx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {/* Alternative Pathways */}
            {aiGuidance.alternative_pathways && aiGuidance.alternative_pathways.length > 0 && (
              <Card className="border-none shadow-lg bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-base text-amber-900">
                    Alternative Pathways to Consider
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {aiGuidance.alternative_pathways.map((alt, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg">
                      <p className="font-semibold text-sm text-amber-900 mb-1">
                        {alt.pathway}
                      </p>
                      <p className="text-xs text-amber-800">
                        <strong>Consider when:</strong> {alt.when_to_consider}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Key Questions */}
            {aiGuidance.key_questions && aiGuidance.key_questions.length > 0 && (
              <Card className="border-none shadow-lg bg-purple-50">
                <CardHeader>
                  <CardTitle className="text-base text-purple-900">
                    Key Diagnostic Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {aiGuidance.key_questions.map((q, idx) => (
                      <li key={idx} className="text-sm text-purple-800">
                        • {q}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Disclaimer */}
        <Card className="border-none bg-amber-50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">
                  Clinical Judgment Required
                </p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  AI pathway analysis is a decision support tool. Always integrate 
                  with clinical assessment, patient-specific factors, and local protocols. 
                  This is not a substitute for clinical expertise.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
