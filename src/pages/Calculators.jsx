import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Heart, Activity, Droplets, Scale } from "lucide-react";
import BMICalculator from "../components/calculators/BMICalculator.jsx";
import GFRCalculator from "../components/calculators/GFRCalculator.jsx";
import CHADSCalculator from "../components/calculators/CHADSCalculator.jsx";
import WellsCalculator from "../components/calculators/WellsCalculator.jsx";

export default function Calculators() {
  const [selectedCalc, setSelectedCalc] = useState(null);

  const calculators = [
    {
      id: "bmi",
      name: "BMI Calculator",
      description: "Body Mass Index calculation",
      icon: Scale,
      color: "blue",
      component: BMICalculator
    },
    {
      id: "gfr",
      name: "GFR (eGFR)",
      description: "Estimated Glomerular Filtration Rate",
      icon: Droplets,
      color: "cyan",
      component: GFRCalculator
    },
    {
      id: "chads",
      name: "CHA₂DS₂-VASc",
      description: "Stroke risk in atrial fibrillation",
      icon: Heart,
      color: "red",
      component: CHADSCalculator
    },
    {
      id: "wells",
      name: "Wells' Criteria",
      description: "DVT & PE probability",
      icon: Activity,
      color: "purple",
      component: WellsCalculator
    }
  ];

  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    cyan: "from-cyan-500 to-cyan-600",
    red: "from-red-500 to-red-600",
    purple: "from-purple-500 to-purple-600",
    green: "from-green-500 to-green-600"
  };

  if (selectedCalc) {
    const calc = calculators.find(c => c.id === selectedCalc);
    const CalculatorComponent = calc.component;

    return (
      <div className="min-h-full bg-neutral-50 dark:bg-neutral-50 pb-6">
        <div className={`bg-gradient-to-br ${colorClasses[calc.color]} px-6 py-6 text-white`}>
          <button
            onClick={() => setSelectedCalc(null)}
            className="mb-3 text-sm text-white/80 hover:text-white"
          >
            ← Back to Calculators
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <calc.icon className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{calc.name}</h1>
              <p className="text-white/90 text-sm">{calc.description}</p>
            </div>
          </div>
        </div>

        <div className="px-4 -mt-4">
          <CalculatorComponent />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-neutral-50 dark:bg-neutral-50 pb-6">
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Calculator className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Medical Calculators</h1>
            <p className="text-purple-100 text-sm">Clinical decision tools</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {calculators.map((calc) => (
            <Card
              key={calc.id}
              className="border-none hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={() => setSelectedCalc(calc.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[calc.color]} flex items-center justify-center shadow-md flex-shrink-0`}>
                    <calc.icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-900 mb-1">
                      {calc.name}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {calc.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}