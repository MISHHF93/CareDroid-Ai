import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../services/apiClient';

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
    console.log('\n\n=== 🎬 UserContext INITIALIZATION ===');
    
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedProfile = localStorage.getItem(USER_PROFILE_KEY);

    console.log('📦 localStorage contents:');
    console.log('- Token exists:', !!storedToken);
    console.log('- Token value:', storedToken);
    console.log('- Profile exists:', !!storedProfile);
    if (storedProfile) {
      try {
        console.log('- Profile data:', JSON.parse(storedProfile));
      } catch (e) {
        console.log('- Profile parse error:', e);
      }
    }

    // Load token
    if (storedToken) {
      console.log('✅ Loading token into state');
      setAuthTokenState(storedToken);
    } else {
      console.log('⚠️ No token in localStorage');
    }

    // Load profile
    if (storedProfile) {
      try {
        const profile = JSON.parse(storedProfile);
        console.log('✅ Loading profile into state:', profile);
        setUserState(profile);
      } catch (error) {
        console.error('❌ Failed to parse stored user profile:', error);
        localStorage.removeItem(USER_PROFILE_KEY);
      }
    } else {
      console.log('⚠️ No profile in localStorage');
    }

    setIsLoading(false);
    console.log('✅ UserContext Init Complete\n\n');
  }, []);

  // Fetch user profile when token changes
  useEffect(() => {
    if (!authToken || user) return;

    const fetchUserProfile = async () => {
      try {
        const response = await apiFetch('/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const profile = await response.json();
          setUserState(profile);
          localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
        } else {
          // If profile fetch fails and we're in dev mode, use mock profile
          const storedProfile = localStorage.getItem(USER_PROFILE_KEY);
          if (storedProfile) {
            try {
              const profile = JSON.parse(storedProfile);
              setUserState(profile);
              console.log('Using stored mock profile from localStorage');
            } catch (e) {
              console.error('Failed to parse stored profile');
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // Try to use stored mock profile if backend is unavailable
        const storedProfile = localStorage.getItem(USER_PROFILE_KEY);
        if (storedProfile) {
          try {
            const profile = JSON.parse(storedProfile);
            setUserState(profile);
            console.log('Using stored mock profile (backend unavailable)');
          } catch (e) {
            console.error('Failed to parse stored profile');
          }
        }
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

  // Debug logging for authentication state changes
  useEffect(() => {
    console.log('=== UserContext isAuthenticated changed ===');
    console.log('authToken:', !!authToken);
    console.log('user:', !!user);
    console.log('isAuthenticated:', isAuthenticated);
    if (user) {
      console.log('user details:', { id: user.id, email: user.email, role: user.role });
    }
  }, [isAuthenticated, authToken, user]);

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
