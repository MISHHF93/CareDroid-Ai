/**
 * Analytics Service for CareDroid-AI
 * Tracks user behavior, feature usage, and application performance
 */

import { apiFetch } from './apiClient';

class AnalyticsService {
  private userId: string | null = null;
  private sessionId: string;
  private enabled: boolean = true;
  private queue: any[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeAnalytics();
  }

  private initializeAnalytics() {
    const optOut = localStorage.getItem('analytics_opt_out');
    if (optOut === 'true') {
      this.enabled = false;
      console.log('Analytics disabled by user');
      return;
    }

    // Flush events periodically
    setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, 30000);
  }

  initializeSegment(writeKey: string) {
    if ((window as any).analytics) {
      console.log('Segment already initialized');
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://cdn.segment.com/analytics.js/v1/${writeKey}/analytics.min.js`;
    document.head.appendChild(script);

    console.log('✓ Segment analytics initialized');
  }

  trackEvent(event: any) {
    if (!this.enabled) return;

    const enrichedEvent = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
      userId: event.userId || this.userId,
      sessionId: event.sessionId || this.sessionId,
    };

    this.queue.push(enrichedEvent);

    // Send to Segment if available
    if ((window as any).analytics) {
      (window as any).analytics.track(event.event, event.properties);
    }

    if (this.queue.length >= 50) {
      this.flush();
    }
  }

  trackPageView(pageName: string, properties?: Record<string, any>) {
    if (!this.enabled) return;

    const event = {
      event: 'page_view',
      properties: {
        page: pageName,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        ...properties,
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    };

    this.trackEvent(event);

    if ((window as any).analytics) {
      (window as any).analytics.page(pageName, event.properties);
    }
  }

  setUser(properties: any) {
    if (!this.enabled) return;

    this.userId = properties.userId;

    if ((window as any).analytics) {
      (window as any).analytics.identify(properties.userId, {
        email: properties.email,
        role: properties.role,
      });
    }
  }

  getUserId(): string | null {
    return this.userId;
  }

  getSessionId(): string {
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

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  optOut() {
    this.enabled = false;
    localStorage.setItem('analytics_opt_out', 'true');
  }

  optIn() {
    this.enabled = true;
    localStorage.removeItem('analytics_opt_out');
  }

  resetSession() {
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.flush();
  }
}

const analyticsService = new AnalyticsService();
export default analyticsService;
