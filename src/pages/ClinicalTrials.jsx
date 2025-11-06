import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Beaker, 
  Sparkles, 
  Loader2,
  MapPin,
  Calendar,
  Users,
  FileText,
  ExternalLink,
  CheckCircle
} from "lucide-react";

export default function ClinicalTrials() {
  const [query, setQuery] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [trials, setTrials] = useState(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const user = await api.auth.me();
      setUserProfile({
        specialty: user.specialty || "General Medicine",
        country: user.country || "US",
        institution: user.institution || ""
      });
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const searchTrials = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const prompt = `You are a clinical trials matching AI assistant.

User Profile:
- Specialty: ${userProfile?.specialty}
- Region: ${userProfile?.country}
- Institution: ${userProfile?.institution}

Clinical Query: "${query}"

Search for relevant clinical trials and provide matches in this JSON format:
{
  "search_summary": "brief summary of search results",
  "matched_trials": [
    {
      "title": "trial name",
      "phase": "Phase I/II/III/IV",
      "condition": "condition being studied",
      "intervention": "drug/device/procedure",
      "status": "recruiting/active/completed",
      "location": "primary location",
      "sponsor": "sponsor name",
      "eligibility_summary": "key inclusion criteria",
      "primary_outcome": "what the trial measures",
      "estimated_enrollment": "number of participants",
      "start_date": "approximate date",
      "contact_info": "how to inquire",
      "trial_id": "NCT number or identifier if available",
      "relevance_score": "high/moderate/low",
      "why_relevant": "why this matches user profile and query"
    }
  ],
  "regional_availability": "trials available in user's region",
  "specialty_specific_trials": "trials specific to user's specialty",
  "patient_referral_considerations": "guidance for referring patients"
}

Focus on currently recruiting or active trials. Provide accurate information based on recent clinical trial databases.`;

      const response = await api.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            search_summary: { type: "string" },
            matched_trials: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  phase: { type: "string" },
                  condition: { type: "string" },
                  intervention: { type: "string" },
                  status: { type: "string" },
                  location: { type: "string" },
                  sponsor: { type: "string" },
                  eligibility_summary: { type: "string" },
                  primary_outcome: { type: "string" },
                  estimated_enrollment: { type: "string" },
                  start_date: { type: "string" },
                  contact_info: { type: "string" },
                  trial_id: { type: "string" },
                  relevance_score: { type: "string" },
                  why_relevant: { type: "string" }
                }
              }
            },
            regional_availability: { type: "string" },
            specialty_specific_trials: { type: "string" },
            patient_referral_considerations: { type: "string" }
          }
        }
      });

      setTrials(response);
    } catch (error) {
      console.error("Search error:", error);
    }
    setIsSearching(false);
  };

  const getPhaseColor = (phase) => {
    if (phase?.includes("I")) return "bg-blue-100 text-blue-800";
    if (phase?.includes("II")) return "bg-purple-100 text-purple-800";
    if (phase?.includes("III")) return "bg-green-100 text-green-800";
    return "bg-neutral-100 text-neutral-800";
  };

  const getStatusColor = (status) => {
    const lower = status?.toLowerCase();
    if (lower === "recruiting") return "bg-green-100 text-green-800";
    if (lower === "active") return "bg-blue-100 text-blue-800";
    return "bg-neutral-100 text-neutral-800";
  };

  const getRelevanceColor = (relevance) => {
    const lower = relevance?.toLowerCase();
    if (lower === "high") return "bg-green-100 text-green-800";
    if (lower === "moderate") return "bg-amber-100 text-amber-800";
    return "bg-neutral-100 text-neutral-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 pb-6">
      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Beaker className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Clinical Trials Matcher</h1>
            <p className="text-emerald-100 text-sm">AI-powered trial discovery</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* User Profile Summary */}
        {userProfile && (
          <Card className="border-none shadow-lg bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-emerald-600" />
                <div className="flex-1">
                  <p className="text-sm text-neutral-600 mb-1">Your Profile</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {userProfile.specialty}
                    </Badge>
                    <Badge variant="secondary">
                      <MapPin className="w-3 h-3 mr-1" />
                      {userProfile.country}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Box */}
        <Card className="border-none shadow-xl">
          <CardContent className="p-4">
            <Input
              placeholder="Search clinical trials (e.g., 'immunotherapy trials for melanoma' or 'pediatric diabetes trials')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchTrials()}
              className="h-12 text-base mb-3"
            />
            <Button
              onClick={searchTrials}
              disabled={!query.trim() || isSearching}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              size="lg"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Searching Trials...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Find Matching Trials
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Search Results */}
        {trials && (
          <>
            {/* Summary */}
            <Card className="border-none shadow-lg bg-blue-50">
              <CardContent className="p-4">
                <p className="text-sm text-blue-900 leading-relaxed">
                  {trials.search_summary}
                </p>
              </CardContent>
            </Card>

            {/* Matched Trials */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-neutral-800">
                {trials.matched_trials?.length} Matching Trials
              </h3>

              {trials.matched_trials?.map((trial, idx) => (
                <Card key={idx} className="border-none shadow-lg hover:shadow-xl transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <CardTitle className="text-base mb-2">{trial.title}</CardTitle>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={getPhaseColor(trial.phase)}>
                            {trial.phase}
                          </Badge>
                          <Badge className={getStatusColor(trial.status)}>
                            {trial.status}
                          </Badge>
                          <Badge className={getRelevanceColor(trial.relevance_score)}>
                            {trial.relevance_score} relevance
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-700 mb-1">Condition:</p>
                      <p className="text-sm text-neutral-900">{trial.condition}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-neutral-700 mb-1">Intervention:</p>
                      <p className="text-sm text-neutral-900">{trial.intervention}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-neutral-700 mb-1">Primary Outcome:</p>
                      <p className="text-sm text-neutral-900">{trial.primary_outcome}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-200">
                      <div>
                        <p className="text-xs font-semibold text-neutral-600 mb-1">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          Location
                        </p>
                        <p className="text-sm text-neutral-800">{trial.location}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-neutral-600 mb-1">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Start Date
                        </p>
                        <p className="text-sm text-neutral-800">{trial.start_date}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-neutral-200">
                      <p className="text-sm font-semibold text-neutral-700 mb-1">Eligibility Summary:</p>
                      <p className="text-sm text-neutral-800">{trial.eligibility_summary}</p>
                    </div>

                    <div className="pt-3 border-t border-neutral-200 bg-emerald-50 -m-4 p-4 rounded-b-lg">
                      <p className="text-xs font-semibold text-emerald-900 mb-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Why This Trial Matches
                      </p>
                      <p className="text-sm text-emerald-800 leading-relaxed">
                        {trial.why_relevant}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
                      <div>
                        <p className="text-xs text-neutral-500">
                          <strong>Sponsor:</strong> {trial.sponsor}
                        </p>
                        {trial.trial_id && (
                          <p className="text-xs text-neutral-500 mt-1">
                            <strong>ID:</strong> {trial.trial_id}
                          </p>
                        )}
                      </div>
                      {trial.contact_info && (
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Contact
                        </Button>
                      )}
                    </div>

                    {trial.contact_info && (
                      <div className="text-xs text-neutral-600 p-2 bg-neutral-50 rounded">
                        <strong>Contact:</strong> {trial.contact_info}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Additional Insights */}
            {trials.regional_availability && (
              <Card className="border-none shadow-lg bg-purple-50">
                <CardHeader>
                  <CardTitle className="text-base text-purple-900">
                    Regional Availability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-purple-800 leading-relaxed">
                    {trials.regional_availability}
                  </p>
                </CardContent>
              </Card>
            )}

            {trials.specialty_specific_trials && (
              <Card className="border-none shadow-lg bg-indigo-50">
                <CardHeader>
                  <CardTitle className="text-base text-indigo-900">
                    Specialty-Specific Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-indigo-800 leading-relaxed">
                    {trials.specialty_specific_trials}
                  </p>
                </CardContent>
              </Card>
            )}

            {trials.patient_referral_considerations && (
              <Card className="border-none shadow-lg bg-green-50">
                <CardHeader>
                  <CardTitle className="text-base text-green-900 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Patient Referral Guidance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-800 leading-relaxed">
                    {trials.patient_referral_considerations}
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Example Searches */}
        {!trials && (
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-base">Example Searches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                "CAR-T trials for lymphoma",
                "Novel immunotherapy for melanoma",
                "Pediatric diabetes device trials",
                "Heart failure regenerative medicine",
                "Alzheimer's disease prevention trials"
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setQuery(example)}
                  className="w-full text-left p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg text-sm text-neutral-700 transition-all"
                >
                  {example}
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Disclaimer */}
        <Card className="border-none bg-amber-50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Beaker className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">
                  Clinical Trial Information
                </p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  AI-generated trial matches are for informational purposes. Always verify 
                  trial details, eligibility criteria, and contact information at ClinicalTrials.gov 
                  or official trial registries. Consult with trial coordinators for accurate enrollment information.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}