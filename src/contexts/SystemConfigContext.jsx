/**
 * System Configuration Context
 * Provides system-level configuration to frontend components
 * Manages RAG status, session timeouts, AI usage, subscription, tools
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import configService from '../services/configService';

const SystemConfigContext = createContext();

export function SystemConfigProvider({ children }) {
  const [systemConfig, setSystemConfig] = useState(null);
  const [aiUsage, setAiUsage] = useState(null);
  const [availableTools, setAvailableTools] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSystemConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all system data in parallel
      const [config, usage, tools, sub] = await Promise.all([
        configService.getSystemConfig(),
        configService.getAIRemainingQueries(),
        configService.getAvailableTools(),
        configService.getCurrentSubscription(),
      ]);

      setSystemConfig(config);
      setAiUsage(usage);
      setAvailableTools(tools);
      setSubscription(sub);
    } catch (err) {
      console.error('Failed to load system config:', err);
      setError(err.message);
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
