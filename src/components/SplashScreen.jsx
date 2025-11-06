import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Logo from '@/components/Logo';

/**
 * SplashScreen Component
 * Displays the CareDroid logo with fade-in animation during app initialization
 */
export default function SplashScreen({ onComplete }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Show splash for 1.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Call onComplete after fade-out animation
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 500);
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible && !onComplete) return null;

  return (
    <div 
      className={`
        fixed inset-0 z-[9999] 
        bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
        flex flex-col items-center justify-center
        transition-opacity duration-500
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Logo with animation */}
      <div className="animate-splash-logo">
        <Logo size={120} animate />
      </div>

      {/* App name */}
      <h1 className="mt-8 text-3xl font-bold text-neutral-900 animate-splash-text">
        CareDroid
      </h1>
      
      {/* Tagline */}
      <p className="mt-2 text-neutral-600 text-lg animate-splash-text-delay">
        AI-Powered Clinical Intelligence
      </p>

      {/* Loading indicator */}
      <div className="mt-12 flex gap-2 animate-splash-dots">
        <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>

      <style>{`
        @keyframes splash-logo {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          50% {
            opacity: 1;
            transform: scale(1.05) translateY(0);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes splash-text {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes splash-dots {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-splash-logo {
          animation: splash-logo 0.8s ease-out;
        }

        .animate-splash-text {
          animation: splash-text 0.6s ease-out 0.4s both;
        }

        .animate-splash-text-delay {
          animation: splash-text 0.6s ease-out 0.6s both;
        }

        .animate-splash-dots {
          animation: splash-dots 0.4s ease-out 0.8s both;
        }
      `}</style>
    </div>
  );
}

SplashScreen.propTypes = {
  onComplete: PropTypes.func,
};
