import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CloudOff, CheckCircle, ChevronDown, ChevronRight } from "lucide-react";

export default function Emergency() {
  const [expandedProtocol, setExpandedProtocol] = React.useState(null);
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);

  React.useEffect(() => {
    // Auto-cache emergency data on mount
    const protocols = JSON.stringify(protocolsData);
    try {
      localStorage.setItem('emergency_protocols', protocols);
    } catch (e) {
      console.error('Failed to cache emergency protocols');
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const protocolsData = [
    {
      title: "Cardiac Arrest (ACLS)",
      algorithm: "CPR → Rhythm Check → Shockable (VF/pVT) vs Non-shockable (Asystole/PEA)",
      steps: [
        "Start high-quality CPR (30:2, 100-120/min, 2-2.4 inches depth)",
        "Attach defibrillator/monitor",
        "Rhythm check every 2 minutes",
        "Shockable: Shock → CPR → Epinephrine → Amiodarone",
        "Non-shockable: CPR → Epinephrine Q3-5min → Treat reversible causes"
      ],
      drugs: ["Epinephrine 1mg IV Q3-5min", "Amiodarone 300mg IV (first), 150mg (second)"],
      reversible: "5 H's: Hypovolemia, Hypoxia, H+ (acidosis), Hypo/hyperkalemia, Hypothermia | 5 T's: Tension pneumo, Tamponade, Toxins, Thrombosis (coronary/pulmonary), Trauma",
      color: "red"
    },
    {
      title: "Anaphylaxis",
      algorithm: "Recognize → Epinephrine → Position → Fluids → Monitoring",
      steps: [
        "Remove trigger if identified",
        "Epinephrine 0.3-0.5mg IM (lateral thigh) - REPEAT Q5-15min PRN",
        "Place patient supine with legs elevated",
        "High-flow oxygen, establish IV access",
        "Fluid bolus 1-2L NS for hypotension",
        "Adjunct: H1 blocker (diphenhydramine), H2 blocker, corticosteroids"
      ],
      drugs: ["Epinephrine 1:1000 IM 0.3-0.5mg", "Diphenhydramine 25-50mg IV", "Methylprednisolone 125mg IV", "Albuterol if bronchospasm"],
      reversible: "Observe for 4-6 hours minimum. Prescribe Epi-Pen on discharge.",
      color: "orange"
    },
    {
      title: "Stroke Code",
      algorithm: "Last Known Well → CT Scan → tPA Decision (if <4.5hr) → Admit",
      steps: [
        "Establish time last known well",
        "NIH Stroke Scale assessment",
        "Non-contrast CT head STAT (rule out hemorrhage)",
        "Check exclusion criteria for tPA",
        "If eligible: Alteplase 0.9mg/kg (10% bolus, 90% over 1 hour)",
        "Neuro ICU admission, hold anticoagulation/antiplatelets 24 hours"
      ],
      drugs: ["Alteplase (tPA) 0.9mg/kg", "Avoid anticoagulants x24hr post-tPA"],
      reversible: "Door-to-needle goal: <60 minutes. BP goal <185/110 before tPA. Thrombectomy if large vessel occlusion.",
      color: "purple"
    },
    {
      title: "Septic Shock",
      algorithm: "Recognize → Cultures → Antibiotics → Fluids → Vasopressors",
      steps: [
        "Obtain blood cultures (2 sets), lactate, cultures from suspected source",
        "Broad-spectrum antibiotics within 1 HOUR",
        "30 mL/kg crystalloid fluid bolus",
        "Reassess: if still hypotensive → Start norepinephrine",
        "Target MAP ≥65 mmHg",
        "Source control (drain abscess, remove infected device)"
      ],
      drugs: ["Norepinephrine (first-line vasopressor)", "Vancomycin + Piperacillin-tazobactam (empiric)", "Vasopressin (adjunct)"],
      reversible: "Surviving Sepsis Campaign: 1-hour bundle. Early lactate clearance improves outcomes.",
      color: "red"
    }
  ];

  const colorClasses = {
    red: "from-red-500 to-red-600",
    orange: "from-orange-500 to-orange-600",
    purple: "from-purple-500 to-purple-600"
  };

  return (
    <div className="min-h-full bg-neutral-50 pb-6">
      <div className="bg-gradient-to-br from-red-500 to-red-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 animate-pulse" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Emergency Protocols</h1>
            <p className="text-red-100 text-sm">Rapid response algorithms</p>
          </div>

          <Badge className="bg-green-500 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Always Offline
          </Badge>
        </div>

        {isOffline && (
          <div className="mt-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm">
              <CloudOff className="w-4 h-4" />
              <span>Critical protocols available offline</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 -mt-4 space-y-3">
        {protocolsData.map((protocol, idx) => (
          <Card
            key={idx}
            className="border-none shadow-xl cursor-pointer"
            onClick={() => setExpandedProtocol(expandedProtocol === idx ? null : idx)}
          >
            <CardHeader className={`bg-gradient-to-r ${colorClasses[protocol.color]} text-white rounded-t-lg`}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{protocol.title}</CardTitle>
                {expandedProtocol === idx ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <div className="p-3 bg-neutral-50 rounded-lg mb-4">
                <p className="text-sm font-semibold text-neutral-700 mb-1">Algorithm:</p>
                <p className="text-sm text-neutral-900">{protocol.algorithm}</p>
              </div>

              {expandedProtocol === idx && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-neutral-700 mb-2">Steps:</p>
                    <ol className="space-y-2">
                      {protocol.steps.map((step, sIdx) => (
                        <li key={sIdx} className="text-sm text-neutral-800 flex gap-2">
                          <span className="font-bold">{sIdx + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="pt-3 border-t border-neutral-200">
                    <p className="text-sm font-semibold text-neutral-700 mb-2">Medications:</p>
                    <ul className="space-y-1">
                      {protocol.drugs.map((drug, dIdx) => (
                        <li key={dIdx} className="text-sm text-neutral-800">
                          • {drug}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-neutral-200">
                    <p className="text-sm font-semibold text-neutral-700 mb-2">Additional Info:</p>
                    <p className="text-sm text-neutral-800">{protocol.reversible}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}