import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Home, 
  Search, 
  FileText, 
  Calculator, 
  User,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import CareDroidAssistantIcon from '@/components/CareDroidAssistantIcon';

const NavMobile = () => {
  const location = useLocation();
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiSubmitting, setAiSubmitting] = useState(false);

  const navigationItems = [
    { 
      icon: Home, 
      label: 'Home', 
      path: '/home',
      tooltip: 'Dashboard & Overview'
    },
    { 
      icon: Search, 
      label: 'Search', 
      path: '/search',
      tooltip: 'Search Medical Database'
    },
    { 
      icon: FileText, 
      label: 'Protocols', 
      path: '/protocols',
      tooltip: 'Clinical Protocols'
    },
    { 
      icon: Calculator, 
      label: 'Calc', 
      path: '/calculators',
      tooltip: 'Medical Calculators'
    },
    { 
      icon: User, 
      label: 'Profile', 
      path: '/profile',
      tooltip: 'Your Profile & Settings'
    }
  ];

  const handleAISubmit = (e) => {
    e.preventDefault();
    if (aiSubmitting || !aiQuery.trim()) return;
    setAiSubmitting(true);
    
    // In real app, this would send to AI service
    console.log('AI Query:', aiQuery);
    
    // Navigate to AI page with query
    window.location.href = `/AlgorithmAI?q=${encodeURIComponent(aiQuery)}`;
    setShowAIModal(false);
    setAiQuery('');
    setAiSubmitting(false);
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-700 shadow-2xl safe-area-bottom"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="relative flex items-center justify-between px-4 py-2 max-w-screen-xl mx-auto">
          {/* Left Navigation Items */}
          <div className="flex items-center justify-start flex-1">
            {navigationItems.slice(0, 2).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    group relative flex flex-col items-center justify-center 
                    py-2 px-4 rounded-2xl min-w-[60px] min-h-[56px]
                    transition-all duration-300 ease-out
                    ${isActive 
                      ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 scale-105' 
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95'
                    }
                  `}
                  aria-label={item.tooltip}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" />
                  )}
                  
                  <Icon 
                    className={`
                      w-6 h-6 mb-1 transition-all duration-300
                      ${isActive 
                        ? 'text-blue-600 dark:text-blue-400 stroke-[2.5] scale-110' 
                        : 'text-neutral-600 dark:text-neutral-400 stroke-[2] group-hover:text-blue-500 dark:group-hover:text-blue-400'
                      }
                    `}
                    aria-hidden="true"
                  />
                  
                  <span 
                    className={`
                      text-[10px] font-medium tracking-wide transition-all duration-300
                      ${isActive 
                        ? 'text-blue-700 dark:text-blue-300 font-semibold' 
                        : 'text-neutral-600 dark:text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                      }
                    `}
                  >
                    {item.label}
                  </span>

                  {/* Tooltip for larger screens */}
                  <span className="absolute bottom-full mb-2 hidden sm:group-hover:block px-3 py-1 bg-neutral-900 dark:bg-neutral-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    {item.tooltip}
                    <span className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-neutral-900 dark:border-t-neutral-800" />
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Centered AI Assistant Button (transparent, background-free) */}
          <div className="relative mx-2 flex items-center justify-center">
            <button
              onClick={() => setShowAIModal(true)}
              className="group inline-flex items-center justify-center p-2 focus:outline-none"
              aria-label="Ask CareDroid AI Assistant"
            >
              <CareDroidAssistantIcon
                background={true}
                tone="provided"
                className="w-8 h-8 opacity-90 transition-opacity duration-200 group-hover:opacity-100 active:opacity-100 drop-shadow-sm"
                aria-hidden="true"
              />
            </button>
          </div>

          {/* Right Navigation Items */}
          <div className="flex items-center justify-end flex-1">
            {navigationItems.slice(3, 5).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    group relative flex flex-col items-center justify-center 
                    py-2 px-4 rounded-2xl min-w-[60px] min-h-[56px]
                    transition-all duration-300 ease-out
                    ${isActive 
                      ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 scale-105' 
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95'
                    }
                  `}
                  aria-label={item.tooltip}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" />
                  )}
                  
                  <Icon 
                    className={`
                      w-6 h-6 mb-1 transition-all duration-300
                      ${isActive 
                        ? 'text-blue-600 dark:text-blue-400 stroke-[2.5] scale-110' 
                        : 'text-neutral-600 dark:text-neutral-400 stroke-[2] group-hover:text-blue-500 dark:group-hover:text-blue-400'
                      }
                    `}
                    aria-hidden="true"
                  />
                  
                  <span 
                    className={`
                      text-[10px] font-medium tracking-wide transition-all duration-300
                      ${isActive 
                        ? 'text-blue-700 dark:text-blue-300 font-semibold' 
                        : 'text-neutral-600 dark:text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                      }
                    `}
                  >
                    {item.label}
                  </span>

                  {/* Tooltip for larger screens */}
                  <span className="absolute bottom-full mb-2 hidden sm:group-hover:block px-3 py-1 bg-neutral-900 dark:bg-neutral-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    {item.tooltip}
                    <span className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-neutral-900 dark:border-t-neutral-800" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* AI Query Modal */}
      {showAIModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowAIModal(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg transform animate-slide-up border border-neutral-200 dark:border-neutral-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <CareDroidAssistantIcon background={true} className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">CareDroid AI Assistant</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Ask anything about clinical practice</p>
                </div>
              </div>
              <button
                onClick={() => setShowAIModal(false)}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleAISubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="ai-query" className="block text-sm font-medium text-neutral-700 mb-2">
                    What would you like to know?
                  </label>
                  <textarea
                    id="ai-query"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="E.g., What's the treatment protocol for acute MI?"
                    className="w-full h-32 px-4 py-3 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none resize-none text-base transition-colors bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400"
                    autoFocus
                  />
                </div>

                {/* Quick Suggestions */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Quick suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'STEMI protocol',
                      'Drug interactions',
                      'Sepsis guidelines',
                      'Stroke assessment'
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setAiQuery(suggestion)}
                        className="px-3 py-1.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-full transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={!aiQuery.trim()}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <CareDroidAssistantIcon background={true} className="w-5 h-5 mr-2" />
                  Ask CareDroid Assistant
                </Button>
              </div>

              {/* Disclaimer */}
              <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400 text-center leading-relaxed">
                AI responses are for educational purposes only. Always verify critical clinical decisions with current guidelines and senior colleagues.
              </p>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(100px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
        
        /* Ensure nav doesn't interfere with content */
        body {
          padding-bottom: calc(80px + env(safe-area-inset-bottom));
        }
      `}</style>
    </>
  );
};

export default NavMobile;
