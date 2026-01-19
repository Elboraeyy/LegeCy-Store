'use server';

/**
 * Email Queue Worker
 * 
 * Processes the email queue with retry logic and dead letter handling.
 * This should be called by a scheduled job (e.g., Vercel Cron).
 */

import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Email configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5 * 60 * 1000; // 5 minutes
const BATCH_SIZE = 10;

/**
 * Process pending emails in the queue
 */
export async function processEmailQueue(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  retried: number;
}> {
  const now = new Date();
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let retried = 0;

  // Fetch pending emails (using actual schema fields)
  const pendingEmails = await prisma.emailQueue.findMany({
    where: {
      status: { in: ['pending', 'failed'] },
      OR: [
        { scheduledAt: { lte: now } }
      ],
      attempts: { lt: MAX_RETRIES }
    },
    orderBy: { createdAt: 'asc' },
    take: BATCH_SIZE
  });

  if (pendingEmails.length === 0) {
    logger.info('[EmailQueue] No pending emails to process');
    return { processed: 0, succeeded: 0, failed: 0, retried: 0 };
  }

  logger.info(`[EmailQueue] Processing ${pendingEmails.length} emails`);

  for (const email of pendingEmails) {
    processed++;

    try {
      // Mark as processing
      await prisma.emailQueue.update({
        where: { id: email.id },
        data: {
          status: 'pending',
          attempts: { increment: 1 }
        }
      });

      // Send the email
      await sendEmail({
        to: email.to,
        subject: email.subject,
        html: email.html
      });

      // Mark as sent
      await prisma.emailQueue.update({
        where: { id: email.id },
        data: {
          status: 'sent',
          sentAt: now,
          error: null
        }
      });

      succeeded++;
      logger.info(`[EmailQueue] Email sent successfully`, { emailId: email.id, to: email.to });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const newAttempts = email.attempts + 1;

      if (newAttempts >= email.maxAttempts) {
        // Move to failed state
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            status: 'failed',
            error: errorMessage
          }
        });

        failed++;
        logger.error(`[EmailQueue] Email permanently failed after ${email.maxAttempts} attempts`, {
          emailId: email.id,
          to: email.to,
          error: errorMessage
        });

      } else {
        // Schedule retry
        const retryAt = new Date(now.getTime() + RETRY_DELAY_MS * newAttempts);

        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            status: 'failed',
            scheduledAt: retryAt,
            error: errorMessage
          }
        });

        retried++;
        logger.warn(`[EmailQueue] Email scheduled for retry #${newAttempts}`, {
          emailId: email.id,
          to: email.to,
          retryAt,
          error: errorMessage
        });
      }
    }
  }

  logger.info('[EmailQueue] Processing complete', { processed, succeeded, failed, retried });

  return { processed, succeeded, failed, retried };
}

/**
 * Add email to queue
 */
export async function queueEmail(params: {
  to: string;
  subject: string;
  html: string;
  scheduledAt?: Date;
}) {
  return prisma.emailQueue.create({
    data: {
      to: params.to,
      subject: params.subject,
      html: params.html,
      scheduledAt: params.scheduledAt || new Date(),
      status: 'pending',
      attempts: 0,
      maxAttempts: MAX_RETRIES
    }
  });
}

/**
 * Get failed emails (dead letter queue)
 */
export async function getFailedEmails() {
  return prisma.emailQueue.findMany({
    where: {
      status: 'failed',
      attempts: { gte: MAX_RETRIES }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
}

/**
 * Retry a failed email
 */
export async function retryFailedEmail(emailId: string) {
  await prisma.emailQueue.update({
    where: { id: emailId },
    data: {
      status: 'pending',
      attempts: 0,
      scheduledAt: new Date(),
      error: null
    }
  });

  return { success: true };
}

/**
 * Clear old sent emails (cleanup job)
 */
export async function cleanupSentEmails(olderThanDays: number = 30) {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

  const result = await prisma.emailQueue.deleteMany({
    where: {
      status: 'sent',
      sentAt: { lt: cutoff }
    }
  });

  logger.info(`[EmailQueue] Cleaned up ${result.count} old sent emails`);

  return result.count;
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [pending, sent, failed] = await Promise.all([
    prisma.emailQueue.count({ where: { status: 'pending' } }),
    prisma.emailQueue.count({ where: { status: 'sent' } }),
    prisma.emailQueue.count({ where: { status: 'failed' } })
  ]);

  return { pending, sent, failed };
}

/**
 * Internal: Send email using configured provider
 */
async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  // Import the actual email sending function
  const { sendEmail: actualSendEmail } = await import('@/lib/services/emailService');

  // Use the existing email service to send
  await actualSendEmail({
    to: params.to,
    subject: params.subject,
    html: params.html
  });
}
