import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sparkles, 
  Shield, 
  Zap, 
  CheckCircle,
  ArrowRight,
  Globe,
  Building2,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  UserCircle
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [authProvider, setAuthProvider] = useState(null);

  // Email validation for institutional domains
  const validateInstitutionalEmail = (email) => {
    const institutionalDomains = ['.edu', '.gov', '.org', 'hospital', 'health', 'medical', 'clinic'];
    return institutionalDomains.some(domain => email.toLowerCase().includes(domain));
  };

  const handleEmailContinue = async () => {
    if (isLoading) return;
    setError("");
    
    if (!email.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setAuthProvider('email');

    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const isInstitutional = validateInstitutionalEmail(email);
    
    localStorage.setItem('careDroid_mockUser', JSON.stringify({
      email: email,
      name: email.split('@')[0],
      verified: isInstitutional,
      subscriptionTier: isInstitutional ? 'INSTITUTIONAL' : 'FREE',
      trustScore: isInstitutional ? 95 : 50,
      provider: 'email',
      isInstitutional
    }));
    localStorage.setItem('accessToken', 'mock-email-token-' + Date.now());
    
    setSuccess(true);
    
    // Redirect after success animation
    setTimeout(() => {
      if (isInstitutional) {
        navigate(createPageUrl("Home"));
      } else {
        navigate(createPageUrl("Onboarding"));
      }
    }, 800);
  };

  const handleOAuthLogin = async (provider) => {
    if (isLoading) return;
    setError("");
    setIsLoading(true);
    setAuthProvider(provider);

    // Simulate OAuth flow
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    localStorage.setItem('careDroid_mockUser', JSON.stringify({
      email: `user@${provider}.com`,
      name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
      verified: true,
      subscriptionTier: 'PRO',
      trustScore: 90,
      provider: provider
    }));
    localStorage.setItem('accessToken', `mock-${provider}-token-` + Date.now());
    
    setSuccess(true);
    setTimeout(() => navigate(createPageUrl("Home")), 800);
  };

  const handleGuestLogin = async () => {
    if (isLoading) return;
    setError("");
    setIsLoading(true);
    setAuthProvider('guest');

    await new Promise(resolve => setTimeout(resolve, 800));
    
    localStorage.setItem('careDroid_mockUser', JSON.stringify({
      email: 'guest@caredroid.demo',
      name: 'Guest User',
      verified: true,
      subscriptionTier: 'PRO',
      trustScore: 100,
      provider: 'guest'
    }));
    localStorage.setItem('accessToken', 'mock-guest-token-' + Date.now());
    
    setSuccess(true);
    setTimeout(() => navigate(createPageUrl("Home")), 800);
  };

  const getLoadingText = () => {
    if (authProvider === 'email') return 'Verifying email...';
    if (authProvider === 'google') return 'Connecting to Google...';
    if (authProvider === 'linkedin') return 'Connecting to LinkedIn...';
    if (authProvider === 'guest') return 'Preparing guest access...';
    return 'Authenticating...';
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-scale-in">
            <CheckCircle className="w-14 h-14 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Authentication Successful!</h2>
          <p className="text-neutral-600">Redirecting to your dashboard...</p>
          <div className="mt-6">
            <Loader2 className="w-6 h-6 mx-auto animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8 animate-slide-down">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2 tracking-tight">CareDroid</h1>
          <p className="text-neutral-600 text-lg mb-3">AI-Powered Clinical Intelligence</p>
          
          {/* Compliance Badges */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs px-3 py-1 bg-white/80 backdrop-blur-sm">
              <Shield className="w-3 h-3 mr-1" />
              HIPAA Compliant
            </Badge>
            <Badge variant="secondary" className="text-xs px-3 py-1 bg-white/80 backdrop-blur-sm">
              <CheckCircle className="w-3 h-3 mr-1" />
              ISO 27001
            </Badge>
            <Badge variant="secondary" className="text-xs px-3 py-1 bg-white/80 backdrop-blur-sm">
              <Lock className="w-3 h-3 mr-1" />
              End-to-End Encrypted
            </Badge>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-none shadow-2xl animate-slide-up hover:shadow-3xl transition-shadow duration-300">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-neutral-900">
                Sign In
              </h2>
              <UserCircle className="w-8 h-8 text-neutral-400" />
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-4 animate-shake">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Quick Access - Guest Login */}
            <Button
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full h-14 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] mb-4"
            >
              {isLoading && authProvider === 'guest' ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {getLoadingText()}
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Continue as Guest (Full Access)
                </>
              )}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-neutral-500 font-medium">Or sign in with</span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <Button
                onClick={() => handleOAuthLogin('google')}
                disabled={isLoading}
                variant="outline"
                className="w-full h-12 text-base font-medium border-2 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-200"
              >
                {isLoading && authProvider === 'google' ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {getLoadingText()}
                  </>
                ) : (
                  <>
                    <Globe className="w-5 h-5 mr-2 text-blue-600" />
                    Continue with Google
                  </>
                )}
              </Button>

              <Button
                onClick={() => handleOAuthLogin('linkedin')}
                disabled={isLoading}
                variant="outline"
                className="w-full h-12 text-base font-medium border-2 hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-200"
              >
                {isLoading && authProvider === 'linkedin' ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {getLoadingText()}
                  </>
                ) : (
                  <>
                    <Building2 className="w-5 h-5 mr-2 text-blue-700" />
                    Continue with LinkedIn
                  </>
                )}
              </Button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-neutral-500 font-medium">Institutional email</span>
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <Input
                  type="email"
                  placeholder="your.name@hospital.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailContinue()}
                  disabled={isLoading}
                  className="h-12 pl-10 text-base border-2 focus:border-blue-500 transition-all duration-200"
                  aria-label="Email address"
                />
              </div>
              
              <Button
                onClick={handleEmailContinue}
                disabled={!email.includes('@') || isLoading}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                {isLoading && authProvider === 'email' ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {getLoadingText()}
                  </>
                ) : (
                  <>
                    Continue with Email
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Institutional Email Recommended
                  </p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Using your @hospital.edu, @health.org, or institutional email grants immediate access to premium features and ensures HIPAA compliance.
                  </p>
                </div>
              </div>
            </div>

            {/* Terms */}
            <p className="text-xs text-neutral-500 text-center mt-6 leading-relaxed">
              By continuing, you agree to CareDroid&apos;s{" "}
              <button className="text-blue-600 hover:underline font-medium">Terms of Service</button>
              {" "}and{" "}
              <button className="text-blue-600 hover:underline font-medium">Privacy Policy</button>.
              All data is encrypted and HIPAA-compliant.
            </p>
          </CardContent>
        </Card>

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center animate-slide-up">
          <div className="transform hover:scale-105 transition-transform duration-200">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-3 hover:shadow-xl transition-shadow">
              <Sparkles className="w-7 h-7 text-blue-600" />
            </div>
            <p className="text-sm font-semibold text-neutral-800">AI Assistant</p>
            <p className="text-xs text-neutral-500 mt-1">24/7 Clinical Support</p>
          </div>
          <div className="transform hover:scale-105 transition-transform duration-200">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-3 hover:shadow-xl transition-shadow">
              <Shield className="w-7 h-7 text-green-600" />
            </div>
            <p className="text-sm font-semibold text-neutral-800">Secure</p>
            <p className="text-xs text-neutral-500 mt-1">HIPAA & ISO Certified</p>
          </div>
          <div className="transform hover:scale-105 transition-transform duration-200">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-3 hover:shadow-xl transition-shadow">
              <Zap className="w-7 h-7 text-purple-600" />
            </div>
            <p className="text-sm font-semibold text-neutral-800">Fast</p>
            <p className="text-xs text-neutral-500 mt-1">Instant Results</p>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="mt-8 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-neutral-200">
          <p className="text-center text-xs text-neutral-500 leading-relaxed">
            🔒 <span className="font-semibold">Demo Environment:</span> This is a prototype interface. OAuth integrations and payment processing are simulated for demonstration purposes.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-down {
          from { 
            opacity: 0;
            transform: translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scale-in {
          from { 
            transform: scale(0.8);
            opacity: 0;
          }
          to { 
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.6s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out 0.2s both;
        }
        
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
