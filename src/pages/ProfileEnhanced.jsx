import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, 
  Shield, 
  CheckCircle,
  Building2,
  Globe,
  Award,
  Settings,
  LogOut,
  AlertCircle
} from "lucide-react";

export default function ProfileEnhanced() {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    fullName: "Dr. Jane Smith",
    email: "jane.smith@hospital.edu",
    institution: "Johns Hopkins Hospital",
    role: "attending",
    specialty: "Emergency Medicine",
    license: "MD-12345",
    country: "US",
    language: "en",
    trustScore: 85,
    verified: true
  });

  const verificationSteps = [
    { id: 1, label: "Email Verification", status: "complete" },
    { id: 2, label: "Institutional Domain", status: "complete" },
    { id: 3, label: "AI Anti-Phishing", status: "complete" },
    { id: 4, label: "License Verification", status: "pending" }
  ];

  const getStatusColor = (status) => {
    if (status === "complete") return "bg-green-100 text-green-800";
    if (status === "pending") return "bg-amber-100 text-amber-800";
    return "bg-neutral-100 text-neutral-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-6">
      <div className="bg-gradient-to-br from-slate-600 to-slate-700 px-6 py-6 text-white">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <User className="w-8 h-8" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profileData.fullName}</h1>
            <p className="text-slate-200 text-sm">{profileData.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </Badge>
              <Badge variant="outline" className="text-white border-white/30">
                Trust Score: {profileData.trustScore}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Verification Status */}
        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {verificationSteps.map((step) => (
              <div key={step.id} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.status === "complete" ? "bg-green-500" : "bg-amber-500"
                }`}>
                  {step.status === "complete" ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-neutral-900">{step.label}</p>
                </div>
                <Badge className={getStatusColor(step.status)}>
                  {step.status}
                </Badge>
              </div>
            ))}

            {verificationSteps.some(s => s.status === "pending") && (
              <Button variant="outline" className="w-full mt-3">
                Complete Pending Verification
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Professional Info */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-5 h-5" />
              Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profileData.fullName}
                onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                value={profileData.institution}
                onChange={(e) => setProfileData({...profileData, institution: e.target.value})}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={profileData.role} onValueChange={(value) => setProfileData({...profileData, role: value})}>
                  <SelectTrigger id="role" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attending">Attending Physician</SelectItem>
                    <SelectItem value="resident">Resident</SelectItem>
                    <SelectItem value="fellow">Fellow</SelectItem>
                    <SelectItem value="nurse">Nurse/NP/PA</SelectItem>
                    <SelectItem value="student">Medical Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="specialty">Specialty</Label>
                <Input
                  id="specialty"
                  value={profileData.specialty}
                  onChange={(e) => setProfileData({...profileData, specialty: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="license">License Number</Label>
              <Input
                id="license"
                value={profileData.license}
                onChange={(e) => setProfileData({...profileData, license: e.target.value})}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Location & Language */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Regional Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="country">Country</Label>
              <Select value={profileData.country} onValueChange={(value) => setProfileData({...profileData, country: value})}>
                <SelectTrigger id="country" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="language">Language</Label>
              <Select value={profileData.language} onValueChange={(value) => setProfileData({...profileData, language: value})}>
                <SelectTrigger id="language" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Institutional Connection */}
        <Card className="border-none shadow-lg bg-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <Building2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-indigo-900 mb-1">
                  Enterprise Features Available
                </p>
                <p className="text-xs text-indigo-800 leading-relaxed mb-3">
                  Connect your account to your institution's CareDroid portal for team collaboration,
                  EMR integration, and advanced analytics.
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-100"
              onClick={() => navigate(createPageUrl("InstitutionalPortal"))}
            >
              <Building2 className="w-4 h-4 mr-2" />
              Connect to Institution
            </Button>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            <Settings className="w-4 h-4 mr-2" />
            Account Settings
          </Button>

          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate(createPageUrl("ComplianceCenter"))}
          >
            <Shield className="w-4 h-4 mr-2" />
            Compliance Center
          </Button>

          <Button variant="destructive" className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <p className="text-center text-xs text-neutral-400 mt-4">
          🔒 Profile data is encrypted and HIPAA compliant
        </p>
      </div>
    </div>
  );
}