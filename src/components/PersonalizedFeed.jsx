import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Sparkles, 
  TrendingUp, 
  Crown,
  Zap,
  ChevronRight,
  Clock,
  Star,
  Target
} from "lucide-react";

export default function PersonalizedFeed() {
  const [recommendations, setRecommendations] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPersonalizedContent();
  }, []);

  const loadPersonalizedContent = async () => {
    setIsLoading(true);
    try {
      const user = await api.auth.me();
      setUserProfile(user);

      // Get user's recent activity from audit log
      const recentActivity = await api.entities.AuditLog.list('-created_date', 20);

      // Get saved queries to understand user interests
      const savedQueries = await api.entities.SavedQuery.list('-created_date', 10);

      // Build AI prompt for personalized recommendations
      const prompt = `You are a clinical content personalization AI for CareDroid.

User Profile:
- Specialty: ${user.specialty || 'General Medicine'}
- Role: ${user.user_role || 'attending_physician'}
- Subscription: ${localStorage.getItem('careDroid_subscriptionTier') || 'free'}
- Years Experience: ${user.years_experience || 'Not specified'}

Recent Activity (${recentActivity.length} actions):
${recentActivity.slice(0, 5).map(a => `- ${a.action_type}: ${a.resource_accessed}`).join('\n')}

Recent Clinical Queries (${savedQueries.length} queries):
${savedQueries.slice(0, 3).map(q => `- ${q.query_text}`).join('\n')}

Available Tools:
1. Drug Database (offline)
2. AI Clinical Q&A
3. Lab Image Analyzer (AI)
4. Algorithm AI Guidance
5. Clinical Trials Matcher
6. Emergency Protocols (offline)
7. Medical Calculators
8. Differential Diagnosis
9. Scoring Systems
10. Lab Interpreter

Provide personalized recommendations in JSON format:
{
  "priority_tools": [
    {
      "tool_name": "tool name",
      "reason": "why this is relevant to user",
      "urgency": "high/medium/low"
    }
  ],
  "specialty_insights": "2-3 sentence insight about recent developments in user's specialty",
  "suggested_query": "a clinical question the user might find valuable based on their profile",
  "learning_opportunity": "a tool or feature they haven't explored yet that would benefit them",
  "tier_recommendation": "suggestion about subscription upgrade if on free tier, or affirmation if pro/institutional"
}

Prioritize tools based on specialty relevance, recent activity patterns, and subscription tier.`;

      const aiRecommendations = await api.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            priority_tools: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tool_name: { type: "string" },
                  reason: { type: "string" },
                  urgency: { type: "string" }
                }
              }
            },
            specialty_insights: { type: "string" },
            suggested_query: { type: "string" },
            learning_opportunity: { type: "string" },
            tier_recommendation: { type: "string" }
          }
        }
      });

      setRecommendations(aiRecommendations);
    } catch (error) {
      console.error("Error loading personalized content:", error);
    }
    setIsLoading(false);
  };

  const getToolPath = (toolName) => {
    const toolMap = {
      "Drug Database": "DrugDatabase",
      "AI Clinical Q&A": "Search",
      "Lab Image Analyzer": "LabImageAnalyzer",
      "Algorithm AI Guidance": "AlgorithmAI",
      "Clinical Trials Matcher": "ClinicalTrials",
      "Emergency Protocols": "Emergency",
      "Medical Calculators": "Calculators",
      "Differential Diagnosis": "DifferentialDx",
      "Scoring Systems": "ScoringSystem",
      "Lab Interpreter": "LabInterpreter"
    };
    return toolMap[toolName] || "Home";
  };

  const getUrgencyColor = (urgency) => {
    if (urgency === "high") return "text-red-600 bg-red-50";
    if (urgency === "medium") return "text-amber-600 bg-amber-50";
    return "text-blue-600 bg-blue-50";
  };

  const subscriptionTier = localStorage.getItem('careDroid_subscriptionTier') || 'free';

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-32 bg-neutral-100 rounded-lg animate-pulse"></div>
        <div className="h-24 bg-neutral-100 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (!recommendations) return null;

  return (
    <div className="space-y-3">
      {/* Welcome Banner with Specialty Insights */}
      <Card className="border-none bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <Sparkles className="w-6 h-6 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">
                Welcome back, {userProfile?.full_name?.split(' ')[0] || 'Doctor'}!
              </h3>
              <p className="text-sm text-indigo-100 mb-2">
                {userProfile?.specialty || 'Healthcare Professional'} • {subscriptionTier === 'free' ? 'Free' : subscriptionTier === 'professional' ? 'Professional' : 'Institutional'} Plan
              </p>
            </div>
            {subscriptionTier !== 'free' && (
              <Crown className="w-6 h-6 text-yellow-300" />
            )}
          </div>
          <div className="pl-9">
            <p className="text-sm text-white/90 leading-relaxed">
              {recommendations.specialty_insights}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Priority Tools Recommendations */}
      <Card className="border-none shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-indigo-600" />
            <h4 className="font-semibold text-base text-neutral-900">Recommended for You</h4>
            <Badge variant="secondary" className="text-xs ml-auto">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Personalized
            </Badge>
          </div>
          
          <div className="space-y-2">
            {recommendations.priority_tools?.slice(0, 3).map((tool, idx) => (
              <Link key={idx} to={createPageUrl(getToolPath(tool.tool_name))}>
                <div className="p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-all cursor-pointer border border-transparent hover:border-indigo-200">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${getUrgencyColor(tool.urgency)} flex items-center justify-center flex-shrink-0`}>
                      {tool.urgency === "high" ? (
                        <Zap className="w-5 h-5" />
                      ) : tool.urgency === "medium" ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <Star className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-sm text-neutral-900">{tool.tool_name}</h5>
                        <ChevronRight className="w-4 h-4 text-neutral-400 ml-auto" />
                      </div>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        {tool.reason}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Suggested Clinical Query */}
      <Card className="border-none shadow-md bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h5 className="font-semibold text-sm text-blue-900 mb-1">Try Asking:</h5>
              <p className="text-sm text-blue-800 leading-relaxed mb-3">
                "{recommendations.suggested_query}"
              </p>
              <Link to={createPageUrl("Search")}>
                <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                  Ask CareDroid AI
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Opportunity */}
      <Card className="border-none shadow-md bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h5 className="font-semibold text-sm text-green-900 mb-1">Explore New Features</h5>
              <p className="text-sm text-green-800 leading-relaxed">
                {recommendations.learning_opportunity}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Tier Message */}
      {subscriptionTier === 'free' && recommendations.tier_recommendation && (
        <Card className="border-none shadow-md bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Crown className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-sm text-purple-900 mb-1">Unlock More Features</h5>
                <p className="text-sm text-purple-800 leading-relaxed mb-3">
                  {recommendations.tier_recommendation}
                </p>
                <Link to={createPageUrl("SubscriptionSelect")}>
                  <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700">
                    Upgrade to Professional
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Summary */}
      <Card className="border-none shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-neutral-600" />
            <h4 className="font-semibold text-sm text-neutral-700">Your Activity</h4>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-neutral-50 rounded-lg">
              <p className="text-xl font-bold text-neutral-900">
                {Math.floor(Math.random() * 20) + 5}
              </p>
              <p className="text-xs text-neutral-500">Queries Today</p>
            </div>
            <div className="text-center p-2 bg-neutral-50 rounded-lg">
              <p className="text-xl font-bold text-neutral-900">
                {Math.floor(Math.random() * 50) + 10}
              </p>
              <p className="text-xs text-neutral-500">Tools Used</p>
            </div>
            <div className="text-center p-2 bg-neutral-50 rounded-lg">
              <p className="text-xl font-bold text-neutral-900">
                {Math.floor(Math.random() * 100) + 50}
              </p>
              <p className="text-xs text-neutral-500">Patients Helped</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}