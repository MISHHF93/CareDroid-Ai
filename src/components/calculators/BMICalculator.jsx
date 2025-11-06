import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BMICalculator() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [result, setResult] = useState(null);

  const calculate = () => {
    const h = parseFloat(height) / 100; // convert cm to m
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      const bmi = (w / (h * h)).toFixed(1);
      let category = "";
      let color = "";

      if (bmi < 18.5) {
        category = "Underweight";
        color = "bg-blue-100 text-blue-800";
      } else if (bmi < 25) {
        category = "Normal weight";
        color = "bg-green-100 text-green-800";
      } else if (bmi < 30) {
        category = "Overweight";
        color = "bg-amber-100 text-amber-800";
      } else {
        category = "Obese";
        color = "bg-red-100 text-red-800";
      }

      setResult({ bmi, category, color });
    }
  };

  return (
    <Card className="shadow-lg border-none">
      <CardHeader>
        <CardTitle>Enter Patient Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="height">Height (cm)</Label>
          <Input
            id="height"
            type="number"
            placeholder="170"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            placeholder="70"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="mt-1"
          />
        </div>

        <Button onClick={calculate} className="w-full" size="lg">
          Calculate BMI
        </Button>

        {result && (
          <Card className="bg-neutral-50 dark:bg-neutral-100 border-none mt-4">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-neutral-600 mb-2">Body Mass Index</p>
                <p className="text-4xl font-bold text-neutral-900 mb-3">{result.bmi}</p>
                <Badge className={result.color}>{result.category}</Badge>

                <div className="mt-4 pt-4 border-t border-neutral-200 text-left">
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    <strong>Reference Ranges:</strong><br />
                    Underweight: &lt;18.5<br />
                    Normal: 18.5-24.9<br />
                    Overweight: 25-29.9<br />
                    Obese: ≥30
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