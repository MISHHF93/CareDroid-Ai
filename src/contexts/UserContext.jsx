import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * User Context for managing authentication and role-based access
 * 
 * Provides user information and role-based permission checking
 * throughout the application.
 */

const AUTH_TOKEN_KEY = 'caredroid_access_token';
const USER_PROFILE_KEY = 'caredroid_user_profile';

// Permission enum (matches backend)
export const Permission = {
  // PHI Data Access
  READ_PHI: 'READ_PHI',
  WRITE_PHI: 'WRITE_PHI',
  EXPORT_PHI: 'EXPORT_PHI',
  DELETE_PHI: 'DELETE_PHI',

  // Clinical Tools
  USE_CALCULATORS: 'USE_CALCULATORS',
  USE_DRUG_CHECKER: 'USE_DRUG_CHECKER',
  USE_LAB_INTERPRETER: 'USE_LAB_INTERPRETER',
  USE_PROTOCOLS: 'USE_PROTOCOLS',
  USE_AI_CHAT: 'USE_AI_CHAT',

  // User Management
  MANAGE_USERS: 'MANAGE_USERS',
  MANAGE_ROLES: 'MANAGE_ROLES',
  VIEW_USERS: 'VIEW_USERS',

  // Audit & Compliance
  VIEW_AUDIT_LOGS: 'VIEW_AUDIT_LOGS',
  EXPORT_AUDIT_LOGS: 'EXPORT_AUDIT_LOGS',
  VERIFY_AUDIT_INTEGRITY: 'VERIFY_AUDIT_INTEGRITY',

  // System Administration
  CONFIGURE_SYSTEM: 'CONFIGURE_SYSTEM',
  MANAGE_ENCRYPTION: 'MANAGE_ENCRYPTION',
  MANAGE_SUBSCRIPTIONS: 'MANAGE_SUBSCRIPTIONS',
  VIEW_ANALYTICS: 'VIEW_ANALYTICS',

  // Emergency & Safety
  TRIGGER_EMERGENCY_PROTOCOL: 'TRIGGER_EMERGENCY_PROTOCOL',
  OVERRIDE_SAFETY_CHECKS: 'OVERRIDE_SAFETY_CHECKS',

  // Two-Factor Authentication
  ENFORCE_MFA: 'ENFORCE_MFA',
  MANAGE_MFA: 'MANAGE_MFA',
};

// Role permissions mapping (matches backend config)
const RolePermissions = {
  student: [
    Permission.USE_CALCULATORS,
    Permission.USE_DRUG_CHECKER,
    Permission.USE_LAB_INTERPRETER,
    Permission.USE_PROTOCOLS,
    Permission.USE_AI_CHAT,
  ],
  nurse: [
    Permission.READ_PHI,
    Permission.WRITE_PHI,
    Permission.USE_CALCULATORS,
    Permission.USE_DRUG_CHECKER,
    Permission.USE_LAB_INTERPRETER,
    Permission.USE_PROTOCOLS,
    Permission.USE_AI_CHAT,
    Permission.TRIGGER_EMERGENCY_PROTOCOL,
  ],
  physician: [
    Permission.READ_PHI,
    Permission.WRITE_PHI,
    Permission.EXPORT_PHI,
    Permission.DELETE_PHI,
    Permission.USE_CALCULATORS,
    Permission.USE_DRUG_CHECKER,
    Permission.USE_LAB_INTERPRETER,
    Permission.USE_PROTOCOLS,
    Permission.USE_AI_CHAT,
    Permission.TRIGGER_EMERGENCY_PROTOCOL,
    Permission.OVERRIDE_SAFETY_CHECKS,
    Permission.VIEW_AUDIT_LOGS,
  ],
  admin: Object.values(Permission), // Admin has all permissions
};

const UserContext = createContext({
  user: null,
  authToken: '',
  isAuthenticated: false,
  isLoading: true,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  setUser: () => {},
  setAuthToken: () => {},
  signOut: () => {},
});

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [authToken, setAuthTokenState] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedProfile = localStorage.getItem(USER_PROFILE_KEY);

    if (storedToken && storedProfile) {
      try {
        const profile = JSON.parse(storedProfile);
        setAuthTokenState(storedToken);
        setUserState(profile);
      } catch (error) {
        console.error('Failed to parse stored user profile:', error);
        localStorage.removeItem(USER_PROFILE_KEY);
      }
    }

    setIsLoading(false);
  }, []);

  // Fetch user profile when token changes
  useEffect(() => {
    if (!authToken || user) return;

    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const profile = await response.json();
          setUserState(profile);
          localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [authToken, user]);

  const setUser = (newUser) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(USER_PROFILE_KEY);
    }
  };

  const setAuthToken = (token) => {
    setAuthTokenState(token);
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  };

  const signOut = () => {
    setUserState(null);
    setAuthTokenState('');
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
  };

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission) => {
    if (!user || !user.role) return false;
    const rolePermissions = RolePermissions[user.role] || [];
    return rolePermissions.includes(permission);
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (permissions) => {
    if (!user || !user.role) return false;
    const rolePermissions = RolePermissions[user.role] || [];
    return permissions.some((permission) => rolePermissions.includes(permission));
  };

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = (permissions) => {
    if (!user || !user.role) return false;
    const rolePermissions = RolePermissions[user.role] || [];
    return permissions.every((permission) => rolePermissions.includes(permission));
  };

  const isAuthenticated = Boolean(authToken && user);

  const value = {
    user,
    authToken,
    isAuthenticated,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    setUser,
    setAuthToken,
    signOut,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserContext;
