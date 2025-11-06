import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Loader2,
  Sparkles,
  Download,
  RefreshCw,
  Clock,
  Activity,
  AlertTriangle
} from "lucide-react";
import EHRPanel, { formatEHRForAI } from "../components/EHRPanel";

export default function EncounterSummary() {
  const [ehrData, setEhrData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadRecentActivity();
  }, []);

  const loadRecentActivity = async () => {
    try {
      const activity = await api.entities.AuditLog.list('-created_date', 10);
      setRecentActivity(activity);
    } catch (error) {
      console.error("Error loading activity:", error);
    }
  };

  const handleEHRDataLoaded = (data) => {
    setEhrData(data);
  };

  const generateEncounterSummary = async () => {
    if (!ehrData) return;

    setIsGenerating(true);
    try {
      const ehrContext = formatEHRForAI(ehrData);
      
      const activitySummary = recentActivity
        .map(a => `- ${a.action_type}: ${a.resource_accessed}`)
        .join('\n');

      const prompt = `You are a clinical documentation AI generating a comprehensive patient encounter summary.

${ehrContext}

Recent Clinical Activities (last 10 actions):
${activitySummary}

TASK: Generate a comprehensive clinical encounter summary in JSON format:
{
  "encounter_date": "${new Date().toISOString()}",
  "patient_summary": "Brief patient summary (age, sex, key diagnoses)",
  "chief_concerns": ["primary concern 1", "concern 2"],
  "clinical_assessment": {
    "active_problems": [
      {
        "problem": "diagnosis",
        "status": "stable/improving/worsening",
        "current_management": "treatment approach"
      }
    ],
    "medication_review": "assessment of current medication regimen with any concerns",
    "lab_findings": "summary of significant lab abnormalities and trends",
    "vital_signs_assessment": "interpretation of vital signs"
  },
  "clinical_actions_taken": [
    "action 1 based on recent tool usage",
    "action 2"
  ],
  "diagnostic_considerations": [
    "differential diagnosis or assessment performed"
  ],
  "care_plan": {
    "immediate_actions": ["action 1", "action 2"],
    "monitoring_plan": ["what to monitor 1", "what to monitor 2"],
    "follow_up": "follow-up recommendations"
  },
  "red_flags_identified": ["warning sign 1 if any"],
  "clinical_decision_support_used": [
    "which CareDroid tools were utilized and findings"
  ],
  "risk_assessment": {
    "overall_risk": "low/moderate/high",
    "specific_risks": ["risk 1", "risk 2"],
    "mitigation_strategies": ["strategy 1", "strategy 2"]
  },
  "documentation_notes": "any additional clinical notes for the medical record"
}

Synthesize EHR data with recent clinical tool usage to create a cohesive encounter summary.`;

      const result = await api.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            encounter_date: { type: "string" },
            patient_summary: { type: "string" },
            chief_concerns: { type: "array", items: { type: "string" } },
            clinical_assessment: {
              type: "object",
              properties: {
                active_problems: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      problem: { type: "string" },
                      status: { type: "string" },
                      current_management: { type: "string" }
                    }
                  }
                },
                medication_review: { type: "string" },
                lab_findings: { type: "string" },
                vital_signs_assessment: { type: "string" }
              }
            },
            clinical_actions_taken: { type: "array", items: { type: "string" } },
            diagnostic_considerations: { type: "array", items: { type: "string" } },
            care_plan: {
              type: "object",
              properties: {
                immediate_actions: { type: "array", items: { type: "string" } },
                monitoring_plan: { type: "array", items: { type: "string" } },
                follow_up: { type: "string" }
              }
            },
            red_flags_identified: { type: "array", items: { type: "string" } },
            clinical_decision_support_used: { type: "array", items: { type: "string" } },
            risk_assessment: {
              type: "object",
              properties: {
                overall_risk: { type: "string" },
                specific_risks: { type: "array", items: { type: "string" } },
                mitigation_strategies: { type: "array", items: { type: "string" } }
              }
            },
            documentation_notes: { type: "string" }
          }
        }
      });

      setSummary(result);
    } catch (error) {
      console.error("Error generating summary:", error);
    }
    setIsGenerating(false);
  };

  const downloadSummary = () => {
    if (!summary) return;
    
    const summaryText = `
PATIENT ENCOUNTER SUMMARY
Generated: ${new Date(summary.encounter_date).toLocaleString()}

PATIENT OVERVIEW:
${summary.patient_summary}

CHIEF CONCERNS:
${summary.chief_concerns.map(c => `• ${c}`).join('\n')}

CLINICAL ASSESSMENT:

Active Problems:
${summary.clinical_assessment.active_problems.map(p => 
  `• ${p.problem} [${p.status}]\n  Management: ${p.current_management}`
).join('\n')}

Medication Review:
${summary.clinical_assessment.medication_review}

Lab Findings:
${summary.clinical_assessment.lab_findings}

Vital Signs:
${summary.clinical_assessment.vital_signs_assessment}

CLINICAL ACTIONS TAKEN:
${summary.clinical_actions_taken.map(a => `• ${a}`).join('\n')}

DIAGNOSTIC CONSIDERATIONS:
${summary.diagnostic_considerations.map(d => `• ${d}`).join('\n')}

CARE PLAN:

Immediate Actions:
${summary.care_plan.immediate_actions.map(a => `• ${a}`).join('\n')}

Monitoring Plan:
${summary.care_plan.monitoring_plan.map(m => `• ${m}`).join('\n')}

Follow-up:
${summary.care_plan.follow_up}

RISK ASSESSMENT:
Overall Risk: ${summary.risk_assessment.overall_risk}

Specific Risks:
${summary.risk_assessment.specific_risks.map(r => `• ${r}`).join('\n')}

Mitigation Strategies:
${summary.risk_assessment.mitigation_strategies.map(s => `• ${s}`).join('\n')}

${summary.red_flags_identified.length > 0 ? `RED FLAGS:
${summary.red_flags_identified.map(f => `⚠️ ${f}`).join('\n')}` : ''}

CLINICAL DECISION SUPPORT USED:
${summary.clinical_decision_support_used.map(t => `• ${t}`).join('\n')}

DOCUMENTATION NOTES:
${summary.documentation_notes}

---
Generated by CareDroid Clinical Assistant
This is an AI-generated summary for reference purposes only.
    `.trim();

    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `encounter-summary-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  const getRiskColor = (risk) => {
    if (risk === "high") return "bg-red-100 text-red-800";
    if (risk === "moderate") return "bg-amber-100 text-amber-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-6">
      <div className="bg-gradient-to-br from-slate-600 to-slate-700 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Encounter Summary</h1>
            <p className="text-slate-200 text-sm">Automated clinical documentation</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* EHR Data Loading */}
        <EHRPanel onDataLoaded={handleEHRDataLoaded} />

        {/* Generate Button */}
        {ehrData && !summary && (
          <Button
            onClick={generateEncounterSummary}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 h-12"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Encounter Summary...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate AI Encounter Summary
              </>
            )}
          </Button>
        )}

        {/* Summary Display */}
        {summary && (
          <>
            {/* Header Info */}
            <Card className="border-none shadow-lg bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-semibold text-indigo-900">
                      {new Date(summary.encounter_date).toLocaleString()}
                    </span>
                  </div>
                  <Badge className={getRiskColor(summary.risk_assessment.overall_risk)}>
                    {summary.risk_assessment.overall_risk} risk
                  </Badge>
                </div>
                <h3 className="font-bold text-lg text-indigo-900 mb-2">Patient Overview</h3>
                <p className="text-sm text-indigo-800 leading-relaxed">
                  {summary.patient_summary}
                </p>
              </CardContent>
            </Card>

            {/* Chief Concerns */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-base">Chief Concerns</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {summary.chief_concerns.map((concern, idx) => (
                    <li key={idx} className="text-sm text-neutral-800">
                      • {concern}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Clinical Assessment */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Clinical Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Active Problems */}
                <div>
                  <h4 className="font-semibold text-sm text-neutral-700 mb-2">Active Problems:</h4>
                  {summary.clinical_assessment.active_problems.map((problem, idx) => (
                    <div key={idx} className="p-3 bg-neutral-50 rounded-lg mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{problem.problem}</span>
                        <Badge variant="outline" className="text-xs">
                          {problem.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-neutral-600">
                        Management: {problem.current_management}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Other Assessments */}
                <div className="space-y-3 pt-3 border-t">
                  <div>
                    <h4 className="font-semibold text-sm text-neutral-700 mb-1">Medication Review:</h4>
                    <p className="text-sm text-neutral-800">{summary.clinical_assessment.medication_review}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-neutral-700 mb-1">Lab Findings:</h4>
                    <p className="text-sm text-neutral-800">{summary.clinical_assessment.lab_findings}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-neutral-700 mb-1">Vital Signs:</h4>
                    <p className="text-sm text-neutral-800">{summary.clinical_assessment.vital_signs_assessment}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Red Flags */}
            {summary.red_flags_identified && summary.red_flags_identified.length > 0 && (
              <Card className="border-none shadow-lg border-l-4 border-l-red-500 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-base text-red-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Red Flags Identified
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {summary.red_flags_identified.map((flag, idx) => (
                      <li key={idx} className="text-sm text-red-800 font-medium">
                        ⚠️ {flag}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Care Plan */}
            <Card className="border-none shadow-lg bg-green-50">
              <CardHeader>
                <CardTitle className="text-base text-green-900">Care Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm text-green-900 mb-2">Immediate Actions:</h4>
                  <ol className="space-y-1">
                    {summary.care_plan.immediate_actions.map((action, idx) => (
                      <li key={idx} className="text-sm text-green-800">
                        {idx + 1}. {action}
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-green-900 mb-2">Monitoring Plan:</h4>
                  <ul className="space-y-1">
                    {summary.care_plan.monitoring_plan.map((item, idx) => (
                      <li key={idx} className="text-sm text-green-800">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-green-900 mb-1">Follow-up:</h4>
                  <p className="text-sm text-green-800">{summary.care_plan.follow_up}</p>
                </div>
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-base">Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                  <span className="font-semibold text-sm">Overall Risk Level:</span>
                  <Badge className={getRiskColor(summary.risk_assessment.overall_risk)}>
                    {summary.risk_assessment.overall_risk}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-neutral-700 mb-2">Specific Risks:</h4>
                  <ul className="space-y-1">
                    {summary.risk_assessment.specific_risks.map((risk, idx) => (
                      <li key={idx} className="text-sm text-neutral-800">
                        • {risk}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-neutral-700 mb-2">Mitigation Strategies:</h4>
                  <ul className="space-y-1">
                    {summary.risk_assessment.mitigation_strategies.map((strategy, idx) => (
                      <li key={idx} className="text-sm text-neutral-800">
                        • {strategy}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Clinical Decision Support */}
            <Card className="border-none shadow-lg bg-blue-50">
              <CardHeader>
                <CardTitle className="text-base text-blue-900">
                  Clinical Decision Support Tools Used
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {summary.clinical_decision_support_used.map((tool, idx) => (
                    <li key={idx} className="text-sm text-blue-800">
                      • {tool}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={downloadSummary}
                variant="outline"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Summary
              </Button>
              <Button
                onClick={() => setSummary(null)}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate New
              </Button>
            </div>
          </>
        )}

        {/* Info */}
        {!ehrData && (
          <Card className="border-none bg-indigo-50">
            <CardContent className="p-4">
              <p className="text-sm text-indigo-900 leading-relaxed">
                <strong>AI Encounter Summary:</strong> Load patient EHR data above to generate 
                a comprehensive, AI-synthesized clinical encounter summary that integrates patient 
                data with recent tool usage for automated documentation.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}