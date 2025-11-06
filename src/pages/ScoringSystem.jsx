import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Info } from "lucide-react";

export default function ScoringSystem() {
  const [selectedScore, setSelectedScore] = useState(null);

  const scoringSystems = [
    {
      id: "curb65",
      name: "CURB-65",
      category: "Pulmonology",
      description: "Pneumonia severity assessment",
      color: "blue",
      calculate: (data) => {
        let score = 0;
        if (data.confusion) score++;
        if (data.urea > 7) score++;
        if (data.rr >= 30) score++;
        if (data.sbp < 90 || data.dbp <= 60) score++;
        if (data.age >= 65) score++;

        let risk = "";
        let recommendation = "";
        if (score <= 1) {
          risk = "Low";
          recommendation = "Consider outpatient treatment";
        } else if (score === 2) {
          risk = "Moderate";
          recommendation = "Consider hospital admission";
        } else {
          risk = "High";
          recommendation = "Hospital admission, consider ICU";
        }

        return { score, risk, recommendation };
      },
      fields: [
        { name: "confusion", label: "Confusion", type: "checkbox" },
        { name: "urea", label: "BUN > 7 mmol/L (or > 20 mg/dL)", type: "number", unit: "mmol/L" },
        { name: "rr", label: "Respiratory Rate", type: "number", unit: "breaths/min" },
        { name: "sbp", label: "Systolic BP", type: "number", unit: "mmHg" },
        { name: "dbp", label: "Diastolic BP", type: "number", unit: "mmHg" },
        { name: "age", label: "Age", type: "number", unit: "years" }
      ]
    },
    {
      id: "sofa",
      name: "SOFA Score",
      category: "Critical Care",
      description: "Sepsis-related organ failure assessment",
      color: "red",
      calculate: (data) => {
        let score = 0;
        
        // Respiration (PaO2/FiO2)
        if (data.pao2fio2 < 100) score += 4;
        else if (data.pao2fio2 < 200) score += 3;
        else if (data.pao2fio2 < 300) score += 2;
        else if (data.pao2fio2 < 400) score += 1;

        // Coagulation (Platelets)
        if (data.platelets < 20) score += 4;
        else if (data.platelets < 50) score += 3;
        else if (data.platelets < 100) score += 2;
        else if (data.platelets < 150) score += 1;

        // Liver (Bilirubin)
        if (data.bilirubin >= 12) score += 4;
        else if (data.bilirubin >= 6) score += 3;
        else if (data.bilirubin >= 2) score += 2;
        else if (data.bilirubin >= 1.2) score += 1;

        // Cardiovascular (MAP/Vasopressors)
        if (data.map < 70) score += 1;
        if (data.vasopressors) score += 2;

        // CNS (GCS)
        if (data.gcs < 6) score += 4;
        else if (data.gcs < 10) score += 3;
        else if (data.gcs < 13) score += 2;
        else if (data.gcs < 15) score += 1;

        // Renal (Creatinine)
        if (data.creatinine >= 5) score += 4;
        else if (data.creatinine >= 3.5) score += 3;
        else if (data.creatinine >= 2) score += 2;
        else if (data.creatinine >= 1.2) score += 1;

        let mortality = "";
        if (score <= 6) mortality = "< 10%";
        else if (score <= 9) mortality = "15-20%";
        else if (score <= 12) mortality = "40-50%";
        else mortality = "> 80%";

        return { score, mortality, recommendation: "Monitor organ function closely. Score ≥2 indicates sepsis." };
      },
      fields: [
        { name: "pao2fio2", label: "PaO2/FiO2 ratio", type: "number", unit: "mmHg" },
        { name: "platelets", label: "Platelets", type: "number", unit: "×10³/μL" },
        { name: "bilirubin", label: "Bilirubin", type: "number", unit: "mg/dL" },
        { name: "map", label: "Mean Arterial Pressure", type: "number", unit: "mmHg" },
        { name: "vasopressors", label: "On Vasopressors", type: "checkbox" },
        { name: "gcs", label: "Glasgow Coma Scale", type: "number", unit: "(3-15)" },
        { name: "creatinine", label: "Creatinine", type: "number", unit: "mg/dL" }
      ]
    },
    {
      id: "meld",
      name: "MELD Score",
      category: "Hepatology",
      description: "Liver disease severity for transplant prioritization",
      color: "amber",
      calculate: (data) => {
        const score = Math.round(
          3.78 * Math.log(data.bilirubin) +
          11.2 * Math.log(data.inr) +
          9.57 * Math.log(data.creatinine) +
          6.43
        );

        const finalScore = Math.max(6, Math.min(40, score));

        let mortality = "";
        if (finalScore < 10) mortality = "< 2% (3-month)";
        else if (finalScore < 20) mortality = "6% (3-month)";
        else if (finalScore < 30) mortality = "20% (3-month)";
        else mortality = "> 50% (3-month)";

        return {
          score: finalScore,
          mortality,
          recommendation: "Used for liver transplant prioritization. Score ≥15 warrants transplant evaluation."
        };
      },
      fields: [
        { name: "bilirubin", label: "Total Bilirubin", type: "number", unit: "mg/dL" },
        { name: "inr", label: "INR", type: "number", unit: "" },
        { name: "creatinine", label: "Creatinine", type: "number", unit: "mg/dL" }
      ]
    },
    {
      id: "apache",
      name: "APACHE II",
      category: "Critical Care",
      description: "ICU mortality prediction",
      color: "purple",
      calculate: (data) => {
        let score = 0;

        // Age points
        if (data.age >= 75) score += 6;
        else if (data.age >= 65) score += 5;
        else if (data.age >= 55) score += 3;
        else if (data.age >= 45) score += 2;

        // Chronic health (simplified)
        if (data.chronicHealth) score += 5;

        // APS (simplified - would need full parameters)
        score += parseInt(data.aps || 0);

        let mortality = "";
        if (score < 10) mortality = "< 5%";
        else if (score < 15) mortality = "10%";
        else if (score < 20) mortality = "20%";
        else if (score < 25) mortality = "40%";
        else if (score < 30) mortality = "55%";
        else mortality = "> 75%";

        return { score, mortality, recommendation: "Simplified APACHE II. Full score requires complete vital signs and labs." };
      },
      fields: [
        { name: "age", label: "Age", type: "number", unit: "years" },
        { name: "chronicHealth", label: "Severe Chronic Health", type: "checkbox" },
        { name: "aps", label: "Acute Physiology Score (0-60)", type: "number", unit: "points" }
      ]
    },
    {
      id: "hasbled",
      name: "HAS-BLED",
      category: "Cardiology",
      description: "Bleeding risk on anticoagulation",
      color: "red",
      calculate: (data) => {
        let score = 0;
        if (data.hypertension) score++;
        if (data.abnormalRenal || data.abnormalLiver) score += (data.abnormalRenal ? 1 : 0) + (data.abnormalLiver ? 1 : 0);
        if (data.stroke) score++;
        if (data.bleeding) score++;
        if (data.labile) score++;
        if (data.elderly) score++;
        if (data.drugs) score++;
        if (data.alcohol) score++;

        let risk = "";
        if (score <= 2) risk = "Low (1% annual risk)";
        else if (score === 3) risk = "Moderate (3.7% annual risk)";
        else risk = "High (8-12% annual risk)";

        return { score, risk, recommendation: "High score doesn't preclude anticoagulation but warrants closer monitoring." };
      },
      fields: [
        { name: "hypertension", label: "Hypertension (SBP >160)", type: "checkbox" },
        { name: "abnormalRenal", label: "Abnormal Renal Function", type: "checkbox" },
        { name: "abnormalLiver", label: "Abnormal Liver Function", type: "checkbox" },
        { name: "stroke", label: "History of Stroke", type: "checkbox" },
        { name: "bleeding", label: "Prior Bleeding", type: "checkbox" },
        { name: "labile", label: "Labile INR", type: "checkbox" },
        { name: "elderly", label: "Age > 65", type: "checkbox" },
        { name: "drugs", label: "Antiplatelet/NSAID Use", type: "checkbox" },
        { name: "alcohol", label: "Alcohol Use (≥8 drinks/week)", type: "checkbox" }
      ]
    },
    {
      id: "grace",
      name: "GRACE Score",
      category: "Cardiology",
      description: "ACS mortality risk",
      color: "red",
      calculate: (data) => {
        let score = 0;

        // Age
        if (data.age >= 80) score += 100;
        else if (data.age >= 70) score += 91;
        else if (data.age >= 60) score += 75;
        else if (data.age >= 50) score += 58;
        else score += 28;

        // Heart rate
        if (data.hr >= 110) score += 46;
        else if (data.hr >= 90) score += 38;
        else if (data.hr >= 70) score += 23;
        else score += 7;

        // SBP
        if (data.sbp < 80) score += 63;
        else if (data.sbp < 100) score += 58;
        else if (data.sbp < 120) score += 47;
        else if (data.sbp < 140) score += 37;
        else if (data.sbp < 160) score += 26;
        else score += 11;

        // Creatinine
        if (data.creatinine >= 4) score += 39;
        else if (data.creatinine >= 2) score += 28;
        else score += 7;

        // Other factors (simplified)
        if (data.cardiacArrest) score += 43;
        if (data.stElevation) score += 30;
        if (data.elevatedMarkers) score += 15;

        let risk = "";
        let mortality = "";
        if (score <= 108) {
          risk = "Low";
          mortality = "< 1% in-hospital";
        } else if (score <= 140) {
          risk = "Intermediate";
          mortality = "1-3% in-hospital";
        } else {
          risk = "High";
          mortality = "> 3% in-hospital";
        }

        return { score, risk, mortality, recommendation: "Risk stratification for acute coronary syndrome." };
      },
      fields: [
        { name: "age", label: "Age", type: "number", unit: "years" },
        { name: "hr", label: "Heart Rate", type: "number", unit: "bpm" },
        { name: "sbp", label: "Systolic BP", type: "number", unit: "mmHg" },
        { name: "creatinine", label: "Creatinine", type: "number", unit: "mg/dL" },
        { name: "cardiacArrest", label: "Cardiac Arrest on Admission", type: "checkbox" },
        { name: "stElevation", label: "ST Elevation on ECG", type: "checkbox" },
        { name: "elevatedMarkers", label: "Elevated Cardiac Markers", type: "checkbox" }
      ]
    }
  ];

  const Calculator = ({ system }) => {
    const [formData, setFormData] = useState({});
    const [result, setResult] = useState(null);

    const handleCalculate = () => {
      const calculatedResult = system.calculate(formData);
      setResult(calculatedResult);
    };

    return (
      <div className="space-y-4">
        <Card className="border-none shadow-md bg-neutral-50">
          <CardContent className="p-4">
            <p className="text-sm text-neutral-700 leading-relaxed">
              {system.description}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Enter Values</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {system.fields.map((field) => (
              <div key={field.name}>
                {field.type === "checkbox" ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={field.name}
                      checked={formData[field.name] || false}
                      onChange={(e) =>
                        setFormData({ ...formData, [field.name]: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-neutral-300"
                    />
                    <Label htmlFor={field.name} className="text-sm cursor-pointer">
                      {field.label}
                    </Label>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor={field.name} className="text-sm">
                      {field.label}
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id={field.name}
                        type="number"
                        step="0.1"
                        value={formData[field.name] || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, [field.name]: parseFloat(e.target.value) || 0 })
                        }
                        className="flex-1"
                      />
                      {field.unit && (
                        <span className="flex items-center text-sm text-neutral-500 whitespace-nowrap">
                          {field.unit}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <Button onClick={handleCalculate} className="w-full" size="lg">
              Calculate Score
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-50 to-blue-50">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <p className="text-sm text-neutral-600 mb-2">Score</p>
                <p className="text-5xl font-bold text-indigo-600 mb-3">{result.score}</p>
                {result.risk && (
                  <Badge variant={result.risk === "High" ? "destructive" : "secondary"} className="text-sm">
                    {result.risk} Risk
                  </Badge>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-indigo-200">
                {result.mortality && (
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-xs font-semibold text-neutral-700 mb-1">Mortality Risk</p>
                    <p className="text-sm text-neutral-900">{result.mortality}</p>
                  </div>
                )}

                <div className="p-3 bg-white rounded-lg">
                  <p className="text-xs font-semibold text-neutral-700 mb-1">Clinical Recommendation</p>
                  <p className="text-sm text-neutral-900">{result.recommendation}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-none bg-amber-50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Clinical scoring systems are decision support tools. Use in conjunction with clinical judgment 
                and patient-specific factors.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (selectedScore) {
    const system = scoringSystems.find((s) => s.id === selectedScore);

    return (
      <div className="min-h-full bg-neutral-50 pb-6">
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 px-6 py-6 text-white">
          <button
            onClick={() => setSelectedScore(null)}
            className="mb-3 text-sm text-white/80 hover:text-white"
          >
            ← Back to Scoring Systems
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{system.name}</h1>
              <p className="text-teal-100 text-sm">{system.category}</p>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-4">
          <Calculator system={system} />
        </div>
      </div>
    );
  }

  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    red: "from-red-500 to-red-600",
    amber: "from-amber-500 to-amber-600",
    purple: "from-purple-500 to-purple-600",
    green: "from-green-500 to-green-600"
  };

  return (
    <div className="min-h-full bg-neutral-50 pb-6">
      <div className="bg-gradient-to-br from-teal-500 to-teal-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Clinical Scoring Systems</h1>
            <p className="text-teal-100 text-sm">Risk stratification tools</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-3">
        {scoringSystems.map((system) => (
          <Card
            key={system.id}
            className="border-none hover:shadow-lg transition-all cursor-pointer"
            onClick={() => setSelectedScore(system.id)}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[system.color]} flex items-center justify-center shadow-md flex-shrink-0`}
                >
                  <Target className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-neutral-900">{system.name}</h3>
                    <Badge variant="secondary" className="text-xs">{system.category}</Badge>
                  </div>
                  <p className="text-sm text-neutral-600">{system.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}