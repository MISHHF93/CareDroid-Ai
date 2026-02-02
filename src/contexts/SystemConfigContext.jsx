/**
 * System Configuration Context
 * Provides system-level configuration to frontend components
 * Manages RAG status, session timeouts, AI usage, subscription, tools
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import configService from '../services/configService';

const SystemConfigContext = createContext();

export function SystemConfigProvider({ children }) {
  const [systemConfig, setSystemConfig] = useState({
    rag: { enabled: false, topK: 5, minScore: 0.7 },
    session: { idleTimeoutMs: 1800000, absoluteTimeoutMs: 28800000 },
  });
  const [aiUsage, setAiUsage] = useState({
    tier: 'free',
    dailyLimit: 10,
    usedToday: 0,
    remaining: 10,
    resetAt: new Date(Date.now() + 86400000).toISOString(),
  });
  const [availableTools, setAvailableTools] = useState([]);
  const [subscription, setSubscription] = useState({
    tier: 'free',
    status: 'active',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSystemConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all system data in parallel with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Config load timeout')), 5000)
      );

      const [config, usage, tools, sub] = await Promise.race([
        Promise.all([
          configService.getSystemConfig(),
          configService.getAIRemainingQueries(),
          configService.getAvailableTools(),
          configService.getCurrentSubscription(),
        ]),
        timeoutPromise,
      ]);

      setSystemConfig(config || systemConfig);
      setAiUsage(usage || aiUsage);
      setAvailableTools(tools || []);
      setSubscription(sub || { tier: 'free', status: 'active' });
    } catch (err) {
      console.warn('⚠️ Failed to load system config (using defaults):', err.message);
      setError(err.message);
      // Keep defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSystemConfig();

    // Refresh AI usage every 5 minutes
    const interval = setInterval(() => {
      configService.getAIRemainingQueries().then(setAiUsage);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadSystemConfig]);

  const value = {
    systemConfig,
    aiUsage,
    availableTools,
    subscription,
    loading,
    error,
    refresh: loadSystemConfig,
    isRagEnabled: systemConfig?.rag?.enabled ?? false,
    sessionConfig: systemConfig?.session,
  };

  return (
    <SystemConfigContext.Provider value={value}>
      {children}
    </SystemConfigContext.Provider>
  );
}

export function useSystemConfig() {
  const context = useContext(SystemConfigContext);
  if (!context) {
    throw new Error('useSystemConfig must be used within SystemConfigProvider');
  }
  return context;
}

export default SystemConfigContext;
