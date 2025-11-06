import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
export const ProtectedRoute = ({ children, requireVerification = false, requireSubscription = false, tier = null }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-600 mb-4" />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check verification requirement
  if (requireVerification && !user?.verified) {
    return <Navigate to="/setup-2fa" state={{ from: location }} replace />;
  }

  // Check subscription requirement
  if (requireSubscription) {
    const TIER_HIERARCHY = {
      FREE: 0,
      PRO: 1,
      INSTITUTIONAL: 2,
    };

    const userTier = user?.subscriptionTier || 'FREE';
    const requiredTier = tier || 'PRO';
    
    const userLevel = TIER_HIERARCHY[userTier] || 0;
    const requiredLevel = TIER_HIERARCHY[requiredTier] || 1;

    if (userLevel < requiredLevel) {
      return <Navigate to="/subscription-select" state={{ from: location, requiredTier }} replace />;
    }
  }

  // User is authenticated and meets all requirements
  return <>{children}</>;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requireVerification: PropTypes.bool,
  requireSubscription: PropTypes.bool,
  tier: PropTypes.oneOf(['FREE', 'PRO', 'INSTITUTIONAL']),
};

/**
 * Public Route Component
 * Redirects to home if user is already authenticated
 */
export const PublicRoute = ({ children, redirectTo = '/home' }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-600 mb-4" />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to home if already authenticated
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

PublicRoute.propTypes = {
  children: PropTypes.node.isRequired,
  redirectTo: PropTypes.string,
};

export default ProtectedRoute;
