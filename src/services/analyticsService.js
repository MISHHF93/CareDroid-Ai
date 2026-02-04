/**
 * Analytics Service for CareDroid-AI
 * Tracks user behavior, feature usage, and application performance
 */

import { apiFetch } from './apiClient';
import logger from '../utils/logger';

class AnalyticsService {
  constructor() {
    this.userId = null;
    this.sessionId = this.generateSessionId();
    this.enabled = true;
    this.queue = [];
    this.initializeAnalytics();
  }

  safeStorageGet(key) {
    try {
      return window?.localStorage?.getItem(key);
    } catch (error) {
      logger.warn('Analytics storage read failed', { error });
      return null;
    }
  }

  safeStorageSet(key, value) {
    try {
      window?.localStorage?.setItem(key, value);
      return true;
    } catch (error) {
      logger.warn('Analytics storage write failed', { error });
      return false;
    }
  }

  safeStorageRemove(key) {
    try {
      window?.localStorage?.removeItem(key);
      return true;
    } catch (error) {
      logger.warn('Analytics storage remove failed', { error });
      return false;
    }
  }

  initializeAnalytics() {
    const optOut = this.safeStorageGet('analytics_opt_out');
    if (optOut === 'true') {
      this.enabled = false;
      logger.info('Analytics disabled by user');
      return;
    }

    // Flush events periodically
    setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, 30000);
  }

  initializeSegment(writeKey) {
    if (window.analytics) {
      logger.info('Segment already initialized');
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://cdn.segment.com/analytics.js/v1/${writeKey}/analytics.min.js`;
    document.head.appendChild(script);

    logger.info('Segment analytics initialized');
  }

  trackEvent(event) {
    if (!this.enabled) return;

    const eventName = event.eventName || event.event;
    const parameters = event.parameters || event.properties || {};
    const timestamp = event.timestamp || new Date().toISOString();

    const enrichedEvent = {
      ...event,
      eventName,
      parameters,
      timestamp,
      userId: event.userId || this.userId,
      sessionId: event.sessionId || this.sessionId,
    };

    this.queue.push(enrichedEvent);

    // Send to Segment if available
    if (window.analytics && eventName) {
      window.analytics.track(eventName, parameters);
    }

    if (this.queue.length >= 50) {
      this.flush();
    }
  }

  trackPageView(pageName, properties) {
    if (!this.enabled) return;

    const event = {
      eventName: 'page_view',
      parameters: {
        page: pageName,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        ...properties,
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    };

    this.trackEvent(event);

    if (window.analytics) {
      window.analytics.page(pageName, event.parameters);
    }
  }

  setUser(properties) {
    if (!this.enabled) return;

    this.userId = properties.userId;

    if (window.analytics) {
      window.analytics.identify(properties.userId, {
        email: properties.email,
        role: properties.role,
      });
    }
  }

  getUserId() {
    return this.userId;
  }

  getSessionId() {
    return this.sessionId;
  }

  async flush() {
    if (this.queue.length === 0) return;

    const eventsToFlush = [...this.queue];
    this.queue = [];

    try {
      const response = await apiFetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: eventsToFlush,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        // Re-queue on failure
        this.queue = [...eventsToFlush, ...this.queue];
      }
    } catch (error) {
      // Re-queue on error
      this.queue = [...eventsToFlush, ...this.queue];
    }
  }

  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  optOut() {
    this.enabled = false;
    this.safeStorageSet('analytics_opt_out', 'true');
  }

  optIn() {
    this.enabled = true;
    this.safeStorageRemove('analytics_opt_out');
  }

  resetSession() {
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.flush();
  }
}

const analyticsService = new AnalyticsService();
export default analyticsService;
