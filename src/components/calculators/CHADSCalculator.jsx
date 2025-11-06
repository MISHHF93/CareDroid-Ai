import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export default function CHADSCalculator() {
  const [factors, setFactors] = useState({
    chf: false,
    hypertension: false,
    age75: false,
    diabetes: false,
    stroke: false,
    vascular: false,
    age65: false,
    female: false
  });
  const [result, setResult] = useState(null);

  const criteria = [
    { id: "chf", label: "Congestive heart failure", points: 1 },
    { id: "hypertension", label: "Hypertension", points: 1 },
    { id: "age75", label: "Age ≥75 years", points: 2 },
    { id: "diabetes", label: "Diabetes mellitus", points: 1 },
    { id: "stroke", label: "Prior stroke/TIA/thromboembolism", points: 2 },
    { id: "vascular", label: "Vascular disease (MI, PAD, aortic plaque)", points: 1 },
    { id: "age65", label: "Age 65-74 years", points: 1 },
    { id: "female", label: "Female sex", points: 1 }
  ];

  const calculate = () => {
    const score = criteria.reduce((sum, criterion) => {
      return sum + (factors[criterion.id] ? criterion.points : 0);
    }, 0);

    let risk = "";
    let color = "";
    let recommendation = "";

    if (score === 0) {
      risk = "Low Risk (0%)";
      color = "bg-green-100 text-green-800";
      recommendation = "No antithrombotic therapy or aspirin recommended";
    } else if (score === 1) {
      risk = "Low-Moderate Risk (1.3%)";
      color = "bg-green-100 text-green-800";
      recommendation = "Consider oral anticoagulation or aspirin";
    } else if (score === 2) {
      risk = "Moderate Risk (2.2%)";
      color = "bg-amber-100 text-amber-800";
      recommendation = "Oral anticoagulation recommended";
    } else {
      risk = `High Risk (${score >= 9 ? '>15' : '3.2-15'}%)`;
      color = "bg-red-100 text-red-800";
      recommendation = "Oral anticoagulation strongly recommended";
    }

    setResult({ score, risk, color, recommendation });
  };

  return (
    <Card className="shadow-lg border-none">
      <CardHeader>
        <CardTitle>Risk Factors</CardTitle>
        <p className="text-sm text-neutral-600 mt-1">
          Select all that apply to calculate stroke risk in AF
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {criteria.map((criterion) => (
          <div key={criterion.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-100">
            <Checkbox
              id={criterion.id}
              checked={factors[criterion.id]}
              onCheckedChange={(checked) => 
                setFactors(prev => ({ ...prev, [criterion.id]: checked }))
              }
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label htmlFor={criterion.id} className="text-sm font-medium cursor-pointer">
                {criterion.label}
              </Label>
              <p className="text-xs text-neutral-500 mt-0.5">+{criterion.points} point{criterion.points > 1 ? 's' : ''}</p>
            </div>
          </div>
        ))}

        <Button onClick={calculate} className="w-full" size="lg">
          Calculate Score
        </Button>

        {result && (
          <Card className="bg-neutral-50 dark:bg-neutral-100 border-none mt-4">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-neutral-600 mb-2">CHA₂DS₂-VASc Score</p>
                <p className="text-4xl font-bold text-neutral-900 mb-3">{result.score}</p>
                <Badge className={result.color + " mb-3"}>{result.risk}</Badge>
                <div className="mt-4 pt-4 border-t border-neutral-200 text-left">
                  <p className="text-sm font-semibold text-neutral-900 mb-2">Recommendation:</p>
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    {result.recommendation}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}