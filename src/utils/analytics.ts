import { jwtDecode } from 'jwt-decode';

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
}

class Analytics {
  private static instance: Analytics;
  private events: AnalyticsEvent[] = [];
  private performanceMetrics: Map<string, number[]> = new Map();

  private constructor() {
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
    this.sendToAnalyticsService(event);
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

    this.trackEvent('User Action', action, details, undefined);
  }

  public logPerformanceMetric(name: string, duration: number) {
    if (!this.performanceMetrics.has(name)) {
      this.performanceMetrics.set(name, []);
    }
    this.performanceMetrics.get(name)?.push(duration);

    // Send to analytics service if average exceeds threshold
    const metrics = this.performanceMetrics.get(name) || [];
    const average = metrics.reduce((a, b) => a + b, 0) / metrics.length;
    
    if (average > 1000) { // 1 second threshold
      this.trackEvent('Performance', 'Slow Operation', name, average);
    }
  }

  private sendToAnalyticsService(event: AnalyticsEvent) {
    // In a real implementation, this would send data to your analytics service
    console.log('Analytics event:', event);
  }

  public getEvents(): AnalyticsEvent[] {
    return this.events;
  }

  public getPerformanceMetrics(): Map<string, number[]> {
    return this.performanceMetrics;
  }
}

export const analytics = Analytics.getInstance();