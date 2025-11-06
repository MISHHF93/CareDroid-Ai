import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCheck, Download, ChevronDown, ChevronRight } from "lucide-react";

export default function QuickReference() {
  const [expandedCard, setExpandedCard] = useState(null);

  const references = [
    {
      id: 1,
      title: "Acute Coronary Syndrome (ACS)",
      category: "Cardiology",
      summary: "STEMI vs NSTEMI management",
      content: {
        definition: "Spectrum of myocardial ischemia from unstable angina to STEMI",
        presentation: "Chest pain/pressure, dyspnea, diaphoresis, radiation to jaw/arm",
        workup: [
          "ECG within 10 minutes",
          "Troponin (0 and 3 hours)",
          "CBC, BMP, PT/INR",
          "Chest X-ray"
        ],
        management: {
          stemi: "Door-to-balloon <90 min, ASA 325mg, Heparin, P2Y12 inhibitor, PCI",
          nstemi: "Risk stratify (GRACE/TIMI), dual antiplatelet, consider early cath if high risk"
        },
        medications: [
          "ASA 325mg loading",
          "Clopidogrel 600mg or Ticagrelor 180mg",
          "Heparin or Enoxaparin",
          "Morphine PRN",
          "Nitroglycerin (if SBP >90)",
          "Beta-blocker (if not contraindicated)"
        ],
        redFlags: "Cardiogenic shock, ventricular arrhythmias, acute pulmonary edema"
      }
    },
    {
      id: 2,
      title: "Diabetic Ketoacidosis (DKA)",
      category: "Endocrine",
      summary: "Recognition and management protocol",
      content: {
        definition: "Hyperglycemia + anion gap acidosis + ketones",
        presentation: "Polyuria, polydipsia, nausea, vomiting, abdominal pain, Kussmaul respirations, fruity breath",
        workup: [
          "Glucose, BMP, ABG/VBG",
          "Beta-hydroxybutyrate or urine ketones",
          "Anion gap calculation",
          "Search for precipitant (infection, MI, medication noncompliance)"
        ],
        management: {
          fluids: "1L NS bolus, then 250-500 mL/hr. Switch to D5 1/2 NS when glucose <250",
          insulin: "0.1 units/kg bolus, then 0.1 units/kg/hr infusion. Decrease to 0.05 when glucose <250",
          electrolytes: "Replace K+ aggressively (goal 4-5). Add K+ to fluids when <5.2",
          bicarbonate: "Only if pH <6.9 (controversial)"
        },
        medications: [
          "IV Regular Insulin",
          "Normal Saline",
          "Potassium Chloride",
          "Treat underlying cause"
        ],
        redFlags: "Cerebral edema (children), hypokalemia, hypoglycemia"
      }
    },
    {
      id: 3,
      title: "Sepsis & Septic Shock",
      category: "Critical Care",
      summary: "1-hour bundle and management",
      content: {
        definition: "Life-threatening organ dysfunction caused by dysregulated host response to infection",
        presentation: "Fever/hypothermia, tachycardia, tachypnea, altered mental status, hypotension",
        workup: [
          "Blood cultures × 2 (before antibiotics)",
          "Lactate",
          "CBC, BMP, LFTs, coags",
          "Cultures from suspected source",
          "Imaging as indicated"
        ],
        management: {
          hourOne: "Measure lactate, obtain cultures, give broad-spectrum antibiotics, 30 mL/kg crystalloid if hypotensive/lactate ≥4",
          vasopressors: "If MAP <65 after fluids: Start norepinephrine. Target MAP ≥65",
          source: "Control source (drain abscess, remove device, debride tissue)"
        },
        medications: [
          "Broad-spectrum antibiotics within 1 HOUR",
          "Norepinephrine (first-line vasopressor)",
          "Vasopressin or epinephrine (second-line)",
          "Consider hydrocortisone if refractory shock"
        ],
        redFlags: "Lactate >4, SBP <90, altered mentation"
      }
    },
    {
      id: 4,
      title: "Acute Stroke",
      category: "Neurology",
      summary: "Code stroke protocol",
      content: {
        definition: "Acute focal neurological deficit from vascular cause",
        presentation: "FAST: Facial droop, Arm weakness, Speech difficulty, Time",
        workup: [
          "Non-contrast CT head STAT",
          "CBC, BMP, glucose, PT/INR",
          "ECG",
          "NIH Stroke Scale",
          "Establish time last known well"
        ],
        management: {
          tpa: "If <4.5 hours, no contraindications: Alteplase 0.9 mg/kg (10% bolus, 90% over 1 hour)",
          thrombectomy: "Large vessel occlusion + <24 hours: Mechanical thrombectomy",
          bp: "Target <185/110 before tPA. Permissive hypertension after (allow up to 220/120)"
        },
        medications: [
          "Alteplase 0.9 mg/kg (if eligible)",
          "ASA 325mg (if hemorrhage excluded, after tPA window)",
          "Avoid anticoagulation × 24 hours post-tPA"
        ],
        redFlags: "Hemorrhagic transformation, malignant edema, seizures"
      }
    },
    {
      id: 5,
      title: "Acute Asthma Exacerbation",
      category: "Pulmonology",
      summary: "Severity assessment and stepwise management",
      content: {
        definition: "Acute worsening of asthma symptoms with airflow obstruction",
        presentation: "Dyspnea, wheezing, chest tightness, decreased peak flow",
        workup: [
          "Peak expiratory flow rate",
          "O2 saturation",
          "ABG if severe (pH, PCO2)",
          "Chest X-ray if pneumonia/pneumothorax suspected"
        ],
        management: {
          mild: "Albuterol 2-6 puffs Q20min × 3, then Q1-4hr PRN",
          moderate: "Continuous albuterol nebs, Ipratropium, Oral/IV steroids",
          severe: "Above + IM epinephrine, Magnesium sulfate 2g IV, consider BiPAP/intubation"
        },
        medications: [
          "Albuterol nebulizer (2.5-5mg Q20min × 3)",
          "Ipratropium 0.5mg with albuterol",
          "Prednisone 40-60mg PO or Methylprednisolone 125mg IV",
          "Magnesium sulfate 2g IV (if severe)",
          "IM Epinephrine 0.3mg (if impending respiratory failure)"
        ],
        redFlags: "Silent chest, altered mental status, pulsus paradoxus >25mmHg, PCO2 >45"
      }
    }
  ];

  const handlePrint = (reference) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${reference.title} - Quick Reference</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #0066CC; }
            h2 { color: #333; margin-top: 20px; }
            ul { margin-left: 20px; }
            .section { margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <h1>${reference.title}</h1>
          <p><strong>Category:</strong> ${reference.category}</p>
          <div class="section">
            <h2>Definition</h2>
            <p>${reference.content.definition}</p>
          </div>
          <div class="section">
            <h2>Presentation</h2>
            <p>${reference.content.presentation}</p>
          </div>
          <div class="section">
            <h2>Workup</h2>
            <ul>${reference.content.workup.map(item => `<li>${item}</li>`).join('')}</ul>
          </div>
          <div class="section">
            <h2>Medications</h2>
            <ul>${reference.content.medications.map(item => `<li>${item}</li>`).join('')}</ul>
          </div>
          <div class="section">
            <h2>Red Flags</h2>
            <p>${reference.content.redFlags}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="min-h-full bg-neutral-50 pb-6">
      <div className="bg-gradient-to-br from-sky-500 to-sky-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <FileCheck className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Quick References</h1>
            <p className="text-sky-100 text-sm">One-page clinical summaries</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-3">
        {references.map((ref) => (
          <Card
            key={ref.id}
            className="border-none shadow-lg cursor-pointer"
            onClick={() => setExpandedCard(expandedCard === ref.id ? null : ref.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{ref.title}</CardTitle>
                  <Badge variant="secondary" className="text-xs">{ref.category}</Badge>
                  <p className="text-sm text-neutral-600 mt-2">{ref.summary}</p>
                </div>
                {expandedCard === ref.id ? (
                  <ChevronDown className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                )}
              </div>
            </CardHeader>

            {expandedCard === ref.id && (
              <CardContent className="space-y-4 pt-0">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Definition</p>
                  <p className="text-sm text-blue-800">{ref.content.definition}</p>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs font-semibold text-purple-900 mb-1">Presentation</p>
                  <p className="text-sm text-purple-800">{ref.content.presentation}</p>
                </div>

                <div className="p-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs font-semibold text-neutral-900 mb-2">Workup</p>
                  <ul className="space-y-1">
                    {ref.content.workup.map((item, idx) => (
                      <li key={idx} className="text-sm text-neutral-700 flex gap-2">
                        <span>•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs font-semibold text-green-900 mb-2">Medications</p>
                  <ul className="space-y-1">
                    {ref.content.medications.map((item, idx) => (
                      <li key={idx} className="text-sm text-green-800 flex gap-2">
                        <span>💊</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-xs font-semibold text-red-900 mb-1">🚩 Red Flags</p>
                  <p className="text-sm text-red-800">{ref.content.redFlags}</p>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrint(ref);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Print Reference Card
                </Button>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}