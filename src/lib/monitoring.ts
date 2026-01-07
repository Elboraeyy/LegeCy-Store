

import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';

/**
 * Monitoring Service
 * 
 * Centralized system for tracking metrics, anomalies, and alerting.
 * In production, this should integrate with external services like:
 * - Sentry/Datadog for error tracking
 * - Grafana/Prometheus for metrics
 * - PagerDuty/Opsgenie for alerting
 */

// ============================================
// ALERT TYPES & THRESHOLDS
// ============================================

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertType = 
  | 'PAYMENT_FAILURE_SPIKE'
  | 'ORDER_ANOMALY'
  | 'INVENTORY_MISMATCH'
  | 'JOB_FAILURE'
  | 'RATE_LIMIT_BREACH'
  | 'SECURITY_ALERT';

export interface AlertPayload {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  details?: Record<string, unknown>;
  timestamp?: Date;
}

// Configurable thresholds
const ALERT_THRESHOLDS = {
  paymentFailureRatePercent: 20,        // Alert if > 20% failures in window
  paymentFailureWindow: 60 * 60 * 1000, // 1 hour window
  maxOrderValue: 50000,                  // Alert if order > 50,000 EGP
  orderVolumeSpike: 3,                   // Alert if 3x normal volume
  maxFailedAttemptsPerIP: 10,            // Rate limit breaches
  reconciliationGapMinutes: 60,          // Alert if no reconciliation in 1 hour
};

// ============================================
// IN-MEMORY METRICS (Replace with Redis in production)
// ============================================

interface MetricsStore {
  paymentAttempts: { success: number; failure: number; lastReset: number };
  orderVolume: { count: number; lastHour: number };
  failedLoginsByIP: Map<string, number>;
  lastReconciliationRun: Date | null;
}

const metrics: MetricsStore = {
  paymentAttempts: { success: 0, failure: 0, lastReset: Date.now() },
  orderVolume: { count: 0, lastHour: Date.now() },
  failedLoginsByIP: new Map(),
  lastReconciliationRun: null,
};

// Reset metrics hourly
setInterval(() => {
  metrics.paymentAttempts = { success: 0, failure: 0, lastReset: Date.now() };
  metrics.orderVolume = { count: 0, lastHour: Date.now() };
  metrics.failedLoginsByIP.clear();
}, 60 * 60 * 1000);

// ============================================
// TRACKING FUNCTIONS
// ============================================

/**
 * Track payment attempt and check for failure spike
 */
export async function trackPaymentAttempt(
  orderId: string,
  success: boolean,
  amount: number,
  paymentMethod: string,
  error?: string
): Promise<void> {
  if (success) {
    metrics.paymentAttempts.success++;
  } else {
    metrics.paymentAttempts.failure++;
    
    // Log to database for analysis
    await logPaymentFailure(orderId, paymentMethod, amount, error);
  }

  // Check failure rate threshold
  const total = metrics.paymentAttempts.success + metrics.paymentAttempts.failure;
  if (total >= 10) { // Minimum sample size
    const failureRate = (metrics.paymentAttempts.failure / total) * 100;
    if (failureRate > ALERT_THRESHOLDS.paymentFailureRatePercent) {
      await sendAlert({
        type: 'PAYMENT_FAILURE_SPIKE',
        severity: 'critical',
        message: `Payment failure rate at ${failureRate.toFixed(1)}% (${metrics.paymentAttempts.failure}/${total})`,
        details: {
          successCount: metrics.paymentAttempts.success,
          failureCount: metrics.paymentAttempts.failure,
          threshold: ALERT_THRESHOLDS.paymentFailureRatePercent,
          windowMs: Date.now() - metrics.paymentAttempts.lastReset
        }
      });
    }
  }
}

/**
 * Track and detect order anomalies
 */
export async function trackOrder(
  orderId: string,
  totalPrice: number,
  customerEmail: string,
  ipAddress?: string
): Promise<void> {
  metrics.orderVolume.count++;

  // Check for unusually large order
  if (totalPrice > ALERT_THRESHOLDS.maxOrderValue) {
    await sendAlert({
      type: 'ORDER_ANOMALY',
      severity: 'warning',
      message: `Large order detected: ${totalPrice} EGP`,
      details: { orderId, customerEmail, totalPrice }
    });
  }

  // Check for multiple orders from same IP in short time (potential abuse)
  if (ipAddress) {
    const recentOrders = await prisma.order.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) }, // Last 10 min
        // Note: Would need IP tracking field to fully implement
      }
    });
    
    if (recentOrders > 5) {
      await sendAlert({
        type: 'ORDER_ANOMALY',
        severity: 'warning',
        message: `High order volume from IP: ${recentOrders} orders in 10 minutes`,
        details: { ipAddress, orderCount: recentOrders }
      });
    }
  }
}

/**
 * Track rate limit breaches
 */
export async function trackRateLimitBreach(
  identifier: string,
  endpoint: string,
  attemptCount: number
): Promise<void> {
  const current = metrics.failedLoginsByIP.get(identifier) || 0;
  metrics.failedLoginsByIP.set(identifier, current + 1);

  if (current + 1 >= ALERT_THRESHOLDS.maxFailedAttemptsPerIP) {
    await sendAlert({
      type: 'RATE_LIMIT_BREACH',
      severity: 'warning',
      message: `Rate limit breach: ${identifier} on ${endpoint}`,
      details: { identifier, endpoint, attemptCount }
    });
  }
}

