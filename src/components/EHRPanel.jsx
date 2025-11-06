import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Database, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight,
  AlertTriangle,
  Activity,
  Pill,
  TestTube,
  User,
  TrendingUp,
  TrendingDown
} from "lucide-react";

// Mock EHR Service - inline
const mockEHRService = {
  async getPatientDemographics() {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      patientId: "mock-patient-001",
      mrn: "MRN-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      initials: "J.D.",
      age: Math.floor(Math.random() * 60) + 20,
      sex: Math.random() > 0.5 ? "M" : "F",
      dob: "YYYY-MM-DD",
      allergies: [
        { allergen: "Penicillin", reaction: "Rash", severity: "Moderate" },
        { allergen: "Sulfa drugs", reaction: "Stevens-Johnson Syndrome", severity: "Severe" }
      ],
      activeProblems: [
        "Type 2 Diabetes Mellitus",
        "Hypertension",
        "Chronic Kidney Disease Stage 3",
        "Coronary Artery Disease"
      ],
      vitalSigns: {
        bloodPressure: "142/88 mmHg",
        heartRate: "76 bpm",
        temperature: "98.6°F",
        respiratoryRate: "16 /min",
        oxygenSaturation: "97% on room air",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    };
  },

  async getActiveMedications() {
    await new Promise(resolve => setTimeout(resolve, 600));
    return [
      { medication: "Metformin", dose: "1000mg", route: "PO", frequency: "BID", startDate: "2023-01-15", indication: "Type 2 Diabetes" },
      { medication: "Lisinopril", dose: "20mg", route: "PO", frequency: "Daily", startDate: "2022-06-10", indication: "Hypertension" },
      { medication: "Atorvastatin", dose: "40mg", route: "PO", frequency: "Daily at bedtime", startDate: "2022-03-20", indication: "Hyperlipidemia" },
      { medication: "Aspirin", dose: "81mg", route: "PO", frequency: "Daily", startDate: "2022-03-20", indication: "CAD prophylaxis" },
      { medication: "Warfarin", dose: "5mg", route: "PO", frequency: "Daily", startDate: "2023-08-01", indication: "Atrial fibrillation" }
    ];
  },

  async getRecentLabs() {
    await new Promise(resolve => setTimeout(resolve, 700));
    return {
      collectionDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      results: [
        { test: "Hemoglobin", value: "12.8", unit: "g/dL", normalRange: "13.5-17.5", status: "Low" },
        { test: "WBC", value: "8.5", unit: "×10³/μL", normalRange: "4.0-11.0", status: "Normal" },
        { test: "Platelets", value: "245", unit: "×10³/μL", normalRange: "150-400", status: "Normal" },
        { test: "Creatinine", value: "1.8", unit: "mg/dL", normalRange: "0.7-1.3", status: "High" },
        { test: "eGFR", value: "42", unit: "mL/min/1.73m²", normalRange: ">60", status: "Low" },
        { test: "BUN", value: "28", unit: "mg/dL", normalRange: "7-20", status: "High" },
        { test: "Glucose (fasting)", value: "145", unit: "mg/dL", normalRange: "70-100", status: "High" },
        { test: "HbA1c", value: "7.8", unit: "%", normalRange: "<5.7", status: "High" },
        { test: "INR", value: "2.8", unit: "", normalRange: "0.8-1.2", status: "High" },
        { test: "Potassium", value: "4.2", unit: "mEq/L", normalRange: "3.5-5.0", status: "Normal" },
        { test: "Sodium", value: "138", unit: "mEq/L", normalRange: "135-145", status: "Normal" }
      ]
    };
  },

  async getPatientContext() {
    const [demographics, medications, labs] = await Promise.all([
      this.getPatientDemographics(),
      this.getActiveMedications(),
      this.getRecentLabs()
    ]);
    return { demographics, medications, labs, lastUpdated: new Date().toISOString() };
  }
};

