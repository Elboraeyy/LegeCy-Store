import { logger } from './logger';

/**
 * METRICS MODULE
 * 
 * Simple in-memory metrics for observability.
 * In production, replace with Prometheus/Datadog/etc.
 */

interface MetricEntry {
    value: number;
    timestamp: Date;
}

class Metrics {
    private counters: Map<string, number> = new Map();
    private histograms: Map<string, MetricEntry[]> = new Map();
    private gauges: Map<string, number> = new Map();
    
    // Counter: Increment-only metric (orders, errors, etc.)
    increment(name: string, value: number = 1, labels?: Record<string, string>) {
        const key = this.buildKey(name, labels);
        const current = this.counters.get(key) || 0;
        this.counters.set(key, current + value);
    }
    
    // Gauge: Point-in-time value (active sessions, queue size)
    setGauge(name: string, value: number, labels?: Record<string, string>) {
        const key = this.buildKey(name, labels);
        this.gauges.set(key, value);
    }
    
    // Histogram: Track latency/duration
    recordLatency(name: string, durationMs: number, labels?: Record<string, string>) {
        const key = this.buildKey(name, labels);
        const entries = this.histograms.get(key) || [];
        entries.push({ value: durationMs, timestamp: new Date() });
        
        // Keep last 1000 entries
        if (entries.length > 1000) entries.shift();
        this.histograms.set(key, entries);
    }
    
    // Get all metrics (for /api/metrics endpoint or export)
    getAll() {
        return {
            counters: Object.fromEntries(this.counters),
            gauges: Object.fromEntries(this.gauges),
            histograms: Object.fromEntries(
                Array.from(this.histograms.entries()).map(([k, v]) => [
                    k,
                    {
                        count: v.length,
                        avg: v.length ? v.reduce((s, e) => s + e.value, 0) / v.length : 0,
                        max: v.length ? Math.max(...v.map(e => e.value)) : 0,
                        min: v.length ? Math.min(...v.map(e => e.value)) : 0,
                    }
                ])
            ),
        };
    }
    
    // Get specific counter
    getCounter(name: string, labels?: Record<string, string>): number {
        const key = this.buildKey(name, labels);
        return this.counters.get(key) || 0;
    }
    
    private buildKey(name: string, labels?: Record<string, string>): string {
        if (!labels) return name;
        const labelStr = Object.entries(labels)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}="${v}"`)
            .join(',');
        return `${name}{${labelStr}}`;
    }
}

// Singleton metrics instance
export const metrics = new Metrics();

// Predefined metric names
export const METRIC = {
    // Orders
    ORDERS_CREATED: 'orders_created_total',
    ORDERS_CANCELLED: 'orders_cancelled_total',
    ORDERS_PAID: 'orders_paid_total',
    
    // Payments
    PAYMENTS_SUCCESS: 'payments_success_total',
    PAYMENTS_FAILED: 'payments_failed_total',
    PAYMENT_LATENCY: 'payment_latency_ms',
    
    // Inventory
    INVENTORY_RESERVED: 'inventory_reserved_total',
    INVENTORY_COMMITTED: 'inventory_committed_total',
    INVENTORY_RELEASED: 'inventory_released_total',
    INVENTORY_ERRORS: 'inventory_errors_total',
    
    // Webhooks
    WEBHOOKS_RECEIVED: 'webhooks_received_total',
    WEBHOOKS_PROCESSED: 'webhooks_processed_total',
    WEBHOOKS_FAILED: 'webhooks_failed_total',
    
    // HTTP
    HTTP_REQUESTS: 'http_requests_total',
    HTTP_ERRORS_4XX: 'http_errors_4xx_total',
    HTTP_ERRORS_5XX: 'http_errors_5xx_total',
    HTTP_LATENCY: 'http_request_latency_ms',
    
    // Auth
    AUTH_LOGIN_SUCCESS: 'auth_login_success_total',
    AUTH_LOGIN_FAILED: 'auth_login_failed_total',
    AUTH_RATE_LIMITED: 'auth_rate_limited_total',
    
    // Workers
    WORKER_RUNS: 'worker_runs_total',
    WORKER_ERRORS: 'worker_errors_total',
} as const;

// Helper function to track operation timing
export function trackTiming<T>(
    operation: string,
    fn: () => Promise<T>,
    labels?: Record<string, string>
): Promise<T> {
    const start = Date.now();
    return fn().finally(() => {
        const duration = Date.now() - start;
        metrics.recordLatency(operation, duration, labels);
    });
}

// Log and record error
export function recordError(metric: string, error: Error, context?: Record<string, unknown>) {
    metrics.increment(metric);
    logger.error(`Metric error: ${metric}`, { error: error.message, ...context });
}
