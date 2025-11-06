import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/Logo";
import { 
  Sparkles, 
  Shield, 
  Zap, 
  CheckCircle,
  ArrowRight,
  Globe,
  Building2,
  LogIn
} from "lucide-react";

export default function Welcome() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleContinue = () => {
    // Mock login - in real app, this would authenticate
    localStorage.setItem('careDroid_mockUser', JSON.stringify({
      email: email,
      name: email.split('@')[0],
      verified: false,
      subscriptionTier: 'free',
      trustScore: 0
    }));
    // Set mock access token for auth guard
    localStorage.setItem('accessToken', 'mock-email-token-' + Date.now());
    navigate(createPageUrl("Onboarding"));
  };

  const handleOAuthMock = (provider) => {
    // Mock OAuth - visual only
    localStorage.setItem('careDroid_mockUser', JSON.stringify({
      email: `user@${provider}.com`,
      name: `${provider} User`,
      verified: true,
      subscriptionTier: 'free',
      trustScore: 85,
      provider: provider
    }));
    // Set mock access token for auth guard
    localStorage.setItem('accessToken', 'mock-token-' + Date.now());
    navigate(createPageUrl("Home"));
  };

  const handleGuestLogin = () => {
    // Guest login - full access without email
    localStorage.setItem('careDroid_mockUser', JSON.stringify({
      email: 'guest@caredroid.demo',
      name: 'Guest User',
      verified: true,
      subscriptionTier: 'PRO',
      trustScore: 100,
      provider: 'guest'
    }));
    // Set mock access token for auth guard
    localStorage.setItem('accessToken', 'mock-guest-token-' + Date.now());
    navigate(createPageUrl("Home"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={80} animate />
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">CareDroid</h1>
          <p className="text-neutral-600">AI-Powered Clinical Intelligence</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge variant="secondary" className="text-xs">
              <Shield className="w-3 h-3 mr-1" />
              HIPAA Compliant
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              ISO 27001
            </Badge>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-none shadow-2xl">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">
              Sign in to continue
            </h2>

            {/* OAuth Buttons (Mock) */}
            <div className="space-y-3 mb-4">
              <Button
                onClick={handleGuestLogin}
                className="w-full h-12 text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Zap className="w-5 h-5 mr-2" />
                Continue as Guest (Full Access)
              </Button>

              <Button
                onClick={() => handleOAuthMock('google')}
                variant="outline"
                className="w-full h-12 text-base"
              >
                <Globe className="w-5 h-5 mr-2" />
                Continue with Google
              </Button>

              <Button
                onClick={() => handleOAuthMock('linkedin')}
                variant="outline"
                className="w-full h-12 text-base"
              >
                <Building2 className="w-5 h-5 mr-2" />
                Continue with LinkedIn
              </Button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-neutral-500">Or continue with email</span>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="your.email@hospital.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base"
              />
              
              <Button
                onClick={handleContinue}
                disabled={!email.includes('@')}
                className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Continue with Email
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <p className="text-xs text-neutral-500 text-center mt-4 leading-relaxed">
              By continuing, you agree to CareDroid&apos;s Terms of Service and Privacy Policy. 
              Institutional email verification required for full access.
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-xs font-medium text-neutral-700">AI Assistant</p>
          </div>
          <div>
            <div className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center mx-auto mb-2">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-xs font-medium text-neutral-700">HIPAA Secure</p>
          </div>
          <div>
            <div className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center mx-auto mb-2">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-xs font-medium text-neutral-700">19 Tools</p>
          </div>
        </div>

        <p className="text-center text-xs text-neutral-400 mt-8">
          🔒 This is a prototype interface. OAuth and payment integrations are simulated.
        </p>

        {/* Link to Enhanced Login */}
        <div className="mt-6 text-center">
          <Link 
            to={createPageUrl("Login")}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Try the Enhanced Login Experience
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}