import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  UserCheck, 
  Shield, 
  Mail,
  CheckCircle,
  ArrowRight,
  Building2,
  Stethoscope,
  AlertTriangle
} from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    institution: "",
    role: "",
    specialty: "",
    license: "",
    verificationCode: ""
  });

  const handleComplete = () => {
    // Save mock user data
    localStorage.setItem('careDroid_mockUser', JSON.stringify({
      ...formData,
      verified: true,
      trustScore: 85,
      subscriptionTier: 'free',
      onboarded: true
    }));
    navigate(createPageUrl("SubscriptionSelect"));
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Professional Verification</h1>
            <p className="text-neutral-600 text-sm">
              Step 1 of 3 • Basic Information
            </p>
          </div>

          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle>Tell us about yourself</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Dr. Jane Smith"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="institution">Institution/Hospital *</Label>
                <Input
                  id="institution"
                  placeholder="Johns Hopkins Hospital"
                  value={formData.institution}
                  onChange={(e) => setFormData({...formData, institution: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="role">Professional Role *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                  <SelectTrigger id="role" className="mt-1">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attending">Attending Physician</SelectItem>
                    <SelectItem value="resident">Resident</SelectItem>
                    <SelectItem value="fellow">Fellow</SelectItem>
                    <SelectItem value="nurse">Nurse/NP/PA</SelectItem>
                    <SelectItem value="student">Medical Student</SelectItem>
                    <SelectItem value="pharmacist">Pharmacist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="specialty">Specialty</Label>
                <Input
                  id="specialty"
                  placeholder="Emergency Medicine"
                  value={formData.specialty}
                  onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                  className="mt-1"
                />
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!formData.fullName || !formData.institution || !formData.role}
                className="w-full"
                size="lg"
              >
                Continue to Verification
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Identity Verification</h1>
            <p className="text-neutral-600 text-sm">
              Step 2 of 3 • Trust Score Verification
            </p>
          </div>

          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle>Verify Your Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex gap-3">
                  <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      Email Verification
                    </p>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      We've sent a 6-digit code to your institutional email. 
                      Institutional domains (.edu, .org, hospital domains) receive higher trust scores.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="verificationCode">Verification Code *</Label>
                <Input
                  id="verificationCode"
                  placeholder="123456"
                  maxLength={6}
                  value={formData.verificationCode}
                  onChange={(e) => setFormData({...formData, verificationCode: e.target.value})}
                  className="mt-1 text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              <div>
                <Label htmlFor="license">License Number (Optional)</Label>
                <Input
                  id="license"
                  placeholder="NPI or License #"
                  value={formData.license}
                  onChange={(e) => setFormData({...formData, license: e.target.value})}
                  className="mt-1"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Providing a license number increases your trust score
                </p>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900 mb-1">
                      AI Anti-Phishing Check
                    </p>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Our AI analyzes signup patterns to detect bot-like behavior. 
                      Accounts flagged as suspicious require additional verification.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setStep(3)}
                disabled={formData.verificationCode.length !== 6}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                Verify & Continue
                <CheckCircle className="w-5 h-5 ml-2" />
              </Button>

              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="w-full"
              >
                Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Verification Complete!</h1>
            <p className="text-neutral-600 text-sm">
              Step 3 of 3 • Trust Score Calculated
            </p>
          </div>

          <Card className="border-none shadow-xl">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-neutral-600 mb-2">Your Trust Score</p>
                <p className="text-6xl font-bold text-green-600 mb-3">85</p>
                <Badge className="bg-green-100 text-green-800">Verified Professional</Badge>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">Email Verified</p>
                    <p className="text-xs text-green-700">Institutional domain confirmed</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">AI Anti-Phishing Passed</p>
                    <p className="text-xs text-green-700">Human behavior patterns detected</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Institution Recognized</p>
                    <p className="text-xs text-blue-700">{formData.institution}</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleComplete}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
                size="lg"
              >
                Continue to Subscription Options
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
}