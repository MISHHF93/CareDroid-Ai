import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';

const TIER_HIERARCHY = {
  FREE: 0,
  PRO: 1,
  INSTITUTIONAL: 2,
};

function RequireSubscription({ tier = 'PRO', children }) {
  // Check subscription synchronously
  const mockUser = localStorage.getItem('careDroid_mockUser');
  
  if (!mockUser) {
    return <Navigate to="/Welcome" replace />;
  }

  const user = JSON.parse(mockUser);
  const userTier = user.subscriptionTier || 'FREE';
  const requiredLevel = TIER_HIERARCHY[tier];
  const userLevel = TIER_HIERARCHY[userTier];

  if (userLevel < requiredLevel) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-purple-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
              Premium Feature
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              This feature requires a {tier} subscription or higher.
            </p>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Your current plan: <span className="font-semibold">{userTier}</span>
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                Required plan: <span className="font-semibold">{tier}</span>
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/subscription-select'}
              className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upgrade Now
            </button>
            <button
              onClick={() => window.history.back()}
              className="mt-2 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

RequireSubscription.propTypes = {
  tier: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default RequireSubscription;
