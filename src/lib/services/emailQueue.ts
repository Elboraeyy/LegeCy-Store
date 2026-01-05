'use server';

import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Email Queue Service
 * 
 * Provides reliable email delivery with retry logic using database-backed queue.
 * Emails are queued and processed by a cron job.
 */

export interface QueuedEmail {
  to: string;
  subject: string;
  html: string;
  scheduledAt?: Date;
}

/**
 * Queue an email for delivery
 */
export async function queueEmail(email: QueuedEmail): Promise<{ success: boolean; id?: string }> {
  try {
    const queued = await prisma.emailQueue.create({
      data: {
        to: email.to,
        subject: email.subject,
        html: email.html,
        scheduledAt: email.scheduledAt || new Date(),
        status: 'pending',
        attempts: 0,
        maxAttempts: 3,
      },
    });

    logger.info('Email queued', { id: queued.id, to: email.to, subject: email.subject });
    return { success: true, id: queued.id };
  } catch (error) {
    logger.error('Failed to queue email', { error, to: email.to });
    return { success: false };
  }
}

/**
 * Process pending emails (called by cron job)
 */
export async function processEmailQueue(): Promise<{ sent: number; failed: number }> {
  const now = new Date();
  let sent = 0;
  let failed = 0;

  // Get pending emails that are due
  const pendingEmails = await prisma.emailQueue.findMany({
    where: {
      status: 'pending',
      scheduledAt: { lte: now },
    },
    take: 20, // Process in batches
    orderBy: { scheduledAt: 'asc' },
  });

  if (pendingEmails.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  for (const email of pendingEmails) {
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'LegaCy <orders@legecy.store>',
        to: email.to,
        subject: email.subject,
        html: email.html,
      });

      // Mark as sent
      await prisma.emailQueue.update({
        where: { id: email.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
          attempts: email.attempts + 1,
        },
      });

      sent++;
      logger.info('Email sent', { id: email.id, to: email.to });
    } catch (error) {
      const newAttempts = email.attempts + 1;
      const shouldFail = newAttempts >= email.maxAttempts;

      await prisma.emailQueue.update({
        where: { id: email.id },
        data: {
          status: shouldFail ? 'failed' : 'pending',
          attempts: newAttempts,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      if (shouldFail) {
        failed++;
        logger.error('Email permanently failed', { id: email.id, attempts: newAttempts });
      } else {
        logger.warn('Email delivery failed, will retry', { id: email.id, attempts: newAttempts });
      }
    }
  }

  return { sent, failed };
}

/**
 * Get email queue stats
 */
export async function getEmailQueueStats(): Promise<{
  pending: number;
  sent: number;
  failed: number;
}> {
  const [pending, sent, failed] = await Promise.all([
    prisma.emailQueue.count({ where: { status: 'pending' } }),
    prisma.emailQueue.count({ where: { status: 'sent' } }),
    prisma.emailQueue.count({ where: { status: 'failed' } }),
  ]);

  return { pending, sent, failed };
}
