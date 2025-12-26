import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

export const auditService = {
  /**
   * Logs an admin action to the database.
   */
  async logAction(
    adminId: string,
    action: string,
    entityType: string,
    entityId: string | null,
    metadata?: Record<string, unknown>,
    ipAddress?: string | null,
    userAgent?: string | null,
    tx?: Prisma.TransactionClient
  ) {
    try {
      const db = tx || prisma;
      
      // Store User Agent in metadata if provided
      const finalMetadata = {
          ...metadata,
          ...(userAgent ? { userAgent } : {})
      };

      await db.auditLog.create({
        data: {
          adminId,
          action,
          entityType,
          entityId,
          ipAddress: ipAddress || null, // Store IP natively
          metadata: JSON.stringify(finalMetadata),
        },
      });

      // Redundant logging to std out for easier debugging/monitoring
      logger.info(`Audit: ${action}`, { adminId, entityType, entityId, ipAddress, userAgent });
    } catch (error) {
      // Audit logs should basically never fail the main transaction, 
      // but we should log the failure so we know the audit system is broken.
      logger.error('Failed to create audit log', { error, adminId, action });
    }
  }
};
