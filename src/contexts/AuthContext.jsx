import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { authService, sessionService } from '@/services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Handle logout (used by session timeout) - moved before useEffect
  const handleLogout = useCallback(() => {
    authService.logout();
    sessionService.endSession();
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login', { replace: true, state: { sessionExpired: true } });
  }, [navigate]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = () => {
      try {
        const currentUser = authService.getCurrentUser();
        const hasValidToken = authService.isAuthenticated();
        const hasValidSession = sessionService.isSessionValid();

        if (currentUser && hasValidToken && hasValidSession) {
          setUser(currentUser);
          setIsAuthenticated(true);
          sessionService.extendSession();
        } else {
          // Clear invalid session
          authService.logout();
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Session timeout checker
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      if (!sessionService.isSessionValid()) {
        handleLogout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isAuthenticated, handleLogout]);

  // Login with email
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      const { user: userData } = await authService.login(email, password);
      
      setUser(userData);
      setIsAuthenticated(true);
      sessionService.startSession();
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // OAuth login
  const oauthLogin = useCallback(async (provider) => {
    try {
      setLoading(true);
      const { user: userData } = await authService.oauthLogin(provider);
      
      setUser(userData);
      setIsAuthenticated(true);
      sessionService.startSession();
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('OAuth login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Guest login
  const guestLogin = useCallback(async () => {
    try {
      setLoading(true);
      const { user: userData } = await authService.guestLogin();
      
      setUser(userData);
      setIsAuthenticated(true);
      sessionService.startSession();
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Guest login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await authService.logout();
      sessionService.endSession();
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [navigate]);

  // Update user profile
  const updateUser = useCallback(async (updates) => {
    try {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('careDroid_mockUser', JSON.stringify(updatedUser));
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  // Extend session on activity
  const extendSession = useCallback(() => {
    if (isAuthenticated) {
      sessionService.extendSession();
    }
  }, [isAuthenticated]);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    oauthLogin,
    guestLogin,
    logout,
    updateUser,
    extendSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext;
