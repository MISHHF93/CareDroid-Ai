import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Sparkles, 
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Zap
} from "lucide-react";
import { formatEHRForAI } from "./EHRPanel";

export default function AIWorkflowAssistant({ ehrData }) {
  const [suggestions, setSuggestions] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (ehrData) {
      analyzeClinicalWorkflow();
    }
  }, [ehrData]);

  const analyzeClinicalWorkflow = async () => {
    setIsAnalyzing(true);
    try {
      const ehrContext = formatEHRForAI(ehrData);
      
      const prompt = `You are a clinical workflow AI assistant analyzing patient data to recommend optimal clinical tools and actions.

${ehrContext}

TASK: Analyze this patient's EHR data and provide actionable workflow recommendations in JSON format:
{
  "clinical_priorities": [
    {
      "priority": "immediate/urgent/routine",
      "issue": "clinical issue identified",
      "rationale": "why this is important"
    }
  ],
  "recommended_tools": [
    {
      "tool": "Drug Interactions/Scoring Systems/Medical Calculators/Lab Interpreter/Clinical Protocols",
      "reason": "why this tool is relevant for this patient",
      "specific_action": "what to check or calculate",
      "urgency": "high/medium/low"
    }
  ],
  "suggested_assessments": [
    {
      "assessment": "specific assessment to perform",
      "tool_to_use": "which CareDroid tool to use",
      "parameters": "what patient data to input"
    }
  ],
  "drug_safety_alerts": [
    "specific drug safety concern if any"
  ],
  "care_optimization": "brief summary of how to optimize this patient's care"
}

Focus on actionable recommendations based on the patient's active problems, medications, and lab abnormalities.`;

      const result = await api.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            clinical_priorities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  priority: { type: "string" },
                  issue: { type: "string" },
                  rationale: { type: "string" }
                }
              }
            },
            recommended_tools: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tool: { type: "string" },
                  reason: { type: "string" },
                  specific_action: { type: "string" },
                  urgency: { type: "string" }
                }
              }
            },
            suggested_assessments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  assessment: { type: "string" },
                  tool_to_use: { type: "string" },
                  parameters: { type: "string" }
                }
              }
            },
            drug_safety_alerts: {
              type: "array",
              items: { type: "string" }
            },
            care_optimization: { type: "string" }
          }
        }
      });

      setSuggestions(result);
    } catch (error) {
      console.error("Error analyzing workflow:", error);
    }
    setIsAnalyzing(false);
  };

  const getToolPath = (toolName) => {
    const toolMap = {
      "Drug Interactions": "DrugInteractions",
      "Scoring Systems": "ScoringSystem",
      "Medical Calculators": "Calculators",
      "Lab Interpreter": "LabInterpreter",
      "Clinical Protocols": "Protocols",
      "Diagnostic Algorithms": "Algorithms",
      "AI Algorithm Guidance": "AlgorithmAI"
    };
    return toolMap[toolName] || "Home";
  };

  const getPriorityColor = (priority) => {
    if (priority === "immediate") return "bg-red-100 text-red-800";
    if (priority === "urgent") return "bg-orange-100 text-orange-800";
    return "bg-blue-100 text-blue-800";
  };

  const getUrgencyIcon = (urgency) => {
    if (urgency === "high") return <AlertTriangle className="w-4 h-4 text-red-600" />;
    if (urgency === "medium") return <Zap className="w-4 h-4 text-orange-600" />;
    return <CheckCircle className="w-4 h-4 text-blue-600" />;
  };

  if (isAnalyzing) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 mx-auto mb-3 animate-spin" />
          <p className="text-sm text-neutral-600">Analyzing clinical workflow...</p>
        </CardContent>
      </Card>
    );
  }

  if (!suggestions) return null;

  return (
    <div className="space-y-4">
      {/* Clinical Priorities */}
      {suggestions.clinical_priorities && suggestions.clinical_priorities.length > 0 && (
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Clinical Priorities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestions.clinical_priorities.map((priority, idx) => (
              <div key={idx} className={`p-3 rounded-lg ${getPriorityColor(priority.priority)}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={getPriorityColor(priority.priority)}>
                    {priority.priority}
                  </Badge>
                  <span className="font-semibold text-sm">{priority.issue}</span>
                </div>
                <p className="text-xs leading-relaxed">
                  {priority.rationale}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommended Tools */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            AI-Recommended Clinical Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestions.recommended_tools?.map((tool, idx) => (
            <Link key={idx} to={createPageUrl(getToolPath(tool.tool))}>
              <Card className="bg-white hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-indigo-300">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {getUrgencyIcon(tool.urgency)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-base text-neutral-900">
                          {tool.tool}
                        </h4>
                        <ArrowRight className="w-4 h-4 text-neutral-400" />
                      </div>
                      <p className="text-sm text-neutral-700 mb-2">
                        <strong>Action:</strong> {tool.specific_action}
                      </p>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        {tool.reason}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Suggested Assessments */}
      {suggestions.suggested_assessments && suggestions.suggested_assessments.length > 0 && (
        <Card className="border-none shadow-lg bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base text-blue-900">
              Suggested Clinical Assessments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.suggested_assessments.map((assessment, idx) => (
              <div key={idx} className="p-3 bg-white rounded-lg border border-blue-200">
                <h4 className="font-semibold text-sm text-blue-900 mb-1">
                  {assessment.assessment}
                </h4>
                <p className="text-sm text-blue-800 mb-1">
                  <strong>Tool:</strong> {assessment.tool_to_use}
                </p>
                <p className="text-xs text-blue-700">
                  <strong>Parameters:</strong> {assessment.parameters}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Drug Safety Alerts */}
      {suggestions.drug_safety_alerts && suggestions.drug_safety_alerts.length > 0 && (
        <Card className="border-none shadow-lg border-l-4 border-l-red-500 bg-red-50">
          <CardHeader>
            <CardTitle className="text-base text-red-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Drug Safety Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {suggestions.drug_safety_alerts.map((alert, idx) => (
                <li key={idx} className="text-sm text-red-800 flex gap-2">
                  <span className="font-bold">⚠️</span>
                  <span>{alert}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Care Optimization Summary */}
      <Card className="border-none shadow-lg bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-green-900 mb-1">
                Care Optimization Strategy
              </h4>
              <p className="text-sm text-green-800 leading-relaxed">
                {suggestions.care_optimization}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        onClick={analyzeClinicalWorkflow}
        className="w-full"
        disabled={isAnalyzing}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Refresh AI Recommendations
      </Button>
    </div>
  );
}