export default function EHRPanel({ onDataLoaded }) {
  const [ehrData, setEhrData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    demographics: true,
    medications: true,
    labs: false
  });

  const loadEHRData = async () => {
    setIsLoading(true);
    try {
      const data = await mockEHRService.getPatientContext();
      setEhrData(data);
      if (onDataLoaded) {
        onDataLoaded(data);
      }
    } catch (error) {
      console.error("Error loading EHR data:", error);
    }
    setIsLoading(false);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStatusColor = (status) => {
    if (status === "High" || status === "Low") return "text-amber-600 bg-amber-50";
    if (status === "Critical") return "text-red-600 bg-red-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <Card className="border-none shadow-lg mb-4">
      <CardHeader 
        className="bg-gradient-to-r from-indigo-50 to-purple-50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            EHR Patient Context
            <Badge variant="secondary" className="text-xs">
              FHIR/HL7 Integration Demo
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {!ehrData && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  loadEHRData();
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-1" />
                    Load Patient Data
                  </>
                )}
              </Button>
            )}
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-neutral-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-neutral-400" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && ehrData && (
        <CardContent className="p-4 space-y-3">
          {/* Demographics */}
          <div>
            <div 
              className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100"
              onClick={() => toggleSection('demographics')}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold">Demographics & Vitals</span>
              </div>
              {expandedSections.demographics ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>

            {expandedSections.demographics && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-neutral-600">Patient:</span>
                    <span className="font-medium ml-2">{ehrData.demographics.initials}</span>
                  </div>
                  <div>
                    <span className="text-neutral-600">MRN:</span>
                    <span className="font-mono text-xs ml-2">{ehrData.demographics.mrn}</span>
                  </div>
                  <div>
                    <span className="text-neutral-600">Age/Sex:</span>
                    <span className="font-medium ml-2">{ehrData.demographics.age}y {ehrData.demographics.sex}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-blue-200">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Recent Vitals:</p>
                  <div className="text-xs text-blue-800 space-y-0.5">
                    <p>BP: {ehrData.demographics.vitalSigns.bloodPressure} | HR: {ehrData.demographics.vitalSigns.heartRate}</p>
                    <p>SpO2: {ehrData.demographics.vitalSigns.oxygenSaturation}</p>
                  </div>
                </div>

                {ehrData.demographics.allergies.length > 0 && (
                  <div className="pt-2 border-t border-blue-200">
                    <p className="text-xs font-semibold text-red-900 mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Allergies:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {ehrData.demographics.allergies.map((allergy, idx) => (
                        <Badge key={idx} className="bg-red-100 text-red-800 text-xs">
                          {allergy.allergen}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-blue-200">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Active Problems:</p>
                  <div className="text-xs text-blue-800">
                    {ehrData.demographics.activeProblems.map((problem, idx) => (
                      <p key={idx}>• {problem}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Medications */}
          <div>
            <div 
              className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100"
              onClick={() => toggleSection('medications')}
            >
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold">Active Medications ({ehrData.medications.length})</span>
              </div>
              {expandedSections.medications ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>

            {expandedSections.medications && (
              <div className="mt-2 space-y-1">
                {ehrData.medications.map((med, idx) => (
                  <div key={idx} className="p-2 bg-purple-50 rounded text-xs">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-purple-900">{med.medication}</p>
                        <p className="text-purple-700">{med.dose} {med.route} {med.frequency}</p>
                        <p className="text-purple-600 text-xs">For: {med.indication}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Labs */}
          <div>
            <div 
              className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100"
              onClick={() => toggleSection('labs')}
            >
              <div className="flex items-center gap-2">
                <TestTube className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold">Recent Labs</span>
                <span className="text-xs text-neutral-500">
                  ({new Date(ehrData.labs.collectionDate).toLocaleDateString()})
                </span>
              </div>
              {expandedSections.labs ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>

            {expandedSections.labs && (
              <div className="mt-2 space-y-1">
                {ehrData.labs.results.map((lab, idx) => (
                  <div key={idx} className={`p-2 rounded text-xs ${getStatusColor(lab.status)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="font-semibold">{lab.test}:</span>
                        <span className="ml-2">{lab.value} {lab.unit}</span>
                        {lab.status !== "Normal" && (
                          <span className="ml-2 font-medium">
                            {lab.status === "High" && <TrendingUp className="w-3 h-3 inline" />}
                            {lab.status === "Low" && <TrendingDown className="w-3 h-3 inline" />}
                            {lab.status}
                          </span>
                        )}
                      </div>
                      <span className="text-xs opacity-75">[{lab.normalRange}]</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-500">
                Last synced: {new Date(ehrData.lastUpdated).toLocaleTimeString()}
              </p>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={loadEHRData}
                disabled={isLoading}
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-800">
              <strong>Demo Mode:</strong> This simulates FHIR/HL7 integration with hospital EHR systems. 
              In production, real patient data would be fetched securely via API.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Export helper for AI formatting
export const formatEHRForAI = (ehrData) => {
  const { demographics, medications, labs } = ehrData;
  
  return `
PATIENT CONTEXT (De-identified):
Age: ${demographics.age} years
Sex: ${demographics.sex}
Active Problems: ${demographics.activeProblems.join(", ")}
Allergies: ${demographics.allergies.map(a => `${a.allergen} (${a.severity})`).join(", ")}

Current Vitals:
- BP: ${demographics.vitalSigns.bloodPressure}
- HR: ${demographics.vitalSigns.heartRate}
- SpO2: ${demographics.vitalSigns.oxygenSaturation}

Active Medications:
${medications.map(m => `- ${m.medication} ${m.dose} ${m.frequency} (for ${m.indication})`).join("\n")}

Recent Lab Results (${new Date(labs.collectionDate).toLocaleDateString()}):
${labs.results.map(l => `- ${l.test}: ${l.value} ${l.unit} [${l.normalRange}] ${l.status !== "Normal" ? "⚠️ " + l.status : ""}`).join("\n")}
`.trim();
};