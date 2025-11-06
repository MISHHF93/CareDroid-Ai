import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WellsCalculator() {
  const [type, setType] = useState("dvt");
  const [dvtFactors, setDvtFactors] = useState({});
  const [peFactors, setPeFactors] = useState({});
  const [result, setResult] = useState(null);

  const dvtCriteria = [
    { id: "active_cancer", label: "Active cancer (treatment within 6 months or palliative)", points: 1 },
    { id: "paralysis", label: "Paralysis, paresis, or recent plaster immobilization", points: 1 },
    { id: "bedridden", label: "Recently bedridden >3 days or major surgery within 12 weeks", points: 1 },
    { id: "tenderness", label: "Localized tenderness along deep venous system", points: 1 },
    { id: "swelling", label: "Entire leg swollen", points: 1 },
    { id: "calf", label: "Calf swelling >3cm compared to other leg", points: 1 },
    { id: "pitting", label: "Pitting edema (greater in symptomatic leg)", points: 1 },
    { id: "veins", label: "Collateral superficial veins (non-varicose)", points: 1 },
    { id: "alternative", label: "Alternative diagnosis at least as likely as DVT", points: -2 }
  ];

  const peCriteria = [
    { id: "pe_clinical", label: "Clinical signs and symptoms of DVT", points: 3 },
    { id: "pe_alternative", label: "Alternative diagnosis less likely than PE", points: 3 },
    { id: "pe_hr", label: "Heart rate >100", points: 1.5 },
    { id: "pe_immobile", label: "Immobilization or surgery in previous 4 weeks", points: 1.5 },
    { id: "pe_history", label: "Previous DVT/PE", points: 1.5 },
    { id: "pe_hemoptysis", label: "Hemoptysis", points: 1 },
    { id: "pe_cancer", label: "Malignancy", points: 1 }
  ];

  const calculate = () => {
    const factors = type === "dvt" ? dvtFactors : peFactors;
    const criteria = type === "dvt" ? dvtCriteria : peCriteria;
    
    const score = criteria.reduce((sum, criterion) => {
      return sum + (factors[criterion.id] ? criterion.points : 0);
    }, 0);

    let risk = "";
    let color = "";
    let probability = "";
    let recommendation = "";

    if (type === "dvt") {
      if (score <= 0) {
        risk = "Low Probability";
        color = "bg-green-100 text-green-800";
        probability = "5% DVT probability";
        recommendation = "D-dimer testing recommended";
      } else if (score <= 2) {
        risk = "Moderate Probability";
        color = "bg-amber-100 text-amber-800";
        probability = "17% DVT probability";
        recommendation = "D-dimer or ultrasound recommended";
      } else {
        risk = "High Probability";
        color = "bg-red-100 text-red-800";
        probability = "17-53% DVT probability";
        recommendation = "Ultrasound imaging strongly recommended";
      }
    } else {
      if (score < 2) {
        risk = "Low Probability";
        color = "bg-green-100 text-green-800";
        probability = "1.3% PE probability";
        recommendation = "D-dimer testing recommended";
      } else if (score <= 6) {
        risk = "Moderate Probability";
        color = "bg-amber-100 text-amber-800";
        probability = "16.2% PE probability";
        recommendation = "Consider CT angiography";
      } else {
        risk = "High Probability";
        color = "bg-red-100 text-red-800";
        probability = "37.5% PE probability";
        recommendation = "CT angiography strongly recommended";
      }
    }

    setResult({ score: score.toFixed(1), risk, color, probability, recommendation });
  };

  return (
    <Card className="shadow-lg border-none">
      <CardHeader>
        <CardTitle>Select Criteria Type</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={type} onValueChange={(v) => { setType(v); setResult(null); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dvt">DVT</TabsTrigger>
            <TabsTrigger value="pe">PE</TabsTrigger>
          </TabsList>

          <TabsContent value="dvt" className="space-y-4 mt-4">
            {dvtCriteria.map((criterion) => (
              <div key={criterion.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-100">
                <Checkbox
                  id={criterion.id}
                  checked={dvtFactors[criterion.id] || false}
                  onCheckedChange={(checked) => 
                    setDvtFactors(prev => ({ ...prev, [criterion.id]: checked }))
                  }
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label htmlFor={criterion.id} className="text-sm font-medium cursor-pointer">
                    {criterion.label}
                  </Label>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {criterion.points > 0 ? '+' : ''}{criterion.points} point{Math.abs(criterion.points) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="pe" className="space-y-4 mt-4">
            {peCriteria.map((criterion) => (
              <div key={criterion.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-100">
                <Checkbox
                  id={criterion.id}
                  checked={peFactors[criterion.id] || false}
                  onCheckedChange={(checked) => 
                    setPeFactors(prev => ({ ...prev, [criterion.id]: checked }))
                  }
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label htmlFor={criterion.id} className="text-sm font-medium cursor-pointer">
                    {criterion.label}
                  </Label>
                  <p className="text-xs text-neutral-500 mt-0.5">+{criterion.points} points</p>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <Button onClick={calculate} className="w-full" size="lg">
          Calculate Wells Score
        </Button>

        {result && (
          <Card className="bg-neutral-50 dark:bg-neutral-100 border-none mt-4">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-neutral-600 mb-2">Wells Score ({type.toUpperCase()})</p>
                <p className="text-4xl font-bold text-neutral-900 mb-3">{result.score}</p>
                <Badge className={result.color + " mb-2"}>{result.risk}</Badge>
                <p className="text-sm text-neutral-700 mb-3">{result.probability}</p>
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