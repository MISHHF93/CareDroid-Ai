import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

function RequireVerification({ children }) {
  const location = useLocation();

  // Check verification status synchronously
  const mockUser = localStorage.getItem('careDroid_mockUser');
  
  if (!mockUser) {
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }

  const user = JSON.parse(mockUser);
  
  if (!user.verified) {
    return <Navigate to="/setup-2fa" state={{ from: location }} replace />;
  }

  return children;
}

RequireVerification.propTypes = {
  children: PropTypes.node.isRequired,
};

export default RequireVerification;