/**
 * Track job execution for monitoring
 */
export async function trackJobExecution(
  jobName: string,
  success: boolean,
  duration: number,
  error?: string
): Promise<void> {
  if (jobName === 'reconciliation') {
    metrics.lastReconciliationRun = new Date();
  }

  logger.info(`Job completed: ${jobName}`, { success, duration, error });

  if (!success) {
    await sendAlert({
      type: 'JOB_FAILURE',
      severity: 'critical',
      message: `Job failed: ${jobName}`,
      details: { jobName, error, duration }
    });
  }
}

/**
 * Check if reconciliation is overdue
 */
export async function checkReconciliationHealth(): Promise<boolean> {
  const lastRun = metrics.lastReconciliationRun;
  
  if (!lastRun) {
    // First time - just log warning
    logger.warn('Reconciliation has never run');
    return false;
  }

  const minutesSinceRun = (Date.now() - lastRun.getTime()) / (60 * 1000);
  
  if (minutesSinceRun > ALERT_THRESHOLDS.reconciliationGapMinutes) {
    await sendAlert({
      type: 'JOB_FAILURE',
      severity: 'critical',
      message: `Reconciliation overdue: last run ${minutesSinceRun.toFixed(0)} minutes ago`,
      details: { lastRun, minutesSinceRun }
    });
    return false;
  }

  return true;
}

// ============================================
// ALERT SYSTEM
// ============================================

// Alert history (in-memory, use Redis/DB in production)
const recentAlerts: AlertPayload[] = [];
const ALERT_DEDUP_WINDOW = 5 * 60 * 1000; // Don't repeat same alert within 5 min

/**
 * Send an alert via configured channels
 */
export async function sendAlert(alert: AlertPayload): Promise<void> {
  alert.timestamp = new Date();
  
  // Deduplication check
  const isDuplicate = recentAlerts.some(
    a => a.type === alert.type && 
         a.message === alert.message &&
         (alert.timestamp!.getTime() - (a.timestamp?.getTime() || 0)) < ALERT_DEDUP_WINDOW
  );

  if (isDuplicate) {
    logger.debug('Alert deduplicated', { type: alert.type });
    return;
  }

  recentAlerts.push(alert);
  
  // Keep only last 100 alerts
  if (recentAlerts.length > 100) {
    recentAlerts.shift();
  }

  // Log alert
  logger.warn(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`, alert.details);

  // Store in database for audit
  try {
    await prisma.storeConfig.upsert({
      where: { key: 'latest_alerts' },
      create: { 
        key: 'latest_alerts', 
        value: recentAlerts.slice(-20) as unknown as object
      },
      update: { 
        value: recentAlerts.slice(-20) as unknown as object
      }
    });
  } catch (e) {
    logger.error('Failed to persist alert', { error: e });
  }

  // Send notifications based on severity
  if (alert.severity === 'critical') {
    await sendCriticalAlert(alert);
  }
}

/**
 * Send critical alert via email/webhook
 */
async function sendCriticalAlert(alert: AlertPayload): Promise<void> {
  try {
    // Email notification
    const adminEmail = process.env.ADMIN_ALERT_EMAIL;
    if (adminEmail) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      await resend.emails.send({
        from: 'alerts@legecy.store',
        to: adminEmail,
        subject: `[CRITICAL] ${alert.type}: ${alert.message}`,
        html: `
          <h1>🚨 Critical Alert</h1>
          <p><strong>Type:</strong> ${alert.type}</p>
          <p><strong>Message:</strong> ${alert.message}</p>
          <p><strong>Time:</strong> ${alert.timestamp?.toISOString()}</p>
          <pre>${JSON.stringify(alert.details, null, 2)}</pre>
        `
      });
    }

    // Slack webhook (optional)
    const slackWebhook = process.env.SLACK_ALERT_WEBHOOK;
    if (slackWebhook) {
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 *CRITICAL: ${alert.type}*\n${alert.message}`,
          attachments: [{
            color: '#ff0000',
            fields: Object.entries(alert.details || {}).map(([k, v]) => ({
              title: k,
              value: String(v),
              short: true
            }))
          }]
        })
      });
    }
  } catch (e) {
    logger.error('Failed to send critical alert notification', { error: e, alert });
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Log payment failure to database for analysis
 */
async function logPaymentFailure(
  orderId: string,
  paymentMethod: string,
  amount: number,
  error?: string
): Promise<void> {
  try {
    // Could create dedicated PaymentFailure table
    // For now, use audit log
    const { auditService } = await import('@/lib/services/auditService');
    await auditService.logAction(
      'SYSTEM',
      'PAYMENT_FAILED',
      'ORDER',
      orderId,
      { paymentMethod, amount, error },
      null,
      null
    );
  } catch (e) {
    logger.error('Failed to log payment failure', { error: e });
  }
}

/**
 * Get current metrics snapshot
 */
export async function getMetricsSnapshot() {
  return {
    paymentAttempts: { ...metrics.paymentAttempts },
    orderVolume: { ...metrics.orderVolume },
    failedLoginCount: metrics.failedLoginsByIP.size,
    lastReconciliation: metrics.lastReconciliationRun?.toISOString() || null,
    recentAlertCount: recentAlerts.length
  };
}
