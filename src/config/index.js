// Environment configuration
const config = {
  app: {
    name: import.meta.env.VITE_APP_NAME || 'CareDroid Clinical Companion',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    env: import.meta.env.VITE_ENV || 'development',
  },
  
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  },
  
  auth: {
    tokenKey: import.meta.env.VITE_AUTH_TOKEN_KEY || 'careDroid_auth_token',
    refreshKey: import.meta.env.VITE_AUTH_REFRESH_KEY || 'careDroid_refresh_token',
    sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '3600000'),
  },
  
  oauth: {
    google: {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    },
    linkedin: {
      clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID,
    },
  },
  
  features: {
    enable2FA: import.meta.env.VITE_ENABLE_2FA === 'true',
    enableInstitutionalVerification: import.meta.env.VITE_ENABLE_INSTITUTIONAL_VERIFICATION === 'true',
    enableOfflineMode: import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true',
  },
  
  network: {
    host: import.meta.env.VITE_NETWORK_HOST || '0.0.0.0',
    port: parseInt(import.meta.env.VITE_NETWORK_PORT || '5174'),
  },
};

export default config;
