import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Smartphone,
  Mail,
  CheckCircle,
  Key,
  ArrowRight,
  Lock
} from "lucide-react";

export default function Setup2FA() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState(null);
  const [code, setCode] = useState("");

  const handleComplete = () => {
    // Mock 2FA completion
    alert("✅ Two-Factor Authentication Enabled!\n\nYour account security score has been updated.");
    navigate(createPageUrl("ProfileEnhanced"));
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              Enable Two-Factor Authentication
            </h1>
            <p className="text-neutral-600 text-sm">
              Add an extra layer of security to your account
            </p>
          </div>

          <Card className="border-none shadow-xl mb-4">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    method === "email" ? "border-green-500 bg-green-50" : "border-neutral-200 hover:border-green-300"
                  }`}
                  onClick={() => setMethod("email")}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base text-neutral-900 mb-1">
                        Email Verification
                      </h3>
                      <p className="text-sm text-neutral-600">
                        Receive codes via email
                      </p>
                      <Badge variant="secondary" className="text-xs mt-2">
                        Recommended for most users
                      </Badge>
                    </div>
                    {method === "email" && (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                </div>

                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    method === "app" ? "border-green-500 bg-green-50" : "border-neutral-200 hover:border-green-300"
                  }`}
                  onClick={() => setMethod("app")}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base text-neutral-900 mb-1">
                        Authenticator App
                      </h3>
                      <p className="text-sm text-neutral-600">
                        Google Authenticator, Authy, etc.
                      </p>
                      <Badge className="bg-green-100 text-green-800 text-xs mt-2">
                        Most Secure
                      </Badge>
                    </div>
                    {method === "app" && (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!method}
                className="w-full mt-6 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex gap-3">
              <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Why Enable 2FA?
                </p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>✓ Protects against unauthorized access</li>
                  <li>✓ Required for HIPAA compliance</li>
                  <li>✓ Increases your trust score</li>
                  <li>✓ Industry best practice for healthcare apps</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              Verify Your Code
            </h1>
            <p className="text-neutral-600 text-sm">
              {method === "email" 
                ? "Enter the 6-digit code sent to your email"
                : "Enter the code from your authenticator app"
              }
            </p>
          </div>

          <Card className="border-none shadow-xl">
            <CardContent className="p-6">
              {method === "app" && (
                <div className="mb-6 p-4 bg-neutral-50 rounded-lg text-center">
                  <div className="w-32 h-32 bg-neutral-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <p className="text-xs text-neutral-500">QR Code Here</p>
                  </div>
                  <p className="text-xs text-neutral-600">
                    Scan this QR code with your authenticator app
                  </p>
                  <p className="text-xs text-neutral-500 mt-2 font-mono">
                    Manual key: ABCD EFGH IJKL MNOP
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-2xl tracking-widest font-mono h-14"
                  />
                  <p className="text-xs text-neutral-500 text-center mt-2">
                    Enter 6-digit verification code
                  </p>
                </div>

                <Button
                  onClick={() => setStep(3)}
                  disabled={code.length !== 6}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  Verify Code
                  <CheckCircle className="w-5 h-5 ml-2" />
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="w-full"
                >
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>

          {method === "email" && (
            <p className="text-center text-sm text-neutral-500 mt-4">
              Didn't receive a code? <button className="text-green-600 font-medium">Resend</button>
            </p>
          )}
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <CheckCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              2FA Successfully Enabled!
            </h1>
            <p className="text-neutral-600 text-sm">
              Your account is now more secure
            </p>
          </div>

          <Card className="border-none shadow-xl">
            <CardContent className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-green-900">
                      Two-Factor Authentication Active
                    </p>
                    <p className="text-xs text-green-700">
                      Required for each login
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-blue-900">
                      Security Score Updated
                    </p>
                    <p className="text-xs text-blue-700">
                      Trust score increased to 95/100
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                  <Key className="w-6 h-6 text-purple-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-purple-900">
                      Backup Codes Generated
                    </p>
                    <p className="text-xs text-purple-700">
                      Save these for account recovery
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-neutral-50 rounded-lg mb-4">
                <p className="text-xs font-semibold text-neutral-700 mb-2">Backup Recovery Codes:</p>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <p>1A2B-3C4D</p>
                  <p>5E6F-7G8H</p>
                  <p>9I0J-1K2L</p>
                  <p>3M4N-5O6P</p>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  <Download className="w-4 h-4 mr-2" />
                  Download Backup Codes
                </Button>
              </div>

              <Button
                onClick={handleComplete}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
                size="lg"
              >
                Complete Setup
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-neutral-500 mt-4">
            You can manage 2FA settings anytime in your profile
          </p>
        </div>
      </div>
    );
  }
}