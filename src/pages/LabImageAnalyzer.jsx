import React, { useState } from "react";
import { api } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  Camera,
  FileImage,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Sparkles
} from "lucide-react";

export default function LabImageAnalyzer() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysis(null);
    }
  };

  const analyzeLabImage = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    try {
      // Upload the image first
      const uploadResult = await api.integrations.Core.UploadFile({
        file: selectedFile
      });

      // Analyze with AI
      const prompt = `You are a clinical laboratory specialist analyzing an uploaded lab report image.

Extract all visible lab values from the image and provide comprehensive interpretation.

Return a JSON response with this structure:
{
  "extracted_values": [
    {
      "test_name": "test name",
      "value": "numeric value",
      "unit": "unit",
      "reference_range": "normal range if visible",
      "status": "normal/high/low/critical"
    }
  ],
  "overall_assessment": "clinical interpretation summary",
  "trends_identified": ["trend 1", "trend 2"],
  "critical_findings": ["finding 1 if any"],
  "patterns": ["pattern 1", "pattern 2"],
  "recommended_follow_up": ["recommendation 1", "recommendation 2"],
  "clinical_correlations": "how findings relate to each other"
}

Be thorough and clinically accurate. Flag any critical values.`;

      const response = await api.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: uploadResult.file_url,
        response_json_schema: {
          type: "object",
          properties: {
            extracted_values: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  test_name: { type: "string" },
                  value: { type: "string" },
                  unit: { type: "string" },
                  reference_range: { type: "string" },
                  status: { type: "string" }
                }
              }
            },
            overall_assessment: { type: "string" },
            trends_identified: { type: "array", items: { type: "string" } },
            critical_findings: { type: "array", items: { type: "string" } },
            patterns: { type: "array", items: { type: "string" } },
            recommended_follow_up: { type: "array", items: { type: "string" } },
            clinical_correlations: { type: "string" }
          }
        }
      });

      setAnalysis(response);
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Error analyzing image. Please ensure the image is clear and contains visible lab values.");
    }
    setIsAnalyzing(false);
  };

  const getStatusIcon = (status) => {
    const lower = status?.toLowerCase();
    if (lower === "critical") return <AlertTriangle className="w-4 h-4 text-red-600" />;
    if (lower === "high") return <TrendingUp className="w-4 h-4 text-orange-600" />;
    if (lower === "low") return <TrendingDown className="w-4 h-4 text-blue-600" />;
    return <CheckCircle className="w-4 h-4 text-green-600" />;
  };

  const getStatusColor = (status) => {
    const lower = status?.toLowerCase();
    if (lower === "critical") return "bg-red-100 text-red-800 border-red-300";
    if (lower === "high") return "bg-orange-100 text-orange-800 border-orange-300";
    if (lower === "low") return "bg-blue-100 text-blue-800 border-blue-300";
    return "bg-green-100 text-green-800 border-green-300";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 pb-6">
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Camera className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Lab Image Analyzer</h1>
            <p className="text-purple-100 text-sm">AI-powered lab report extraction</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Upload Section */}
        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Lab Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="lab-upload"
              />
              <label htmlFor="lab-upload" className="cursor-pointer">
                {previewUrl ? (
                  <div className="space-y-3">
                    <img 
                      src={previewUrl} 
                      alt="Lab report preview" 
                      className="max-h-64 mx-auto rounded-lg shadow-md"
                    />
                    <p className="text-sm text-green-600 font-medium">✓ Image loaded</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <FileImage className="w-16 h-16 text-neutral-400 mx-auto" />
                    <div>
                      <p className="text-base font-medium text-neutral-700">
                        Click to upload lab report
                      </p>
                      <p className="text-sm text-neutral-500 mt-1">
                        PNG, JPG, or PDF (Max 10MB)
                      </p>
                    </div>
                  </div>
                )}
              </label>
            </div>

            {selectedFile && (
              <Button
                onClick={analyzeLabImage}
                disabled={isAnalyzing}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing Lab Report...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Analyze with AI
                  </>
                )}
              </Button>
            )}

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800 leading-relaxed">
                <strong>Privacy Note:</strong> Upload de-identified lab reports only. 
                Remove patient names, MRNs, and dates of birth before uploading.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysis && (
          <>
            {/* Critical Findings */}
            {analysis.critical_findings && analysis.critical_findings.length > 0 && (
              <Card className="border-none shadow-lg border-l-4 border-l-red-500 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-red-900">
                    <AlertTriangle className="w-5 h-5" />
                    Critical Findings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.critical_findings.map((finding, idx) => (
                      <li key={idx} className="text-sm text-red-800 font-medium flex gap-2">
                        <span>⚠️</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Extracted Values */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-base">Extracted Lab Values</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.extracted_values?.map((lab, idx) => (
                  <Card key={idx} className={`border-2 ${getStatusColor(lab.status)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(lab.status)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-base text-neutral-900">
                              {lab.test_name}
                            </h4>
                            <Badge className={getStatusColor(lab.status)}>
                              {lab.status}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm">
                              <strong>Value:</strong> {lab.value} {lab.unit}
                            </p>
                            {lab.reference_range && (
                              <p className="text-sm text-neutral-600">
                                <strong>Reference:</strong> {lab.reference_range}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Overall Assessment */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-base">Clinical Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {analysis.overall_assessment}
                </p>
              </CardContent>
            </Card>

            {/* Trends & Patterns */}
            {analysis.trends_identified && analysis.trends_identified.length > 0 && (
              <Card className="border-none shadow-lg bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-base text-blue-900">
                    Trends Identified
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {analysis.trends_identified.map((trend, idx) => (
                      <li key={idx} className="text-sm text-blue-800 flex gap-2">
                        <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{trend}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Clinical Correlations */}
            {analysis.clinical_correlations && (
              <Card className="border-none shadow-lg bg-purple-50">
                <CardHeader>
                  <CardTitle className="text-base text-purple-900">
                    Clinical Correlations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-purple-800 leading-relaxed">
                    {analysis.clinical_correlations}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {analysis.recommended_follow_up && analysis.recommended_follow_up.length > 0 && (
              <Card className="border-none shadow-lg bg-green-50">
                <CardHeader>
                  <CardTitle className="text-base text-green-900">
                    Recommended Follow-Up
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {analysis.recommended_follow_up.map((rec, idx) => (
                      <li key={idx} className="text-sm text-green-800">
                        • {rec}
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
                  Clinical Verification Required
                </p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  AI-extracted values should be verified against original lab reports. 
                  Use this tool as a reference aid only. Always confirm critical values 
                  directly from official lab systems.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}