import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users,
  Activity,
  FileCheck,
  Database,
  Shield,
  TrendingUp,
  Settings,
  Download
} from "lucide-react";

export default function InstitutionalPortal() {
  const stats = [
    { label: "Active Licenses", value: "245", icon: Users, color: "blue" },
    { label: "Monthly Queries", value: "12.5K", icon: Activity, color: "green" },
    { label: "Compliance Score", value: "98%", icon: Shield, color: "purple" },
    { label: "Cost Savings", value: "$45K", icon: TrendingUp, color: "amber" }
  ];

  const teamMembers = [
    { name: "Dr. Sarah Johnson", role: "Emergency Medicine", status: "active", queries: 245 },
    { name: "Dr. Michael Chen", role: "Internal Medicine", status: "active", queries: 189 },
    { name: "Dr. Emily Rodriguez", role: "Pediatrics", status: "active", queries: 156 },
    { name: "Dr. James Wilson", role: "Surgery", status: "pending", queries: 0 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 pb-6">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 px-6 py-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <Building2 className="w-8 h-8" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Johns Hopkins Hospital</h1>
            <p className="text-indigo-100 text-sm">Enterprise Portal</p>
            <Badge className="bg-white/20 text-white border-white/30 mt-2">
              Institutional Plan
            </Badge>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, idx) => (
            <Card key={idx} className="border-none shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                <p className="text-xs text-neutral-600">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Team Members */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {teamMembers.map((member, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-neutral-900">{member.name}</p>
                  <p className="text-xs text-neutral-600">{member.role}</p>
                </div>
                <div className="text-right">
                  <Badge variant={member.status === "active" ? "default" : "secondary"} className="text-xs">
                    {member.status}
                  </Badge>
                  <p className="text-xs text-neutral-500 mt-1">{member.queries} queries</p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-3">
              <Users className="w-4 h-4 mr-2" />
              Invite Team Member
            </Button>
          </CardContent>
        </Card>

        {/* API & Integration */}
        <Card className="border-none shadow-lg bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-5 h-5" />
              API & EMR Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-white rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm">FHIR API Access</p>
                <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
              </div>
              <p className="text-xs text-neutral-600 mb-2">
                RESTful API for clinical data exchange
              </p>
              <code className="text-xs bg-neutral-100 px-2 py-1 rounded block">
                https://api.caredroid.ai/fhir/r4
              </code>
            </div>

            <div className="p-3 bg-white rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm">HL7 Messaging</p>
                <Badge variant="outline" className="text-xs">Available</Badge>
              </div>
              <p className="text-xs text-neutral-600">
                ADT, ORM, ORU message support
              </p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm">DICOM Integration</p>
                <Badge variant="outline" className="text-xs">Coming Soon</Badge>
              </div>
              <p className="text-xs text-neutral-600">
                Medical imaging data exchange
              </p>
            </div>

            <Button variant="default" className="w-full bg-purple-600 hover:bg-purple-700">
              <Settings className="w-4 h-4 mr-2" />
              Configure API Access
            </Button>
          </CardContent>
        </Card>

        {/* Compliance Reports */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              Compliance & Audit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                ISO 27001 Audit Trail
              </span>
              <Download className="w-4 h-4" />
            </Button>

            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                HIPAA Compliance Report
              </span>
              <Download className="w-4 h-4" />
            </Button>

            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Usage Analytics (Q4 2024)
              </span>
              <Download className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Data Ownership */}
        <Card className="border-none bg-blue-50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Enterprise Data Ownership
                </p>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Your institution retains full ownership and control of all clinical data. 
                  CareDroid processes data as a service provider under BAA (Business Associate Agreement). 
                  Data can be exported or deleted at any time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-neutral-400 mt-4">
          🔒 Enterprise portal mockup • Full features available in production
        </p>
      </div>
    </div>
  );
}