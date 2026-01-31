```typescript
/**
 * Analytics Service for CareDroid-AI
 * Tracks user behavior, feature usage, and application performance
 */

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
}

interface UserProperties {
  userId: string;
  email?: string;
  role?: string;
  plan?: string;
  [key: string]: any;
}

class AnalyticsService {
  private userId: string | null = null;
  private sessionId: string;
  private enabled: boolean = true;
  private queue: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL_MS = 30000; // 30 seconds
  private readonly MAX_QUEUE_SIZE = 50;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeAnalytics();
  }

  /**
   * Initialize analytics service
   */
  private initializeAnalytics() {
    // Check if user has opted out of analytics
    const optOut = localStorage.getItem('analytics_opt_out');
    if (optOut === 'true') {
      this.enabled = false;
      console.log('Analytics disabled by user');
      return;
    }

    // Start periodic flush
    this.startFlushInterval();

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    console.log('AnalyticsService initialized');
  }

  /**
   * Set user ID for analytics
   */
  setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * Identify user with properties
   */
  identify(userId: string, properties: Partial<UserProperties> = {}) {
    this.userId = userId;

    if (!this.enabled) return;

    this.track('user_identified', {
      userId,
      ...properties,
    });
  }

  /**
   * Track an event
   */
  track(event: string, properties: Record<string, any> = {}) {
    if (!this.enabled) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        platform: this.getPlatform(),
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        referrer: document.referrer,
      },
      timestamp: new Date().toISOString(),
      userId: this.userId || undefined,
      sessionId: this.sessionId,
    };

    this.queue.push(analyticsEvent);

    // Flush if queue is full
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      this.flush();
    }
  }

  /**
   * Track page view
   */
  trackPageView(path: string, title?: string) {
    this.track('page_view', {
      path,
      title: title || document.title,
      url: window.location.href,
    });
  }

  /**
   * Track user action
   */
  trackAction(action: string, category: string, label?: string, value?: number) {
    this.track('user_action', {
      action,
      category,
      label,
      value,
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string, subFeature?: string, metadata?: Record<string, any>) {
    this.track('feature_used', {
      feature,
      subFeature,
      ...metadata,
    });
  }

  /**
   * Track search query
   */
  trackSearch(query: string, resultsCount?: number, source?: string) {
    this.track('search', {
      query,
      resultsCount,
      source,
    });
  }

  /**
   * Track tool usage
   */
  trackToolUsage(toolName: string, duration?: number, success?: boolean) {
    this.track('tool_usage', {
      toolName,
      duration,
      success,
    });
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: Record<string, any>) {
    this.track('error', {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
      ...context,
    });
  }

  /**
   * Track performance metric
   */
  trackPerformance(metric: string, value: number, unit: string = 'ms') {
    this.track('performance', {
      metric,
      value,
      unit,
    });
  }

  /**
   * Track conversion event
   */
  trackConversion(conversionType: string, value?: number, currency?: string) {
    this.track('conversion', {
      conversionType,
      value,
      currency,
    });
  }

  /**
   * Flush queued events to server
   */
  async flush() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch('/api/analytics/events', {
        method: 'POST',
        headers,
        body: JSON.stringify({ events }),
      });

      console.log(`Flushed ${events.length} analytics events`);
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Re-queue events for retry
      this.queue = [...events, ...this.queue];
    }
  }

  /**
   * Enable analytics
   */
  enable() {
    this.enabled = true;
    localStorage.removeItem('analytics_opt_out');
    this.startFlushInterval();
    console.log('Analytics enabled');
  }

  /**
   * Disable analytics (GDPR compliance)
   */
  disable() {
    this.enabled = false;
    localStorage.setItem('analytics_opt_out', 'true');
    this.stopFlushInterval();
    this.queue = [];
    console.log('Analytics disabled');
  }

  /**
   * Check if analytics is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Start periodic flush
   */
  private startFlushInterval() {
    if (this.flushInterval) return;

    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  /**
   * Stop periodic flush
   */
  private stopFlushInterval() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get platform information
   */
  private getPlatform(): string {
    const ua = navigator.userAgent;

    if (/android/i.test(ua)) {
      return 'android';
    } else if (/iPad|iPhone|iPod/.test(ua)) {
      return 'ios';
    } else if (/Windows/.test(ua)) {
      return 'windows';
    } else if (/Mac/.test(ua)) {
      return 'mac';
    } else if (/Linux/.test(ua)) {
      return 'linux';
    }

    return 'unknown';
  }

  /**
   * Reset session (e.g., on logout)
   */
  resetSession() {
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.flush();
  }
}

// Export singleton instance
const analyticsService = new AnalyticsService();
export default analyticsService;
export default analyticsService;
```
