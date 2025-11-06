import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCheck, ChevronRight, ChevronDown } from "lucide-react";

export default function Algorithms() {
  const [expandedAlgorithm, setExpandedAlgorithm] = useState(null);

  const algorithms = [
    {
      id: 1,
      title: "Chest Pain Algorithm",
      category: "Cardiovascular",
      steps: [
        { step: 1, question: "Is the patient unstable? (hypotensive, altered mental status, severe distress)", yes: "Call code/activate cath lab → STEMI protocol", no: "Continue assessment" },
        { step: 2, question: "ECG shows ST elevation or new LBBB?", yes: "STEMI → Immediate reperfusion (PCI vs tPA)", no: "Continue" },
        { step: 3, question: "High-risk features? (elevated troponin, dynamic ECG changes, GRACE score >140)", yes: "NSTEMI/Unstable Angina → Cardiology consult, early invasive strategy", no: "Consider other causes" },
        { step: 4, question: "Atypical features or alternative diagnosis more likely?", yes: "Consider: PE, aortic dissection, esophageal, MSK, anxiety", no: "Low risk chest pain → Outpatient workup" }
      ]
    },
    {
      id: 2,
      title: "Acute Abdominal Pain",
      category: "Gastrointestinal",
      steps: [
        { step: 1, question: "Hemodynamically unstable or peritonitis?", yes: "Resuscitation → Emergent surgery consult", no: "Continue assessment" },
        { step: 2, question: "Location: RLQ pain?", yes: "Consider appendicitis → CT abdomen/pelvis, surgery consult", no: "Continue" },
        { step: 3, question: "Location: RUQ pain?", yes: "Consider cholecystitis, hepatitis → RUQ US, LFTs", no: "Continue" },
        { step: 4, question: "Location: Epigastric pain?", yes: "Consider pancreatitis, PUD, MI → Lipase, ECG, lactate", no: "Continue" },
        { step: 5, question: "Pelvic pain in female of childbearing age?", yes: "Pregnancy test, pelvic US → r/o ectopic, ovarian torsion", no: "Consider: bowel obstruction, mesenteric ischemia, AAA" }
      ]
    },
    {
      id: 3,
      title: "Shortness of Breath (Dyspnea)",
      category: "Respiratory",
      steps: [
        { step: 1, question: "Severe distress or hypoxemia (SpO2 <90%)?", yes: "Oxygen, secure airway if needed, stat CXR", no: "Continue" },
        { step: 2, question: "Wheezing present?", yes: "Asthma/COPD exacerbation → Bronchodilators, steroids", no: "Continue" },
        { step: 3, question: "Crackles on exam + elevated JVP?", yes: "CHF exacerbation → Diuretics, echo, BNP", no: "Continue" },
        { step: 4, question: "Risk factors for PE (surgery, immobility, malignancy)?", yes: "PE workup → D-dimer, CTPA if indicated, Wells score", no: "Continue" },
        { step: 5, question: "Fever + productive cough?", yes: "Pneumonia → CXR, antibiotics", no: "Consider: anemia, metabolic acidosis, anxiety" }
      ]
    },
    {
      id: 4,
      title: "Altered Mental Status",
      category: "Neurological",
      steps: [
        { step: 1, question: "Airway/breathing/circulation compromised?", yes: "ABCs, glucose check, naloxone if indicated", no: "Continue" },
        { step: 2, question: "Glucose normal? Vital signs stable?", yes: "Continue", no: "Treat hypoglycemia/hypertension/fever immediately" },
        { step: 3, question: "Focal neurological deficits?", yes: "Stroke protocol → Stat CT head, neurology consult", no: "Continue" },
        { step: 4, question: "Meningeal signs (stiff neck, photophobia)?", yes: "Meningitis workup → Antibiotics ASAP, then LP", no: "Continue" },
        { step: 5, question: "History of alcohol use or malnutrition?", yes: "Wernicke's → Thiamine 500mg IV before glucose", no: "Consider: sepsis, hepatic encephalopathy, toxins, seizure" }
      ]
    },
    {
      id: 5,
      title: "Syncope Evaluation",
      category: "Cardiovascular",
      steps: [
        { step: 1, question: "High-risk features? (exertional, FHx sudden death, abnormal ECG)", yes: "Admit, cardiology consult, telemetry", no: "Continue" },
        { step: 2, question: "Suggestive of cardiac cause? (chest pain, palpitations, loud murmur)", yes: "ECG, troponin, echo → Cardiology evaluation", no: "Continue" },
        { step: 3, question: "Orthostatic vitals positive?", yes: "Volume depletion or autonomic dysfunction", no: "Continue" },
        { step: 4, question: "Situational trigger? (cough, urination, emotion)", yes: "Likely vasovagal → Reassurance, hydration", no: "Consider: neurological, metabolic causes" }
      ]
    }
  ];

  const categoryColors = {
    "Cardiovascular": "bg-red-100 text-red-800",
    "Gastrointestinal": "bg-amber-100 text-amber-800",
    "Respiratory": "bg-blue-100 text-blue-800",
    "Neurological": "bg-purple-100 text-purple-800"
  };

  return (
    <div className="min-h-full bg-neutral-50 dark:bg-neutral-50 pb-6">
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <FileCheck className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Diagnostic Algorithms</h1>
            <p className="text-emerald-100 text-sm">Clinical decision pathways</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-3">
        {algorithms.map((algorithm) => (
          <Card
            key={algorithm.id}
            className="border-none shadow-lg cursor-pointer"
            onClick={() => setExpandedAlgorithm(expandedAlgorithm === algorithm.id ? null : algorithm.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-neutral-900 mb-2">
                    {algorithm.title}
                  </h3>
                  <Badge className={categoryColors[algorithm.category]}>
                    {algorithm.category}
                  </Badge>
                </div>
                {expandedAlgorithm === algorithm.id ? (
                  <ChevronDown className="w-5 h-5 text-neutral-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-neutral-400" />
                )}
              </div>

              {expandedAlgorithm === algorithm.id && (
                <div className="mt-4 pt-4 border-t border-neutral-200 space-y-4">
                  {algorithm.steps.map((step) => (
                    <div key={step.step} className="relative pl-6">
                      <div className="absolute left-0 top-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm">
                        {step.step}
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium text-sm text-neutral-900">
                          {step.question}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200">
                            <p className="text-xs font-semibold text-green-800 mb-1">✓ YES</p>
                            <p className="text-xs text-green-700">{step.yes}</p>
                          </div>
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200">
                            <p className="text-xs font-semibold text-blue-800 mb-1">✗ NO</p>
                            <p className="text-xs text-blue-700">{step.no}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}