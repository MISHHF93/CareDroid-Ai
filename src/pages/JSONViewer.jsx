import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Code, 
  Copy, 
  Download,
  CheckCircle,
  FileJson,
  FileText
} from "lucide-react";

export default function JSONViewer() {
  const [copied, setCopied] = useState(false);

  // Sample structured clinical response
  const sampleResponse = {
    query: "Acute coronary syndrome diagnosis and management",
    timestamp: new Date().toISOString(),
    confidence: "high",
    
    summary: {
      condition: "Acute Coronary Syndrome (ACS)",
      urgency: "emergency",
      key_points: [
        "Time-sensitive condition requiring immediate evaluation",
        "ECG and troponin are critical diagnostic tools",
        "STEMI requires immediate reperfusion therapy"
      ]
    },
    
    differential_diagnosis: [
      {
        diagnosis: "ST-Elevation Myocardial Infarction (STEMI)",
        likelihood: "high",
        diagnostic_criteria: [
          "ST elevation ≥1mm in ≥2 contiguous leads",
          "New LBBB",
          "Elevated troponin"
        ],
        next_steps: [
          "Activate cath lab immediately",
          "Aspirin 325mg PO",
          "Heparin + P2Y12 inhibitor",
          "Door-to-balloon <90 minutes"
        ]
      },
      {
        diagnosis: "Non-STEMI (NSTEMI)",
        likelihood: "moderate",
        diagnostic_criteria: [
          "Elevated troponin without ST elevation",
          "ST depression or T-wave inversion",
          "Dynamic ECG changes"
        ],
        next_steps: [
          "Risk stratification (GRACE/TIMI score)",
          "Dual antiplatelet therapy",
          "Consider early invasive strategy if high risk"
        ]
      },
      {
        diagnosis: "Unstable Angina",
        likelihood: "moderate",
        diagnostic_criteria: [
          "Ischemic chest pain at rest or with minimal exertion",
          "Normal troponin",
          "ECG changes without infarction"
        ],
        next_steps: [
          "Antiplatelet therapy",
          "Beta-blockers",
          "Stress testing when stable"
        ]
      }
    ],
    
    suggested_protocols: [
      {
        protocol: "STEMI Protocol",
        actions: [
          "Immediate ECG within 10 minutes",
          "Aspirin 162-325mg chewed",
          "Nitroglycerin SL if SBP >90",
          "Morphine 2-4mg IV for pain",
          "Activate cardiac catheterization lab"
        ]
      },
      {
        protocol: "NSTEMI Risk Stratification",
        tools: ["GRACE Score", "TIMI Risk Score"],
        management_pathway: "High risk → Early invasive; Low risk → Conservative"
      }
    ],
    
    medications: [
      {
        drug: "Aspirin",
        dose: "162-325mg PO immediately, then 81mg daily",
        class: "antiplatelet"
      },
      {
        drug: "Clopidogrel",
        dose: "600mg loading, then 75mg daily",
        class: "P2Y12 inhibitor"
      },
      {
        drug: "Heparin",
        dose: "60 units/kg bolus, then 12 units/kg/hr",
        class: "anticoagulant"
      }
    ],
    
    source_citations: [
      {
        source: "2021 AHA/ACC Guideline for the Management of Patients with Acute Coronary Syndromes",
        evidence_level: "Grade A"
      },
      {
        source: "European Society of Cardiology Guidelines 2020",
        evidence_level: "Grade A"
      }
    ],
    
    fhir_output: {
      resourceType: "Condition",
      code: {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: "394659003",
            display: "Acute coronary syndrome"
          }
        ]
      },
      clinicalStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
            code: "active"
          }
        ]
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(sampleResponse, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(sampleResponse, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clinical-response.json';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-blue-50 pb-6">
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Code className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">JSON Viewer</h1>
            <p className="text-purple-100 text-sm">Structured AI outputs</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Action Buttons */}
        <Card className="border-none shadow-lg">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy JSON
                  </>
                )}
              </Button>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={downloadJSON}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <Badge variant="secondary" className="text-xs">
                <FileJson className="w-3 h-3 mr-1" />
                FHIR Compatible
              </Badge>
              <Badge variant="secondary" className="text-xs">
                HL7 Ready
              </Badge>
              <Badge className="bg-green-100 text-green-800 text-xs">
                High Confidence
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed View */}
        <Card className="border-none shadow-lg">
          <CardContent className="p-4">
            <Tabs defaultValue="summary">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="differential">DDx</TabsTrigger>
                <TabsTrigger value="protocols">Protocols</TabsTrigger>
                <TabsTrigger value="fhir">FHIR</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Clinical Query</h4>
                  <p className="text-sm text-neutral-700 p-3 bg-neutral-50 rounded-lg">
                    {sampleResponse.query}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">Condition</h4>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800">
                      {sampleResponse.summary.urgency}
                    </Badge>
                    <span className="text-sm font-medium">{sampleResponse.summary.condition}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">Key Points</h4>
                  <ul className="space-y-1">
                    {sampleResponse.summary.key_points.map((point, idx) => (
                      <li key={idx} className="text-sm text-neutral-700 flex gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="differential" className="space-y-3">
                {sampleResponse.differential_diagnosis.map((dx, idx) => (
                  <Card key={idx} className="bg-neutral-50">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm">{dx.diagnosis}</h4>
                        <Badge variant="outline" className="text-xs">
                          {dx.likelihood} likelihood
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-neutral-600 mb-1">Criteria:</p>
                          <ul className="text-xs text-neutral-700 space-y-0.5">
                            {dx.diagnostic_criteria.map((criteria, cIdx) => (
                              <li key={cIdx}>• {criteria}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-neutral-600 mb-1">Next Steps:</p>
                          <ul className="text-xs text-blue-700 space-y-0.5">
                            {dx.next_steps.map((step, sIdx) => (
                              <li key={sIdx}>→ {step}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="protocols" className="space-y-3">
                {sampleResponse.suggested_protocols.map((protocol, idx) => (
                  <Card key={idx} className="bg-blue-50">
                    <CardContent className="p-3">
                      <h4 className="font-semibold text-sm text-blue-900 mb-2">
                        {protocol.protocol}
                      </h4>
                      {protocol.actions && (
                        <ol className="space-y-1">
                          {protocol.actions.map((action, aIdx) => (
                            <li key={aIdx} className="text-sm text-blue-800 flex gap-2">
                              <span className="font-semibold">{aIdx + 1}.</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                      {protocol.tools && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-blue-700 mb-1">Tools:</p>
                          <div className="flex gap-1">
                            {protocol.tools.map((tool, tIdx) => (
                              <Badge key={tIdx} variant="outline" className="text-xs">
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="fhir">
                <div className="bg-neutral-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-green-400 font-mono">
                    {JSON.stringify(sampleResponse.fhir_output, null, 2)}
                  </pre>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  FHIR R4 compliant • Ready for EMR integration
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Source Citations */}
        <Card className="border-none shadow-lg bg-green-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Evidence Sources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sampleResponse.source_citations.map((citation, idx) => (
              <div key={idx} className="p-2 bg-white rounded border border-green-200">
                <p className="text-sm font-medium text-green-900">{citation.source}</p>
                <Badge className="bg-green-100 text-green-800 text-xs mt-1">
                  {citation.evidence_level}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-neutral-400 mt-4">
          🔒 Structured outputs for interoperability with EMR systems
        </p>
      </div>
    </div>
  );
}