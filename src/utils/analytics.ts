import { jwtDecode } from 'jwt-decode';

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
}

const API_BASE = import.meta.env.DEV ? '' : import.meta.env.VITE_API_ENDPOINT;

class Analytics {
  private static instance: Analytics;
  private events: AnalyticsEvent[] = [];
  private performanceMetrics: Map<string, number[]> = new Map();
  private readonly MAX_EVENTS = 1000;
  private readonly FLUSH_INTERVAL_MS = 60000; // 60 seconds

  private constructor() {
    // Start periodic flush
    setInterval(() => this.flush(), this.FLUSH_INTERVAL_MS);

    // Initialize performance observer
    if (typeof window !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.logPerformanceMetric(entry.name, entry.duration);
        });
      });

      observer.observe({ entryTypes: ['measure'] });
    }
  }

  public static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  public trackEvent(category: string, action: string, label?: string, value?: number) {
    const event: AnalyticsEvent = {
      category,
      action,
      label,
      value,
      timestamp: Date.now(),
    };

    this.events.push(event);

    // Flush if batch size reaches threshold
    if (this.events.length >= this.MAX_EVENTS) {
      this.flush();
    }
  }

  public trackPageView(path: string) {
    this.trackEvent('Navigation', 'Page View', path);
  }

  public trackUserAction(action: string, details?: string) {
    const token = localStorage.getItem('auth_token');
    let userId = 'anonymous';

    if (token) {
      try {
        const decoded = jwtDecode(token) as { sub?: string };
        userId = decoded.sub || 'anonymous';
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }

    this.trackEvent('User Action', action, details);
  }

  public logPerformanceMetric(name: string, duration: number) {
    if (!this.performanceMetrics.has(name)) {
      this.performanceMetrics.set(name, []);
    }
    this.performanceMetrics.get(name)?.push(duration);

    const metrics = this.performanceMetrics.get(name) || [];
    const average = metrics.reduce((a, b) => a + b, 0) / metrics.length;

    if (average > 1000) {
      this.trackEvent('Performance', 'Slow Operation', name, average);
    }
  }

  private async flush() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await fetch(`${API_BASE}/api/v1/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: eventsToSend }),
      });
    } catch (error) {
      console.error('Failed to flush analytics:', error);
      this.events.unshift(...eventsToSend);
    }
  }

  public getEvents(): AnalyticsEvent[] {
    return this.events;
  }

  public getPerformanceMetrics(): Map<string, number[]> {
    return this.performanceMetrics;
  }
}

export const analytics = Analytics.getInstance();