import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  CheckCircle, 
  Lock,
  FileCheck,
  Eye,
  Download,
  Globe,
  ChevronDown,
  ChevronRight
} from "lucide-react";

export default function ComplianceCenter() {
  const [expandedCert, setExpandedCert] = useState(null);

  const certifications = [
    {
      id: "hipaa",
      name: "HIPAA Compliant",
      icon: Shield,
      color: "blue",
      status: "active",
      description: "Health Insurance Portability and Accountability Act compliance ensures all patient data handling meets US federal healthcare privacy standards.",
      features: [
        "End-to-end encryption for PHI",
        "Audit logging of all data access",
        "Automatic session timeouts",
        "Secure data transmission (TLS 1.3)"
      ]
    },
    {
      id: "iso27001",
      name: "ISO 27001",
      icon: Lock,
      color: "green",
      status: "active",
      description: "International standard for information security management systems (ISMS). Ensures systematic approach to managing sensitive data.",
      features: [
        "Risk assessment framework",
        "Security incident management",
        "Access control policies",
        "Business continuity planning"
      ]
    },
    {
      id: "iso13485",
      name: "ISO 13485",
      icon: FileCheck,
      color: "purple",
      status: "active",
      description: "Medical device quality management standard. Required for software as a medical device (SaMD) classification.",
      features: [
        "Design controls & verification",
        "Clinical evaluation processes",
        "Post-market surveillance",
        "Regulatory compliance tracking"
      ]
    },
    {
      id: "iso14971",
      name: "ISO 14971",
      icon: Shield,
      color: "amber",
      status: "active",
      description: "Risk management for medical devices. Systematic identification and mitigation of clinical risks.",
      features: [
        "Risk analysis methodology",
        "Harm probability assessment",
        "Risk-benefit documentation",
        "Ongoing risk monitoring"
      ]
    },
    {
      id: "gdpr",
      name: "GDPR Ready",
      icon: Globe,
      color: "indigo",
      status: "active",
      description: "General Data Protection Regulation compliance for EU users. Ensures data privacy rights and user consent.",
      features: [
        "Right to data portability",
        "Right to be forgotten",
        "Explicit consent management",
        "Data breach notifications"
      ]
    },
    {
      id: "pipeda",
      name: "PIPEDA/PHIPA",
      icon: Shield,
      color: "teal",
      status: "active",
      description: "Canadian privacy legislation compliance. Personal Information Protection and Electronic Documents Act + Provincial Health Information Protection Act.",
      features: [
        "Consent-based data collection",
        "Data residency requirements",
        "Provincial health authority alignment",
        "Cross-border data transfer controls"
      ]
    }
  ];

  const colorClasses = {
    blue: "from-blue-500 to-blue-600 bg-blue-50 text-blue-800",
    green: "from-green-500 to-green-600 bg-green-50 text-green-800",
    purple: "from-purple-500 to-purple-600 bg-purple-50 text-purple-800",
    amber: "from-amber-500 to-amber-600 bg-amber-50 text-amber-800",
    indigo: "from-indigo-500 to-indigo-600 bg-indigo-50 text-indigo-800",
    teal: "from-teal-500 to-teal-600 bg-teal-50 text-teal-800"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-6">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Compliance Center</h1>
            <p className="text-blue-100 text-sm">Security & regulatory standards</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Security Status */}
        <Card className="border-none shadow-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Lock className="w-8 h-8" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">Encryption Active</h3>
                <p className="text-green-100 text-sm">AES-256 end-to-end encryption</p>
              </div>
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-xs text-green-100 mb-1">Data Protection</p>
                <p className="text-lg font-bold">100%</p>
              </div>
              <div>
                <p className="text-xs text-green-100 mb-1">Uptime SLA</p>
                <p className="text-lg font-bold">99.9%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">Active Certifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {certifications.map((cert) => (
              <Card
                key={cert.id}
                className={`border-2 cursor-pointer transition-all ${
                  expandedCert === cert.id ? 'border-blue-500' : 'border-neutral-200'
                }`}
                onClick={() => setExpandedCert(expandedCert === cert.id ? null : cert.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[cert.color].split(' ')[0]} ${colorClasses[cert.color].split(' ')[1]} flex items-center justify-center flex-shrink-0`}>
                      <cert.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-base text-neutral-900">{cert.name}</h4>
                        {expandedCert === cert.id ? (
                          <ChevronDown className="w-5 h-5 text-neutral-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-neutral-400" />
                        )}
                      </div>
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {cert.status}
                      </Badge>
                    </div>
                  </div>

                  {expandedCert === cert.id && (
                    <div className="mt-4 pt-4 border-t border-neutral-200 space-y-3">
                      <p className="text-sm text-neutral-700 leading-relaxed">
                        {cert.description}
                      </p>
                      <div>
                        <p className="text-xs font-semibold text-neutral-700 mb-2">Key Features:</p>
                        <ul className="space-y-1">
                          {cert.features.map((feature, idx) => (
                            <li key={idx} className="text-sm text-neutral-600 flex gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Audit Controls */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Audit & Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                View Audit Log
              </span>
              <span className="text-xs text-neutral-500">Last 90 days</span>
            </Button>

            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download Compliance Report
              </span>
              <span className="text-xs text-neutral-500">PDF</span>
            </Button>

            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Security Incident Report
              </span>
              <Badge className="bg-green-100 text-green-800 text-xs">0 incidents</Badge>
            </Button>
          </CardContent>
        </Card>

        {/* Data Privacy Summary */}
        <Card className="border-none shadow-lg bg-blue-50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Your Data Privacy
                </p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>✓ No patient identifiers stored</li>
                  <li>✓ All queries encrypted in transit & at rest</li>
                  <li>✓ Data retention: 90 days (configurable)</li>
                  <li>✓ Right to deletion honored within 24 hours</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-neutral-400 mt-4">
          🔒 This is a prototype interface. Actual certifications require organizational implementation.
        </p>
      </div>
    </div>
  );
}