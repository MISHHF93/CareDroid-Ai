import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import NavMobile from '@/components/NavMobile';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/useMobile';
import OfflineIndicator from '@/components/OfflineIndicator';

// Routes where navigation should be hidden
const PUBLIC_ROUTES = [
  '/',
  '/welcome',
  '/login',
  '/signup',
  '/onboarding',
  '/setup-2fa',
  '/subscription-select',
  '/verify-email',
];

const AppLayout = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

  // Check if current route is a public route
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    location.pathname.toLowerCase() === route || location.pathname === '/'
  );

  // Show navigation only if:
  // 1. User is authenticated
  // 2. Not on a public route
  const showNavigation = isAuthenticated && !isPublicRoute;

  return (
    <div className="min-h-screen bg-neutral-50">
      <OfflineIndicator />
      
      {/* Main Content */}
      <main className={`${showNavigation && isMobile ? 'pb-24' : ''} ${showNavigation ? 'fade-in' : ''}`}>
        {children}
      </main>

      {/* Conditional Navigation */}
      {showNavigation && isMobile && (
        <div className="navigation-fade-in">
          <NavMobile />
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up-fade {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .navigation-fade-in {
          animation: slide-up-fade 0.4s ease-out 0.2s both;
        }
      `}</style>
    </div>
  );
};

AppLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppLayout;
