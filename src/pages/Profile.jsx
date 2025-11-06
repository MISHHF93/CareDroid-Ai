import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, LogOut, Shield, Globe, Briefcase } from "lucide-react";
import { authService } from "../utils/services";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    specialty: "",
    license_number: "",
    user_role: "",
    country: "",
    language: "en",
    institution: "",
    years_experience: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await authService.me();
      setUser(currentUser);
      setFormData({
        specialty: currentUser.specialty || "",
        license_number: currentUser.license_number || "",
        user_role: currentUser.user_role || "",
        country: currentUser.country || "",
        language: currentUser.language || "en",
        institution: currentUser.institution || "",
        years_experience: currentUser.years_experience || ""
      });
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await authService.updateMe(formData);
      await loadUser();
    } catch (error) {
      console.error("Error saving profile:", error);
    }
    setIsSaving(false);
  };

  const handleLogout = () => {
    authService.logout();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-neutral-50 pb-6">
      <div className="bg-gradient-to-br from-slate-500 to-slate-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <User className="w-8 h-8" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.full_name}</h1>
            <p className="text-slate-100 text-sm">{user.email}</p>
            {formData.user_role && (
              <p className="text-slate-200 text-xs mt-1">
                {formData.user_role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="user_role">Clinical Role *</Label>
              <Select 
                value={formData.user_role} 
                onValueChange={(value) => setFormData({...formData, user_role: value})}
              >
                <SelectTrigger id="user_role" className="mt-1">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attending_physician">Attending Physician</SelectItem>
                  <SelectItem value="resident">Resident Physician</SelectItem>
                  <SelectItem value="medical_student">Medical Student</SelectItem>
                  <SelectItem value="nurse">Nurse/NP/PA</SelectItem>
                  <SelectItem value="pharmacist">Pharmacist</SelectItem>
                  <SelectItem value="other">Other Healthcare Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="specialty">Medical Specialty</Label>
              <Select 
                value={formData.specialty} 
                onValueChange={(value) => setFormData({...formData, specialty: value})}
              >
                <SelectTrigger id="specialty" className="mt-1">
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emergency_medicine">Emergency Medicine</SelectItem>
                  <SelectItem value="internal_medicine">Internal Medicine</SelectItem>
                  <SelectItem value="family_medicine">Family Medicine</SelectItem>
                  <SelectItem value="pediatrics">Pediatrics</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="cardiology">Cardiology</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="years_experience">Years Experience</Label>
                <Input
                  id="years_experience"
                  type="number"
                  placeholder="5"
                  value={formData.years_experience}
                  onChange={(e) => setFormData({...formData, years_experience: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="license">License Number</Label>
                <Input
                  id="license"
                  type="text"
                  placeholder="Optional"
                  value={formData.license_number}
                  onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="institution">Institution/Hospital</Label>
              <Input
                id="institution"
                type="text"
                placeholder="Your workplace"
                value={formData.institution}
                onChange={(e) => setFormData({...formData, institution: e.target.value})}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Location & Language
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="country">Country</Label>
              <Select 
                value={formData.country} 
                onValueChange={(value) => setFormData({...formData, country: value})}
              >
                <SelectTrigger id="country" className="mt-1">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="w-full"
              size="lg"
            >
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-blue-50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Privacy & Compliance
                </p>
                <p className="text-xs text-blue-800 leading-relaxed">
                  All activity is logged for compliance. CareDroid is a clinical reference tool, 
                  not a substitute for professional medical judgment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={handleLogout}
          variant="destructive"
          className="w-full"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}