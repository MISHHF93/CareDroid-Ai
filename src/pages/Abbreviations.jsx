import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, X } from "lucide-react";

export default function Abbreviations() {
  const [searchTerm, setSearchTerm] = useState("");

  const abbreviations = [
    { abbr: "ACLS", full: "Advanced Cardiac Life Support", category: "Emergency" },
    { abbr: "ACS", full: "Acute Coronary Syndrome", category: "Cardiology" },
    { abbr: "AKI", full: "Acute Kidney Injury", category: "Nephrology" },
    { abbr: "ARDS", full: "Acute Respiratory Distress Syndrome", category: "Pulmonology" },
    { abbr: "BID", full: "Bis in die (twice daily)", category: "Pharmacy" },
    { abbr: "BMI", full: "Body Mass Index", category: "General" },
    { abbr: "BNP", full: "B-type Natriuretic Peptide", category: "Lab" },
    { abbr: "BP", full: "Blood Pressure", category: "Vital Signs" },
    { abbr: "BUN", full: "Blood Urea Nitrogen", category: "Lab" },
    { abbr: "CABG", full: "Coronary Artery Bypass Graft", category: "Surgery" },
    { abbr: "CBC", full: "Complete Blood Count", category: "Lab" },
    { abbr: "CHF", full: "Congestive Heart Failure", category: "Cardiology" },
    { abbr: "CKD", full: "Chronic Kidney Disease", category: "Nephrology" },
    { abbr: "CMP", full: "Comprehensive Metabolic Panel", category: "Lab" },
    { abbr: "CNS", full: "Central Nervous System", category: "Neurology" },
    { abbr: "COPD", full: "Chronic Obstructive Pulmonary Disease", category: "Pulmonology" },
    { abbr: "CPR", full: "Cardiopulmonary Resuscitation", category: "Emergency" },
    { abbr: "CRP", full: "C-Reactive Protein", category: "Lab" },
    { abbr: "CT", full: "Computed Tomography", category: "Radiology" },
    { abbr: "CVA", full: "Cerebrovascular Accident (Stroke)", category: "Neurology" },
    { abbr: "CXR", full: "Chest X-Ray", category: "Radiology" },
    { abbr: "D5W", full: "5% Dextrose in Water", category: "Fluids" },
    { abbr: "DKA", full: "Diabetic Ketoacidosis", category: "Endocrine" },
    { abbr: "DM", full: "Diabetes Mellitus", category: "Endocrine" },
    { abbr: "DNR", full: "Do Not Resuscitate", category: "Ethics" },
    { abbr: "DVT", full: "Deep Vein Thrombosis", category: "Hematology" },
    { abbr: "ECG/EKG", full: "Electrocardiogram", category: "Cardiology" },
    { abbr: "ED", full: "Emergency Department", category: "General" },
    { abbr: "EEG", full: "Electroencephalogram", category: "Neurology" },
    { abbr: "eGFR", full: "Estimated Glomerular Filtration Rate", category: "Lab" },
    { abbr: "EMR", full: "Electronic Medical Record", category: "Admin" },
    { abbr: "ENT", full: "Ear, Nose, and Throat", category: "Specialty" },
    { abbr: "ESR", full: "Erythrocyte Sedimentation Rate", category: "Lab" },
    { abbr: "ETOH", full: "Ethanol (Alcohol)", category: "Toxicology" },
    { abbr: "FHx", full: "Family History", category: "History" },
    { abbr: "GCS", full: "Glasgow Coma Scale", category: "Neurology" },
    { abbr: "GI", full: "Gastrointestinal", category: "Gastro" },
    { abbr: "Hb/Hgb", full: "Hemoglobin", category: "Lab" },
    { abbr: "HCT", full: "Hematocrit", category: "Lab" },
    { abbr: "HIPAA", full: "Health Insurance Portability and Accountability Act", category: "Legal" },
    { abbr: "HIV", full: "Human Immunodeficiency Virus", category: "ID" },
    { abbr: "HTN", full: "Hypertension", category: "Cardiology" },
    { abbr: "ICU", full: "Intensive Care Unit", category: "General" },
    { abbr: "IM", full: "Intramuscular", category: "Route" },
    { abbr: "INR", full: "International Normalized Ratio", category: "Lab" },
    { abbr: "IV", full: "Intravenous", category: "Route" },
    { abbr: "IVF", full: "Intravenous Fluids", category: "Treatment" },
    { abbr: "LFTs", full: "Liver Function Tests", category: "Lab" },
    { abbr: "LLQ", full: "Left Lower Quadrant", category: "Anatomy" },
    { abbr: "LP", full: "Lumbar Puncture", category: "Procedure" },
    { abbr: "LUQ", full: "Left Upper Quadrant", category: "Anatomy" },
    { abbr: "MI", full: "Myocardial Infarction", category: "Cardiology" },
    { abbr: "MRI", full: "Magnetic Resonance Imaging", category: "Radiology" },
    { abbr: "MRSA", full: "Methicillin-Resistant Staphylococcus Aureus", category: "ID" },
    { abbr: "NG", full: "Nasogastric", category: "Route" },
    { abbr: "NPO", full: "Nil per os (Nothing by mouth)", category: "Orders" },
    { abbr: "NSAID", full: "Non-Steroidal Anti-Inflammatory Drug", category: "Pharmacy" },
    { abbr: "NSTEMI", full: "Non-ST Elevation Myocardial Infarction", category: "Cardiology" },
    { abbr: "O2", full: "Oxygen", category: "Treatment" },
    { abbr: "OD", full: "Overdose", category: "Toxicology" },
    { abbr: "OR", full: "Operating Room", category: "Surgery" },
    { abbr: "PALS", full: "Pediatric Advanced Life Support", category: "Emergency" },
    { abbr: "PCI", full: "Percutaneous Coronary Intervention", category: "Cardiology" },
    { abbr: "PE", full: "Pulmonary Embolism", category: "Pulmonology" },
    { abbr: "PEEP", full: "Positive End-Expiratory Pressure", category: "Critical Care" },
    { abbr: "PHI", full: "Protected Health Information", category: "Legal" },
    { abbr: "PO", full: "Per os (By mouth)", category: "Route" },
    { abbr: "PRN", full: "Pro re nata (As needed)", category: "Pharmacy" },
    { abbr: "Pt", full: "Patient", category: "General" },
    { abbr: "PT/INR", full: "Prothrombin Time/International Normalized Ratio", category: "Lab" },
    { abbr: "PTT", full: "Partial Thromboplastin Time", category: "Lab" },
    { abbr: "QD", full: "Quaque die (Once daily)", category: "Pharmacy" },
    { abbr: "QID", full: "Quater in die (Four times daily)", category: "Pharmacy" },
    { abbr: "RBC", full: "Red Blood Cell", category: "Lab" },
    { abbr: "RLQ", full: "Right Lower Quadrant", category: "Anatomy" },
    { abbr: "RR", full: "Respiratory Rate", category: "Vital Signs" },
    { abbr: "RUQ", full: "Right Upper Quadrant", category: "Anatomy" },
    { abbr: "SBP", full: "Systolic Blood Pressure", category: "Vital Signs" },
    { abbr: "SOB", full: "Shortness of Breath", category: "Symptoms" },
    { abbr: "STAT", full: "Immediately", category: "Orders" },
    { abbr: "STEMI", full: "ST Elevation Myocardial Infarction", category: "Cardiology" },
    { abbr: "TIA", full: "Transient Ischemic Attack", category: "Neurology" },
    { abbr: "TID", full: "Ter in die (Three times daily)", category: "Pharmacy" },
    { abbr: "tPA", full: "Tissue Plasminogen Activator", category: "Pharmacy" },
    { abbr: "UA", full: "Urinalysis", category: "Lab" },
    { abbr: "URI", full: "Upper Respiratory Infection", category: "ID" },
    { abbr: "UTI", full: "Urinary Tract Infection", category: "ID" },
    { abbr: "VF", full: "Ventricular Fibrillation", category: "Cardiology" },
    { abbr: "VT", full: "Ventricular Tachycardia", category: "Cardiology" },
    { abbr: "WBC", full: "White Blood Cell", category: "Lab" }
  ];

  const filteredAbbreviations = abbreviations.filter(item =>
    searchTerm === "" ||
    item.abbr.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.full.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(abbreviations.map(a => a.category))].sort();

  return (
    <div className="min-h-full bg-neutral-50 dark:bg-neutral-50 pb-6">
      <div className="bg-gradient-to-br from-violet-500 to-violet-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Medical Abbreviations</h1>
            <p className="text-violet-100 text-sm">Quick reference dictionary</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        <Card className="shadow-lg border-none">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <Input
                type="text"
                placeholder="Search abbreviations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 h-12 text-base"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-neutral-400" />
                </button>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              {filteredAbbreviations.length} of {abbreviations.length} abbreviations
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-2">
          {filteredAbbreviations.map((item, idx) => (
            <Card key={idx} className="border-none hover:shadow-md transition-all">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg text-neutral-900">
                        {item.abbr}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-600">{item.full}</p>
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