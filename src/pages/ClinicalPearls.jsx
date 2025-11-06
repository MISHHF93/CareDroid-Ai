import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Lightbulb, Search, X, Star } from "lucide-react";

export default function ClinicalPearls() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const pearls = [
    {
      category: "Cardiology",
      title: "Beck's Triad",
      mnemonic: "JVD, Muffled heart sounds, Hypotension",
      pearl: "Classic presentation of cardiac tamponade. Remember: 'The heart is drowning in its own sac.'",
      clinicalTip: "May be absent in hypovolemic patients. Look for pulsus paradoxus (>10mmHg drop with inspiration)."
    },
    {
      category: "Emergency",
      title: "SAMPLE History",
      mnemonic: "Signs/Symptoms, Allergies, Medications, Past medical history, Last meal, Events leading up",
      pearl: "Quick systematic approach for emergency patient assessment.",
      clinicalTip: "Last meal timing crucial for intubation risk assessment."
    },
    {
      category: "Pulmonology",
      title: "Light's Criteria for Pleural Effusion",
      mnemonic: "Exudate if ANY: Pleural protein/serum >0.5, Pleural LDH/serum >0.6, Pleural LDH >2/3 upper limit",
      pearl: "Distinguishes exudative from transudative effusions.",
      clinicalTip: "If borderline, consider serum-effusion albumin gradient (SEAG). <1.2 g/dL = exudate."
    },
    {
      category: "Neurology",
      title: "Cincinnati Stroke Scale",
      mnemonic: "Facial droop, Arm drift, Speech abnormalities",
      pearl: "Quick prehospital stroke screening. Presence of ANY = 72% stroke probability.",
      clinicalTip: "Remember: 'FAST' - Face, Arms, Speech, Time (to call 911)."
    },
    {
      category: "Gastroenterology",
      title: "Ranson's Criteria",
      mnemonic: "At admission: GA LAW (Glucose >200, Age >55, LDH >350, AST >250, WBC >16)",
      pearl: "Predicts severity of acute pancreatitis.",
      clinicalTip: "≥3 criteria = severe pancreatitis, consider ICU admission."
    },
    {
      category: "Nephrology",
      title: "MUDPILES",
      mnemonic: "Methanol, Uremia, DKA, Propylene glycol/Paraldehyde, Iron/Isoniazid, Lactic acidosis, Ethylene glycol, Salicylates",
      pearl: "Causes of anion gap metabolic acidosis.",
      clinicalTip: "Calculate anion gap: Na - (Cl + HCO3). Normal = 8-12."
    },
    {
      category: "Rheumatology",
      title: "SLICC Criteria Mnemonic",
      mnemonic: "SOAP BRAIN MD (Serositis, Oral ulcers, Arthritis, Photosensitivity, Blood disorders, Renal, ANA, Immunologic, Neurologic, Malar rash, Discoid rash)",
      pearl: "SLE diagnostic criteria. Need 4 of 11 for diagnosis.",
      clinicalTip: "ANA is sensitive (95%) but not specific. Anti-dsDNA and Anti-Smith are more specific."
    },
    {
      category: "Infectious Disease",
      title: "CURB-65",
      mnemonic: "Confusion, Urea >7mmol/L, RR ≥30, BP <90/60, age ≥65",
      pearl: "Pneumonia severity assessment. Score 0-1: outpatient, 2: consider admission, ≥3: ICU.",
      clinicalTip: "Add 'O' for oxygen saturation <90% to make CRB-65 when BUN unavailable."
    },
    {
      category: "Endocrine",
      title: "DKA vs HHS",
      mnemonic: "DKA = Dry, Ketotic, Acidotic (pH <7.3, glucose 250-600). HHS = Higher sugar (>600), Hyperosmolar, Severely dehydrated",
      pearl: "DKA: young T1DM, infection trigger. HHS: elderly T2DM, more profound dehydration.",
      clinicalTip: "HHS mortality higher (10-20% vs 1-5%). Both need aggressive fluid resuscitation first."
    },
    {
      category: "Toxicology",
      title: "Toxidromes",
      mnemonic: "Hot as a hare, Blind as a bat, Dry as a bone, Red as a beet, Mad as a hatter",
      pearl: "Classic anticholinergic toxidrome (e.g., atropine, antihistamines).",
      clinicalTip: "Antidote: Physostigmine (only if pure anticholinergic, no TCAs). Supportive care usually sufficient."
    },
    {
      category: "Cardiology",
      title: "Sgarbossa Criteria",
      mnemonic: "ST elevation ≥1mm concordant with QRS, ST depression ≥1mm in V1-V3, ST elevation ≥5mm discordant with QRS",
      pearl: "STEMI diagnosis in presence of LBBB or ventricular pacing.",
      clinicalTip: "≥3 points = 90% specificity for MI. If positive, activate cath lab."
    },
    {
      category: "Pulmonology",
      title: "A-a Gradient",
      mnemonic: "PAO2 = (FiO2 × 713) - (PaCO2 ÷ 0.8). Normal A-a = Age ÷ 4 + 4",
      pearl: "Differentiates V/Q mismatch from hypoventilation.",
      clinicalTip: "Normal A-a with hypoxia = pure hypoventilation (CNS, NM). Elevated A-a = parenchymal disease, PE, shunt."
    },
    {
      category: "Emergency",
      title: "Rule of 9s",
      mnemonic: "Head 9%, each arm 9%, each leg 18%, anterior trunk 18%, posterior trunk 18%, perineum 1%",
      pearl: "Quick burn surface area estimation in adults.",
      clinicalTip: "Child: head 18%, legs 14% each. Palmar method: patient's palm = 1% BSA."
    },
    {
      category: "Hematology",
      title: "Causes of Thrombocytopenia",
      mnemonic: "DRIP (Decreased production, Redistribution, Immune destruction, Platelet consumption)",
      pearl: "Systematic approach to low platelets.",
      clinicalTip: "Always check peripheral smear. Schistocytes = TTP/HUS/DIC. Large platelets = ITP."
    },
    {
      category: "Neurology",
      title: "6 P's of Acute Limb Ischemia",
      mnemonic: "Pain, Pallor, Pulselessness, Paresthesias, Poikilothermia (cold), Paralysis",
      pearl: "Progression indicates severity. Paralysis = irreversible damage imminent.",
      clinicalTip: "< 6 hours = salvageable. Call vascular surgery immediately."
    },
    {
      category: "Gastroenterology",
      title: "Acute vs Chronic Liver Disease",
      mnemonic: "Acute: tender liver, encephalopathy without asterixis. Chronic: spider angiomata, ascites, palmar erythema",
      pearl: "Physical exam clues to chronicity.",
      clinicalTip: "Albumin and INR reflect synthetic function. Transaminases indicate hepatocyte injury."
    },
    {
      category: "Obstetrics",
      title: "HELLP Syndrome",
      mnemonic: "Hemolysis, Elevated Liver enzymes, Low Platelets",
      pearl: "Severe preeclampsia variant. Maternal mortality 1%, fetal 10-60%.",
      clinicalTip: "Delivery is definitive treatment. Give magnesium for seizure prophylaxis."
    },
    {
      category: "Pharmacology",
      title: "Reversal Agents",
      mnemonic: "Opioids→Naloxone, Benzos→Flumazenil, Warfarin→Vitamin K/FFP, Heparin→Protamine",
      pearl: "Quick reference for common overdoses.",
      clinicalTip: "Naloxone duration shorter than most opioids - may need repeated doses or infusion."
    },
    {
      category: "Orthopedics",
      title: "Ottawa Ankle Rules",
      mnemonic: "X-ray if: pain + inability to bear weight OR tenderness at posterior malleoli OR 5th metatarsal base",
      pearl: "98.5% sensitive for fractures. Reduces unnecessary imaging.",
      clinicalTip: "Not valid in pregnancy, intoxication, or polytrauma."
    },
    {
      category: "Dermatology",
      title: "ABCDE of Melanoma",
      mnemonic: "Asymmetry, Border irregularity, Color variation, Diameter >6mm, Evolution/changing",
      pearl: "Red flags for malignant melanoma screening.",
      clinicalTip: "Ugly duckling sign: lesion that looks different from others. Biopsy anything suspicious."
    }
  ];

  const filteredPearls = pearls.filter((pearl) => {
    const matchesSearch =
      searchTerm === "" ||
      pearl.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pearl.pearl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pearl.mnemonic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || pearl.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(pearls.map((p) => p.category))].sort();

  return (
    <div className="min-h-full bg-neutral-50 pb-6">
      <div className="bg-gradient-to-br from-lime-500 to-lime-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Lightbulb className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Clinical Pearls</h1>
            <p className="text-lime-100 text-sm">Mnemonics & quick tips</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <Card className="shadow-lg border-none">
          <CardContent className="p-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <Input
                type="text"
                placeholder="Search pearls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 h-12 text-base"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-neutral-400" />
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <Badge
                variant={filterCategory === "all" ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setFilterCategory("all")}
              >
                All
              </Badge>
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  variant={filterCategory === cat ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setFilterCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 mt-4">
        <p className="text-sm text-neutral-600 mb-3">{filteredPearls.length} clinical pearls</p>

        <div className="space-y-3">
          {filteredPearls.map((pearl, idx) => (
            <Card key={idx} className="border-none hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-base mb-2">{pearl.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {pearl.category}
                    </Badge>
                  </div>
                  <Star className="w-5 h-5 text-lime-500 flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs font-semibold text-amber-900 mb-1">💡 Mnemonic</p>
                  <p className="text-sm text-amber-800 font-medium">{pearl.mnemonic}</p>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs font-semibold text-blue-900 mb-1">📚 Pearl</p>
                  <p className="text-sm text-blue-800">{pearl.pearl}</p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs font-semibold text-green-900 mb-1">⚡ Clinical Tip</p>
                  <p className="text-sm text-green-800">{pearl.clinicalTip}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}