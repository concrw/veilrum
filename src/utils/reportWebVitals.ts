import { onCLS, onLCP, onFCP, onTTFB, onINP, type Metric } from 'web-vitals';

const VITALS_ENDPOINT = '/api/vitals';

function sendToAnalytics(metric: Metric) {
  const body = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    url: window.location.pathname,
    timestamp: Date.now(),
  };

  // Beacon API — non-blocking, survives page unload
  if (navigator.sendBeacon) {
    navigator.sendBeacon(VITALS_ENDPOINT, JSON.stringify(body));
  }

  // Dev mode: log to console
  if (import.meta.env.DEV) {
    const color = metric.rating === 'good' ? '#0CCE6B' : metric.rating === 'needs-improvement' ? '#FFA400' : '#FF4E42';
    console.warn(`[Vitals] %c${metric.name}: ${Math.round(metric.value)}ms (${metric.rating})`, `color: ${color}; font-weight: bold`);
  }
}

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
  onINP(sendToAnalytics);
}
