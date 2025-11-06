import axios from 'axios';
import config from '@/config';

// Create axios instance
const apiClient = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (requestConfig) => {
    const token = localStorage.getItem(config.auth.tokenKey);
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try refresh
      const refreshToken = localStorage.getItem(config.auth.refreshKey);
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${config.api.baseUrl}/auth/refresh`, {
            refreshToken,
          });
          localStorage.setItem(config.auth.tokenKey, data.accessToken);
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(error.config);
        } catch (_refreshError) {
          // Refresh failed, logout
          localStorage.removeItem(config.auth.tokenKey);
          localStorage.removeItem(config.auth.refreshKey);
          localStorage.removeItem('careDroid_mockUser');
          window.location.href = '/login';
        }
      } else {
        // No refresh token, logout
        localStorage.removeItem(config.auth.tokenKey);
        localStorage.removeItem('careDroid_mockUser');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Authentication Service
 */
export const authService = {
  // Email/Password Login
  async login(email, _password) {
    try {
      // Mock implementation - replace with real API call
      const isInstitutional = this.validateInstitutionalEmail(email);
      
      const mockUser = {
        id: Date.now().toString(),
        email,
        name: email.split('@')[0],
        verified: isInstitutional,
        subscriptionTier: isInstitutional ? 'INSTITUTIONAL' : 'FREE',
        trustScore: isInstitutional ? 95 : 50,
        provider: 'email',
        isInstitutional,
        createdAt: new Date().toISOString(),
      };
      
      const mockToken = `mock-email-token-${Date.now()}`;
      const mockRefreshToken = `mock-refresh-token-${Date.now()}`;
      
      localStorage.setItem(config.auth.tokenKey, mockToken);
      localStorage.setItem(config.auth.refreshKey, mockRefreshToken);
      localStorage.setItem('careDroid_mockUser', JSON.stringify(mockUser));
      
      return {
        user: mockUser,
        accessToken: mockToken,
        refreshToken: mockRefreshToken,
      };
    } catch (error) {
      throw new Error('Login failed: ' + error.message);
    }
  },
  
  // OAuth Login (Google/LinkedIn)
  async oauthLogin(provider) {
    try {
      // Mock OAuth implementation
      const mockUser = {
        id: Date.now().toString(),
        email: `user@${provider}.com`,
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        verified: true,
        subscriptionTier: 'PRO',
        trustScore: 90,
        provider,
        createdAt: new Date().toISOString(),
      };
      
      const mockToken = `mock-${provider}-token-${Date.now()}`;
      const mockRefreshToken = `mock-${provider}-refresh-${Date.now()}`;
      
      localStorage.setItem(config.auth.tokenKey, mockToken);
      localStorage.setItem(config.auth.refreshKey, mockRefreshToken);
      localStorage.setItem('careDroid_mockUser', JSON.stringify(mockUser));
      
      return {
        user: mockUser,
        accessToken: mockToken,
        refreshToken: mockRefreshToken,
      };
    } catch (error) {
      throw new Error(`${provider} login failed: ` + error.message);
    }
  },
  
  // Guest Login
  async guestLogin() {
    try {
      const mockUser = {
        id: 'guest-' + Date.now(),
        email: 'guest@caredroid.demo',
        name: 'Guest User',
        verified: true,
        subscriptionTier: 'PRO',
        trustScore: 100,
        provider: 'guest',
        createdAt: new Date().toISOString(),
      };
      
      const mockToken = `mock-guest-token-${Date.now()}`;
      const mockRefreshToken = `mock-guest-refresh-${Date.now()}`;
      
      localStorage.setItem(config.auth.tokenKey, mockToken);
      localStorage.setItem(config.auth.refreshKey, mockRefreshToken);
      localStorage.setItem('careDroid_mockUser', JSON.stringify(mockUser));
      
      return {
        user: mockUser,
        accessToken: mockToken,
        refreshToken: mockRefreshToken,
      };
    } catch (error) {
      throw new Error('Guest login failed: ' + error.message);
    }
  },
  
  // Logout
  async logout() {
    try {
      // In real app, call logout endpoint
      localStorage.removeItem(config.auth.tokenKey);
      localStorage.removeItem(config.auth.refreshKey);
      localStorage.removeItem('careDroid_mockUser');
      return true;
    } catch (error) {
      throw new Error('Logout failed: ' + error.message);
    }
  },
  
  // Get Current User
  getCurrentUser() {
    const userStr = localStorage.getItem('careDroid_mockUser');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem(config.auth.tokenKey);
    const user = this.getCurrentUser();
    return !!(token && user);
  },
  
  // Validate institutional email
  validateInstitutionalEmail(email) {
    const institutionalDomains = ['.edu', '.gov', '.org', 'hospital', 'health', 'medical', 'clinic'];
    return institutionalDomains.some(domain => email.toLowerCase().includes(domain));
  },
  
  // Verify 2FA
  async verify2FA(_code) {
    try {
      // Mock 2FA verification
      const user = this.getCurrentUser();
      if (!user) throw new Error('User not found');
      
      user.verified = true;
      user.twoFactorEnabled = true;
      localStorage.setItem('careDroid_mockUser', JSON.stringify(user));
      
      return { success: true, user };
    } catch (error) {
      throw new Error('2FA verification failed: ' + error.message);
    }
  },
  
  // Refresh token
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem(config.auth.refreshKey);
      if (!refreshToken) throw new Error('No refresh token');
      
      const { data } = await apiClient.post('/auth/refresh', { refreshToken });
      localStorage.setItem(config.auth.tokenKey, data.accessToken);
      
      return data;
    } catch (error) {
      this.logout();
      throw new Error('Token refresh failed: ' + error.message);
    }
  },
};

/**
 * User Service
 */
export const userService = {
  async getProfile() {
    const user = authService.getCurrentUser();
    return user;
  },
  
  async updateProfile(updates) {
    const user = authService.getCurrentUser();
    const updatedUser = { ...user, ...updates };
    localStorage.setItem('careDroid_mockUser', JSON.stringify(updatedUser));
    return updatedUser;
  },
};

/**
 * Session Management
 */
export const sessionService = {
  startSession() {
    const expiresAt = Date.now() + config.auth.sessionTimeout;
    localStorage.setItem('careDroid_sessionExpiry', expiresAt.toString());
  },
  
  isSessionValid() {
    const expiryStr = localStorage.getItem('careDroid_sessionExpiry');
    if (!expiryStr) return false;
    
    const expiry = parseInt(expiryStr);
    return Date.now() < expiry;
  },
  
  extendSession() {
    this.startSession();
  },
  
  endSession() {
    localStorage.removeItem('careDroid_sessionExpiry');
    authService.logout();
  },
};

export default apiClient;
