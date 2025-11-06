import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search as SearchIcon, 
  Mic, 
  Loader2, 
  Sparkles, 
  AlertTriangle,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { authService, entities, aiService } from "../utils/services";

export default function Search() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    loadUserRole();
    checkDisclaimer();
  }, []);

  const loadUserRole = async () => {
    try {
      const user = await authService.me();
      setUserRole(user.user_role || "attending_physician");
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const checkDisclaimer = async () => {
    try {
      const user = await authService.me();
      if (user.ai_consent_given) {
        setShowDisclaimer(false);
      }
    } catch (error) {
      console.error("Error checking consent:", error);
    }
  };

  const acceptDisclaimer = async () => {
    try {
      await authService.updateMe({
        ai_consent_given: true,
        last_disclaimer_shown: new Date().toISOString()
      });
      setShowDisclaimer(false);
    } catch (error) {
      console.error("Error updating consent:", error);
    }
  };

  const handleSearch = async () => {
    if (isSearching) return; // guard against double-trigger
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const prompt = `You are CareDroid, a clinical AI assistant helping healthcare professionals.

Clinical Question: ${query}

Provide a comprehensive, evidence-based response that includes:
1. Direct answer to the question
2. Key clinical considerations
3. Evidence level/guideline references when applicable
4. Important contraindications or warnings if relevant

Keep responses clear, actionable, and focused on clinical utility.`;

      const response = await aiService.invokeLLM({ prompt });

      const result = {
        query,
        answer: response,
        timestamp: new Date().toISOString(),
        role: userRole
      };

      setCurrentResult(result);

      // Auto-save to history
      entities.SavedQuery?.create?.({
        query_text: query,
        ai_response: response,
        query_type: "clinical_question",
        confidence_level: "high",
        is_favorited: false
      });

      // Log the search
      const user = await authService.me();
      entities.AuditLog?.create?.({
        action_type: "search_query",
        resource_accessed: query,
        user_email: user.email,
        user_role: userRole || "attending",
        search_query: query,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Search error:", error);
      setCurrentResult({
        query,
        answer: "An error occurred while processing your search. Please try again.",
        timestamp: new Date().toISOString(),
        error: true
      });
    }
    setIsSearching(false);
  };

  const startVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } else {
      alert("Voice recognition is not supported in this browser.");
    }
  };

  if (showDisclaimer) {
    return (
      <div className="min-h-full bg-neutral-50 pb-6 flex items-center justify-center p-4">
        <Card className="max-w-2xl border-none shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <AlertTriangle className="w-10 h-10 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                Important: AI Clinical Assistant Disclaimer
              </h2>
            </div>

            <div className="space-y-4 text-sm text-neutral-700 leading-relaxed">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-amber-900 mb-2">⚠️ Not a Substitute for Professional Judgment</h3>
                <p>
                  CareDroid is a <strong>clinical reference tool</strong> that provides evidence-based 
                  information to support healthcare decision-making. It is NOT a medical device and 
                  does NOT provide diagnoses, treatment decisions, or medical advice.
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">✓ Your Responsibilities</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Always verify information with authoritative sources</li>
                  <li>Follow your institution's protocols and local guidelines</li>
                  <li>Use your clinical judgment and expertise</li>
                  <li>Consult specialists when appropriate</li>
                  <li>Never enter patient identifiers (names, MRNs, dates of birth)</li>
                </ul>
              </div>
            </div>

            <div className="mt-6">
              <Button
                onClick={acceptDisclaimer}
                className="w-full h-12"
                size="lg"
              >
                I Understand and Accept
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-neutral-50 pb-6">
      <div className="bg-gradient-to-br from-green-500 to-green-600 px-6 py-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Ask CareDroid</h1>
            <p className="text-green-100 text-sm">AI-powered clinical assistant</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <Card className="shadow-lg border-none">
          <CardContent className="p-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-4 w-5 h-5 text-neutral-400" />
              <Textarea
                placeholder="Ask any clinical question... (e.g., 'What are the diagnostic criteria for sepsis?')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                className="pl-10 pr-12 min-h-[60px] text-base resize-none"
                rows={3}
              />
              <button
                onClick={startVoiceSearch}
                disabled={isListening}
                className={`absolute right-3 top-4 p-2 rounded-full transition-colors ${
                  isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-neutral-100 text-neutral-400'
                }`}
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 mt-3">
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !query.trim()}
                className="flex-1 h-11 bg-green-600 hover:bg-green-700"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Ask CareDroid
                  </>
                )}
              </Button>
            </div>

            {isListening && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg text-center">
                <p className="text-sm text-red-700 font-medium">
                  🎤 Listening... Speak your question
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {currentResult && (
        <div className="px-4 mt-4">
          <Card className="border-none shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start gap-2 mb-3">
                <Badge variant="secondary" className="text-xs">AI Response</Badge>
                <Badge variant="outline" className="text-xs">
                  {userRole?.replace(/_/g, ' ')}
                </Badge>
                <span className="text-xs text-neutral-500 ml-auto">
                  {new Date(currentResult.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <h3 className="font-semibold text-lg text-neutral-900 mb-4">
                {currentResult.query}
              </h3>

              <div className="prose prose-sm max-w-none mb-4">
                <div className="text-neutral-700 leading-relaxed whitespace-pre-line">
                  {currentResult.answer}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-neutral-200">
                <Button variant="outline" size="sm">
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Helpful
                </Button>
                <Button variant="outline" size="sm">
                  <ThumbsDown className="w-4 h-4 mr-1" />
                  Not Helpful
                </Button>
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-200">
                <div className="flex gap-2 items-start">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    <strong>Clinical Reminder:</strong> This AI-generated response is for reference only. 
                    Always verify critical information and use clinical judgment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!currentResult && (
        <div className="px-4 mt-6">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3 uppercase tracking-wide">
            Example Clinical Questions
          </h3>
          <div className="space-y-2">
            {[
              "What are the diagnostic criteria for acute coronary syndrome?",
              "Drug-drug interaction: warfarin and amoxicillin",
              "Latest sepsis management guidelines"
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setQuery(suggestion)}
                className="w-full text-left p-3 bg-white rounded-lg border hover:border-green-500 hover:shadow-md transition-all"
              >
                <p className="text-sm text-neutral-700">{suggestion}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}