
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { initializeSampleData } from "../utils/services";
import { 
  Pill, 
  Calculator, 
  FileText, 
  AlertTriangle, 
  TestTube, 
  Stethoscope,
  Image as ImageIcon,
  Clock,
  TrendingUp,
  ChevronRight,
  GitBranch,
  BookOpen,
  Zap,
  Target,
  Lightbulb,
  FileCheck,
  CloudOff
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PersonalizedFeed from "../components/PersonalizedFeed";

export default function Home() {
  useEffect(() => {
    // Initialize sample data on first load
    initializeSampleData();
  }, []);

  const quickActions = [
    {
      title: "Drug Database",
      description: "Dosing, interactions, contraindications",
      icon: Pill,
      color: "blue",
      path: "DrugDatabase",
      badge: "500+",
      offline: true
    },
    {
      title: "Drug Interactions",
      description: "Multi-drug interaction checker",
      icon: Zap,
      color: "orange",
      path: "DrugInteractions",
      badge: "New",
      offline: false
    },
    {
      title: "Medical Calculators",
      description: "20+ clinical calculation tools",
      icon: Calculator,
      color: "purple",
      path: "Calculators",
      badge: "20+",
      offline: true
    },
    {
      title: "Scoring Systems",
      description: "Clinical risk scores & assessments",
      icon: Target,
      color: "teal",
      path: "ScoringSystem",
      badge: "25+",
      offline: true
    },
    {
      title: "Differential Diagnosis",
      description: "Symptom-based DDx builder",
      icon: GitBranch,
      color: "cyan",
      path: "DifferentialDx",
      badge: "AI",
      offline: false
    },
    {
      title: "Diagnostic Algorithms",
      description: "Clinical decision pathways",
      icon: FileCheck,
      color: "emerald",
      path: "Algorithms",
      badge: "15+",
      offline: true
    },
    {
      title: "AI Algorithm Guidance",
      description: "Smart pathway analysis",
      icon: GitBranch,
      color: "cyan",
      path: "AlgorithmAI",
      badge: "AI ✨",
      offline: false
    },
    {
      title: "Clinical Protocols",
      description: "Evidence-based treatment pathways",
      icon: FileText,
      color: "green",
      path: "Protocols",
      badge: "300+",
      offline: true
    },
    {
      title: "Emergency Protocols",
      description: "ACLS, PALS, rapid response",
      icon: AlertTriangle,
      color: "red",
      path: "Emergency",
      badge: "Critical",
      offline: true
    },
    {
      title: "Lab Image Analyzer",
      description: "AI lab report extraction",
      icon: TestTube,
      color: "purple",
      path: "LabImageAnalyzer",
      badge: "AI ✨",
      offline: false
    },
    {
      title: "Lab Interpreter",
      description: "Batch lab result analysis",
      icon: TestTube,
      color: "amber",
      path: "LabInterpreter",
      badge: "Smart",
      offline: false
    },
    {
      title: "Lab Values",
      description: "Reference ranges & interpretation",
      icon: TestTube,
      color: "yellow",
      path: "LabValues",
      badge: "200+",
      offline: true
    },
    {
      title: "Clinical Trials",
      description: "AI-powered trial matching",
      icon: Lightbulb,
      color: "emerald",
      path: "ClinicalTrials",
      badge: "AI ✨",
      offline: false
    },
    {
      title: "Procedures",
      description: "Step-by-step clinical procedures",
      icon: Stethoscope,
      color: "indigo",
      path: "Procedures",
      badge: "50+",
      offline: true
    },
    {
      title: "Medical Abbreviations",
      description: "Searchable clinical abbreviations",
      icon: BookOpen,
      color: "violet",
      path: "Abbreviations",
      badge: "1000+",
      offline: true
    },
    {
      title: "Clinical Pearls",
      description: "Specialty tips & mnemonics",
      icon: Lightbulb,
      color: "lime",
      path: "ClinicalPearls",
      badge: "Tips",
      offline: true
    },
    {
      title: "Quick References",
      description: "One-page clinical summaries",
      icon: FileCheck,
      color: "sky",
      path: "QuickReference",
      badge: "Printable",
      offline: true
    },
    {
      title: "Medical Images",
      description: "Visual diagnosis reference",
      icon: ImageIcon,
      color: "pink",
      path: "Images",
      badge: "Visual",
      offline: false
    },
    {
      title: "Offline Manager",
      description: "Manage offline data & sync",
      icon: CloudOff,
      color: "slate",
      path: "OfflineManager",
      badge: "Sync",
      offline: true
    },
    {
      title: "Audit Log",
      description: "Access history & compliance",
      icon: Clock,
      color: "slate",
      path: "AuditLog",
      badge: "HIPAA",
      offline: false
    },
    {
      title: "Encounter Summary",
      description: "AI-generated clinical summaries",
      icon: FileText,
      color: "indigo",
      path: "EncounterSummary",
      badge: "AI ✨",
      offline: false
    }
  ];

  const colorClasses = {
    blue: "from-blue-500 to-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    purple: "from-purple-500 to-purple-600 text-purple-600 bg-purple-50 dark:bg-purple-900/20",
    green: "from-green-500 to-green-600 text-green-600 bg-green-50 dark:bg-green-900/20",
    red: "from-red-500 to-red-600 text-red-600 bg-red-50 dark:bg-red-900/20",
    amber: "from-amber-500 to-amber-600 text-amber-600 bg-amber-50 dark:bg-amber-900/20",
    indigo: "from-indigo-500 to-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20",
    pink: "from-pink-500 to-pink-600 text-pink-600 bg-pink-50 dark:bg-pink-900/20",
    slate: "from-slate-500 to-slate-600 text-slate-600 bg-slate-50 dark:bg-slate-900/20",
    orange: "from-orange-500 to-orange-600 text-orange-600 bg-orange-50 dark:bg-orange-900/20",
    cyan: "from-cyan-500 to-cyan-600 text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20",
    teal: "from-teal-500 to-teal-600 text-teal-600 bg-teal-50 dark:bg-teal-900/20",
    emerald: "from-emerald-500 to-emerald-600 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
    violet: "from-violet-500 to-violet-600 text-violet-600 bg-violet-50 dark:bg-violet-900/20",
    lime: "from-lime-500 to-lime-600 text-lime-600 bg-lime-50 dark:bg-lime-900/20",
    sky: "from-sky-500 to-sky-600 text-sky-600 bg-sky-50 dark:bg-sky-900/20",
    yellow: "from-yellow-500 to-yellow-600 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20"
  };

  return (
    <div className="min-h-full bg-neutral-50 dark:bg-neutral-50">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5" />
          <span className="text-sm font-medium opacity-90">Point-of-Care</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Clinical Decision Support</h2>
        <p className="text-blue-100 text-sm">
          20 tools • 12 available offline • AI-powered insights
        </p>
      </div>

      <div className="p-4 -mt-4 space-y-4">
        {/* Personalized Feed */}
        <PersonalizedFeed />

        {/* All Tools Section */}
        <div>
          <h3 className="text-base font-semibold text-neutral-800 mb-3 flex items-center gap-2">
            <span>All Clinical Tools</span>
            <Badge variant="secondary" className="text-xs">{quickActions.length}</Badge>
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link key={action.title} to={createPageUrl(action.path)}>
                <Card className="h-full hover:shadow-lg transition-all duration-200 border-none bg-white dark:bg-neutral-800">
                  <CardContent className="p-4">
                    <div className="flex flex-col h-full">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[action.color].split(' ')[0]} ${colorClasses[action.color].split(' ')[1]} flex items-center justify-center mb-3 shadow-md relative`}>
                        <action.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                        {action.offline && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-neutral-800" title="Available offline">
                            <CloudOff className="w-2 h-2 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-200 leading-tight">
                            {action.title}
                          </h3>
                          <ChevronRight className="w-4 h-4 text-neutral-400 flex-shrink-0 ml-1" />
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-2">
                          {action.description}
                        </p>
                      </div>

                      <Badge 
                        variant="secondary" 
                        className={`text-[10px] w-fit ${colorClasses[action.color].split('text-')[1]?.split(' ')[0] ? `bg-${colorClasses[action.color].split('text-')[1]?.split(' ')[0]}-50 dark:bg-${colorClasses[action.color].split('text-')[1]?.split(' ')[0]}-900/20 dark:text-${colorClasses[action.color].split('text-')[1]?.split(' ')[0]}-300` : ''}`}
                      >
                        {action.badge}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Safety Banner */}
      <div className="px-6 pb-6">
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-400 mb-1">
                  Clinical Decision Support Tool
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-500 leading-relaxed">
                  This app provides reference information only. Always use clinical judgment 
                  and verify critical information with authoritative sources.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
