import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

function RequireAuth({ children }) {
  const location = useLocation();

  // Check for authentication synchronously
  const token = localStorage.getItem('accessToken');
  const mockUser = localStorage.getItem('careDroid_mockUser');

  // Allow access if we have either a token or mock user
  if (!token && !mockUser) {
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }

  return children;
}

RequireAuth.propTypes = {
  children: PropTypes.node.isRequired,
};

export default RequireAuth;
