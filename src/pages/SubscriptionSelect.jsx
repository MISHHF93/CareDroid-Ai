import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Sparkles, 
  Building2,
  ArrowRight,
  X,
  CreditCard,
  Shield
} from "lucide-react";

export default function SubscriptionSelect() {
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const tiers = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Essential clinical reference tools",
      features: [
        "Basic drug database access",
        "10 AI queries per month",
        "Medical calculators",
        "Lab value references",
        "Offline database cache",
        "Community support"
      ],
      limitations: [
        "Limited AI interactions",
        "No PDF/JSON export",
        "Basic protocol access"
      ],
      color: "from-gray-500 to-gray-600",
      popular: false
    },
    {
      id: "professional",
      name: "Professional",
      price: "$14.99",
      period: "per month",
      description: "Unlimited clinical intelligence for practitioners",
      features: [
        "Unlimited AI clinical queries",
        "Advanced drug interactions",
        "Differential diagnosis builder",
        "Export to PDF & JSON",
        "FHIR/HL7 structured outputs",
        "Sepsis & dose calculators",
        "Voice-first interactions",
        "Priority support",
        "All clinical tools unlocked"
      ],
      limitations: [],
      color: "from-blue-600 to-indigo-600",
      popular: true
    },
    {
      id: "institutional",
      name: "Institutional",
      price: "Custom",
      period: "enterprise pricing",
      description: "Multi-user dashboard with EMR integration",
      features: [
        "Everything in Professional",
        "Multi-user team dashboard",
        "API access & integrations",
        "EMR/EHR sync capabilities",
        "ISO audit trail access",
        "Custom compliance reports",
        "Dedicated account manager",
        "White-label options",
        "24/7 enterprise support"
      ],
      limitations: [],
      color: "from-purple-600 to-pink-600",
      popular: false
    }
  ];

  const handleSelectTier = (tierId) => {
    setSelectedTier(tierId);
    if (tierId === "free") {
      // Free tier - go straight to app
      localStorage.setItem('careDroid_subscriptionTier', 'free');
      navigate(createPageUrl("Home"));
    } else if (tierId === "institutional") {
      // Contact sales
      alert("🏢 Enterprise Sales: Please contact sales@caredroid.ai for institutional pricing");
    } else {
      // Show payment modal
      setShowPaymentModal(true);
    }
  };

  const handlePaymentComplete = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    localStorage.setItem('careDroid_subscriptionTier', selectedTier);
    setShowPaymentModal(false);
    navigate(createPageUrl("Home"));
    setIsProcessing(false);
  };

  if (showPaymentModal) {
    return (
      <div className="min-h-screen bg-black/50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-2xl">
          <CardHeader className="relative">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute right-4 top-4 p-1 hover:bg-neutral-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <CardTitle>Payment (Prototype)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white">
              <p className="text-sm opacity-90 mb-1">You're subscribing to:</p>
              <p className="text-2xl font-bold">Professional Plan</p>
              <p className="text-3xl font-bold mt-2">$14.99<span className="text-sm font-normal">/month</span></p>
            </div>

            <div className="space-y-3">
              <div className="p-4 border rounded-lg flex items-center gap-3 cursor-pointer hover:bg-neutral-50">
                <CreditCard className="w-6 h-6 text-neutral-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Credit / Debit Card</p>
                  <p className="text-xs text-neutral-500">Visa, Mastercard, Amex</p>
                </div>
              </div>

              <div className="p-4 border rounded-lg flex items-center gap-3 cursor-pointer hover:bg-neutral-50">
                <div className="w-6 h-6 bg-black rounded flex items-center justify-center text-white text-xs font-bold">
                  A
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Apple Pay</p>
                  <p className="text-xs text-neutral-500">Fast & secure</p>
                </div>
              </div>

              <div className="p-4 border rounded-lg flex items-center gap-3 cursor-pointer hover:bg-neutral-50">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                  G
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Google Pay</p>
                  <p className="text-xs text-neutral-500">One-tap checkout</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex gap-2">
                <Shield className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-green-800 leading-relaxed">
                  <strong>PCI-DSS Level 1 Certified.</strong> All payments processed securely 
                  through Stripe. Your payment information is encrypted and never stored on our servers.
                </p>
              </div>
            </div>

            <Button
              onClick={handlePaymentComplete}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
              size="lg"
              disabled={isProcessing}
            >
              Complete Subscription (Mock)
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <p className="text-xs text-center text-neutral-500">
              🔒 This is a prototype. No real payment will be processed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-3">
            Choose Your Plan
          </h1>
          <p className="text-neutral-600 text-lg">
            Start with a free account. Upgrade anytime for unlimited access.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {tiers.map((tier) => (
            <Card
              key={tier.id}
              className={`border-none shadow-xl relative ${
                tier.popular ? 'ring-2 ring-blue-500 scale-105' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className={`bg-gradient-to-r ${tier.color} text-white rounded-t-lg pb-8`}>
                <div className="text-center">
                  <p className="text-sm opacity-90 mb-2">{tier.name}</p>
                  <p className="text-4xl font-bold mb-1">{tier.price}</p>
                  <p className="text-sm opacity-90">{tier.period}</p>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <p className="text-sm text-neutral-600 mb-6 min-h-[40px]">
                  {tier.description}
                </p>

                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex gap-2 text-sm">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-neutral-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {tier.limitations.length > 0 && (
                  <ul className="space-y-2 mb-6 pb-6 border-t pt-6">
                    {tier.limitations.map((limitation, idx) => (
                      <li key={idx} className="flex gap-2 text-sm">
                        <X className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                        <span className="text-neutral-500">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <Button
                  onClick={() => handleSelectTier(tier.id)}
                  className={`w-full ${
                    tier.popular
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                      : ''
                  }`}
                  variant={tier.popular ? 'default' : 'outline'}
                  size="lg"
                >
                  {tier.id === "free" ? "Start Free" : tier.id === "institutional" ? "Contact Sales" : "Subscribe Now"}
                  {tier.id === "institutional" ? <Building2 className="w-5 h-5 ml-2" /> : <ArrowRight className="w-5 h-5 ml-2" />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="flex justify-center gap-4 flex-wrap">
          <Badge variant="outline" className="px-4 py-2">
            <Shield className="w-4 h-4 mr-2" />
            HIPAA Compliant
          </Badge>
          <Badge variant="outline" className="px-4 py-2">
            ISO 27001 Certified
          </Badge>
          <Badge variant="outline" className="px-4 py-2">
            GDPR Ready
          </Badge>
          <Badge variant="outline" className="px-4 py-2">
            PCI-DSS Level 1
          </Badge>
        </div>

        <p className="text-center text-xs text-neutral-400 mt-8">
          🔒 This is a prototype interface. Payment integrations are simulated for demonstration purposes.
        </p>
      </div>
    </div>
  );
}