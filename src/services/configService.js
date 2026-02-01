/**
 * Configuration Service
 * Fetches system-level configuration from backend
 */

import apiClient from './apiClient';

class ConfigService {
  /**
   * Get system configuration (RAG status, session timeouts, etc.)
   */
  async getSystemConfig() {
    try {
      const response = await apiClient.get('/config/system');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch system config:', error);
      // Return sensible defaults if fetch fails
      return {
        rag: {
          enabled: false,
          topK: 5,
          minScore: 0.7,
        },
        session: {
          idleTimeoutMs: 1800000, // 30 min
          absoluteTimeoutMs: 28800000, // 8 hours
        },
      };
    }
  }

  /**
   * Get AI usage and remaining queries for current user
   */
  async getAIRemainingQueries() {
    try {
      const response = await apiClient.get('/ai/remaining-queries');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch AI remaining queries:', error);
      return {
        tier: 'free',
        dailyLimit: 10,
        usedToday: 0,
        remaining: 10,
        resetAt: new Date(Date.now() + 86400000).toISOString(),
      };
    }
  }

  /**
   * Get tools available for current user's subscription
   */
  async getAvailableTools() {
    try {
      const response = await apiClient.get('/tools/available');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch available tools:', error);
      // Return empty tools list on error
      return {
        tools: [],
        count: 0,
        tier: 'free',
      };
    }
  }

  /**
   * Get current subscription details
   */
  async getCurrentSubscription() {
    try {
      const response = await apiClient.get('/subscriptions/current');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      return null;
    }
  }

  /**
   * Get available subscription plans
   */
  async getSubscriptionPlans() {
    try {
      const response = await apiClient.get('/subscriptions/plans');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch subscription plans:', error);
      return [];
    }
  }
}

export default new ConfigService();
