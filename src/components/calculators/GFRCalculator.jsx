import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function GFRCalculator() {
  const [age, setAge] = useState("");
  const [creatinine, setCreatinine] = useState("");
  const [sex, setSex] = useState("male");
  const [race, setRace] = useState("other");
  const [result, setResult] = useState(null);

  const calculate = () => {
    const ageNum = parseFloat(age);
    const creat = parseFloat(creatinine);
    
    if (ageNum > 0 && creat > 0) {
      // CKD-EPI equation
      const kappa = sex === "female" ? 0.7 : 0.9;
      const alpha = sex === "female" ? -0.329 : -0.411;
      const min = Math.min(creat / kappa, 1);
      const max = Math.max(creat / kappa, 1);
      
      let gfr = 141 * Math.pow(min, alpha) * Math.pow(max, -1.209) * Math.pow(0.993, ageNum);
      
      if (sex === "female") {
        gfr *= 1.018;
      }
      
      if (race === "black") {
        gfr *= 1.159;
      }

      gfr = Math.round(gfr);
      
      let stage = "";
      let color = "";
      let interpretation = "";

      if (gfr >= 90) {
        stage = "Stage 1 (Normal)";
        color = "bg-green-100 text-green-800";
        interpretation = "Normal or high kidney function";
      } else if (gfr >= 60) {
        stage = "Stage 2 (Mild)";
        color = "bg-green-100 text-green-800";
        interpretation = "Mildly decreased kidney function";
      } else if (gfr >= 45) {
        stage = "Stage 3a (Moderate)";
        color = "bg-amber-100 text-amber-800";
        interpretation = "Mild to moderate decrease";
      } else if (gfr >= 30) {
        stage = "Stage 3b (Moderate)";
        color = "bg-amber-100 text-amber-800";
        interpretation = "Moderate to severe decrease";
      } else if (gfr >= 15) {
        stage = "Stage 4 (Severe)";
        color = "bg-orange-100 text-orange-800";
        interpretation = "Severe decrease in kidney function";
      } else {
        stage = "Stage 5 (Kidney Failure)";
        color = "bg-red-100 text-red-800";
        interpretation = "Kidney failure (dialysis or transplant needed)";
      }

      setResult({ gfr, stage, color, interpretation });
    }
  };

  return (
    <Card className="shadow-lg border-none">
      <CardHeader>
        <CardTitle>CKD-EPI Equation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="age">Age (years)</Label>
          <Input
            id="age"
            type="number"
            placeholder="65"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="creatinine">Serum Creatinine (mg/dL)</Label>
          <Input
            id="creatinine"
            type="number"
            step="0.1"
            placeholder="1.2"
            value={creatinine}
            onChange={(e) => setCreatinine(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label>Sex</Label>
          <Select value={sex} onValueChange={setSex}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Race</Label>
          <Select value={race} onValueChange={setRace}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="black">Black/African American</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={calculate} className="w-full" size="lg">
          Calculate eGFR
        </Button>

        {result && (
          <Card className="bg-neutral-50 dark:bg-neutral-100 border-none mt-4">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-neutral-600 mb-2">Estimated GFR</p>
                <p className="text-4xl font-bold text-neutral-900 mb-1">
                  {result.gfr}
                </p>
                <p className="text-sm text-neutral-600 mb-3">mL/min/1.73m²</p>
                <Badge className={result.color}>{result.stage}</Badge>
                <p className="text-sm text-neutral-700 mt-3">{result.interpretation}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}