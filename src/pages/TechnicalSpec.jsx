import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCode, Database, Shield, Code, Cloud, Smartphone } from "lucide-react";

export default function TechnicalSpec() {
  return (
    <div className="min-h-full bg-neutral-50 pb-6">
      <div className="bg-gradient-to-br from-slate-700 to-slate-800 px-6 py-8 text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">CareDroid Native App</h1>
          <h2 className="text-xl text-slate-200 mb-4">Complete Technical Architecture Specification</h2>
          <p className="text-slate-300 text-sm">
            Production-ready mobile application for iOS & Android • React Native • Enterprise-grade
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6 space-y-4">
        {/* Executive Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="w-5 h-5" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p className="text-neutral-700 leading-relaxed">
              <strong>CareDroid</strong> is a cross-platform mobile AI clinical assistant for healthcare 
              professionals. This specification outlines the architecture for a production-ready React 
              Native application deployable to iOS App Store and Google Play Store, with enterprise-grade 
              security, regulatory compliance pathways (HIPAA, GDPR, PIPEDA/PHIPA), and integration 
              capabilities for hospital IT systems (HL7/FHIR, DICOM).
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
              {[
                { label: "Platform", value: "React Native" },
                { label: "Backend", value: "Node.js + Firebase" },
                { label: "AI Provider", value: "OpenAI GPT-4" },
                { label: "Payment", value: "Stripe + IAP" }
              ].map(item => (
                <div key={item.label} className="text-center p-3 bg-neutral-50 rounded-lg border">
                  <p className="text-xs text-neutral-500">{item.label}</p>
                  <p className="font-semibold text-sm text-neutral-900">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Technology Stack */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Technology Stack
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Frontend (Mobile)</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    "React Native 0.73+",
                    "TypeScript",
                    "React Navigation 6",
                    "React Query (TanStack)",
                    "Zustand (State)",
                    "React Native Paper (UI)",
                    "react-native-voice",
                    "react-native-keychain",
                    "expo-file-system",
                    "react-native-reanimated"
                  ].map(tech => (
                    <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Backend</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Node.js 20+ (Express/Fastify)",
                    "TypeScript",
                    "Firebase Auth",
                    "Firestore / PostgreSQL",
                    "Redis (caching)",
                    "Bull (job queues)",
                    "OpenAI SDK",
                    "Stripe Node SDK",
                    "FHIR Server (HAPI)",
                    "Winston (logging)"
                  ].map(tech => (
                    <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Infrastructure</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Google Cloud Platform / AWS",
                    "Docker + Kubernetes",
                    "Cloud Functions",
                    "Cloud Storage",
                    "Cloud CDN",
                    "GitHub Actions (CI/CD)",
                    "Sentry (error tracking)",
                    "Mixpanel/Amplitude (analytics)"
                  ].map(tech => (
                    <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Architecture Overview - FULL CONTENT IN NEXT MESSAGE DUE TO LENGTH */}
      </div>
    </div>
  );
}