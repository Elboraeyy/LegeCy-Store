'use server';

import { logger } from '@/lib/logger';
import { sendEmail } from './emailService';

/**
 * Alert Service
 * 
 * Centralized alerting for critical system events.
 * Sends notifications via Slack webhook and email to admins.
 */

// Configuration
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'admin@legecy.store';

// Alert severity levels
export type AlertSeverity = 'info' | 'warning' | 'critical';

interface AlertPayload {
  title: string;
  message: string;
  severity: AlertSeverity;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

// Slack color mapping
const SLACK_COLORS: Record<AlertSeverity, string> = {
  info: '#2563eb',      // Blue
  warning: '#f59e0b',   // Yellow
  critical: '#dc2626',  // Red
};

// Slack emoji mapping
const SLACK_EMOJIS: Record<AlertSeverity, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  critical: '🚨',
};

/**
 * Send alert to Slack webhook
 */
async function sendSlackAlert(alert: AlertPayload): Promise<boolean> {
  if (!SLACK_WEBHOOK_URL) {
    logger.warn('Slack webhook URL not configured, skipping Slack alert');
    return false;
  }

  try {
    const fields = alert.metadata 
      ? Object.entries(alert.metadata).map(([key, value]) => ({
          title: key,
          value: String(value),
          short: true
        }))
      : [];

    const payload = {
      attachments: [
        {
          color: SLACK_COLORS[alert.severity],
          pretext: `${SLACK_EMOJIS[alert.severity]} *${alert.title}*`,
          text: alert.message,
          fields,
          footer: 'LegaCy Store Alert System',
          ts: Math.floor((alert.timestamp || new Date()).getTime() / 1000)
        }
      ]
    };

    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      logger.error('Slack alert failed', { status: response.status });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Slack alert error', { error });
    return false;
  }
}

/**
 * Send alert via email
 */
async function sendEmailAlert(alert: AlertPayload): Promise<boolean> {
  try {
    const metadataHtml = alert.metadata
      ? `<table style="border-collapse: collapse; margin-top: 10px;">
          ${Object.entries(alert.metadata)
            .map(([key, value]) => `
              <tr>
                <td style="padding: 5px 10px; border: 1px solid #ddd; font-weight: bold;">${key}</td>
                <td style="padding: 5px 10px; border: 1px solid #ddd;">${String(value)}</td>
              </tr>
            `).join('')}
         </table>`
      : '';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${SLACK_COLORS[alert.severity]}; color: white; padding: 15px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">${SLACK_EMOJIS[alert.severity]} ${alert.title}</h2>
        </div>
        <div style="padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 15px 0; font-size: 16px;">${alert.message}</p>
          ${metadataHtml}
          <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 12px;">
            Time: ${(alert.timestamp || new Date()).toISOString()}
          </p>
        </div>
      </div>
    `;

    const result = await sendEmail({
      to: ADMIN_ALERT_EMAIL,
      subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
      html
    });

    return result.success;
  } catch (error) {
    logger.error('Email alert error', { error });
    return false;
  }
}

/**
 * Send a critical alert to all channels (Slack + Email)
 */
export async function sendCriticalAlert(
  title: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<{ slack: boolean; email: boolean }> {
  const alert: AlertPayload = {
    title,
    message,
    severity: 'critical',
    metadata,
    timestamp: new Date()
  };

  logger.error(`[CRITICAL ALERT] ${title}`, { message, metadata });

  const [slack, email] = await Promise.all([
    sendSlackAlert(alert),
    sendEmailAlert(alert)
  ]);

  return { slack, email };
}

/**
 * Send warning alert
 */
export async function sendWarningAlert(
  title: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<{ slack: boolean; email: boolean }> {
  const alert: AlertPayload = {
    title,
    message,
    severity: 'warning',
    metadata,
    timestamp: new Date()
  };

  logger.warn(`[WARNING ALERT] ${title}`, { message, metadata });

  const [slack, email] = await Promise.all([
    sendSlackAlert(alert),
    sendEmailAlert(alert)
  ]);

  return { slack, email };
}

/**
 * Send info alert (Slack only by default)
 */
export async function sendInfoAlert(
  title: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<{ slack: boolean }> {
  const alert: AlertPayload = {
    title,
    message,
    severity: 'info',
    metadata,
    timestamp: new Date()
  };

  logger.info(`[INFO ALERT] ${title}`, { message, metadata });

  const slack = await sendSlackAlert(alert);

  return { slack };
}

// ============================================
// SPECIFIC ALERT FUNCTIONS
// ============================================

/**
 * Alert for inventory batch mismatch (critical data integrity issue)
 */
export async function sendBatchMismatchAlert(
  variantId: string,
  warehouseId: string,
  missingQty: number
): Promise<void> {
  await sendCriticalAlert(
    'Inventory Batch Mismatch Detected',
    'Aggregate inventory indicates stock exists, but batch records do not match. This is a critical data integrity issue that requires immediate attention.',
    {
      'Variant ID': variantId,
      'Warehouse ID': warehouseId,
      'Missing Quantity': missingQty,
      'Action Required': 'Run inventory reconciliation'
    }
  );
}

/**
 * Alert for batches expiring soon
 */
export async function sendBatchExpiryAlert(
  expiringItems: Array<{ variantSku: string; productName: string; quantity: number; expiryDate: Date }>,
  daysBeforeExpiry: number
): Promise<void> {
  if (expiringItems.length === 0) return;

  const itemsList = expiringItems
    .slice(0, 10) // Limit to first 10
    .map(item => `${item.productName} (${item.variantSku}): ${item.quantity} units - expires ${item.expiryDate.toLocaleDateString()}`)
    .join('\n');

  await sendWarningAlert(
    `${expiringItems.length} Batch(es) Expiring in ${daysBeforeExpiry} Days`,
    `The following inventory batches are approaching expiry:\n${itemsList}${expiringItems.length > 10 ? `\n...and ${expiringItems.length - 10} more` : ''}`,
    {
      'Total Items': expiringItems.length,
      'Days Until Expiry': daysBeforeExpiry,
      'Total Quantity': expiringItems.reduce((sum, i) => sum + i.quantity, 0)
    }
  );
}

/**
 * Alert for system health issues
 */
export async function sendSystemHealthAlert(
  component: string,
  status: 'degraded' | 'down' | 'error',
  details: string
): Promise<void> {
  const severity = status === 'down' ? 'critical' : 'warning';
  
  if (severity === 'critical') {
    await sendCriticalAlert(
      `System Component ${status.toUpperCase()}: ${component}`,
      details,
      { Component: component, Status: status }
    );
  } else {
    await sendWarningAlert(
      `System Component Issue: ${component}`,
      details,
      { Component: component, Status: status }
    );
  }
}

/**
 * Alert for failed cron jobs
 */
export async function sendCronFailureAlert(
  jobName: string,
  error: string
): Promise<void> {
  await sendCriticalAlert(
    `Cron Job Failed: ${jobName}`,
    `The scheduled job "${jobName}" has failed. Manual intervention may be required.`,
    { 'Job Name': jobName, 'Error': error }
  );
}

/**
 * Alert for high-risk order detected
 */
export async function sendFraudAlert(
  orderId: string,
  riskScore: number,
  factors: string[]
): Promise<void> {
  await sendWarningAlert(
    'High-Risk Order Detected',
    `Order ${orderId} has been flagged for manual review due to elevated fraud risk.`,
    {
      'Order ID': orderId,
      'Risk Score': `${riskScore}/100`,
      'Risk Factors': factors.join(', ')
    }
  );
}
