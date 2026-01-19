'use server';

/**
 * Background Jobs
 * 
 * Collection of scheduled jobs for system maintenance and monitoring.
 * These should be run via cron or a job scheduler.
 */

import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { verifyTrialBalance } from './trialBalanceService';

// ============================================
// RECONCILIATION CHECK JOB
// ============================================
/**
 * Daily job to verify trial balance is in balance
 * Alerts if debits != credits (indicates data corruption)
 */
export async function runReconciliationCheck(): Promise<{
    success: boolean;
    isBalanced: boolean;
    message: string;
}> {
    try {
        const result = await verifyTrialBalance();

        if (!result.isBalanced) {
            logger.error('CRITICAL: Trial balance out of balance!', {
                variance: result.variance,
                message: result.message
            });

            // Send alert
            try {
                const { sendAlert } = await import('@/lib/monitoring');
                await sendAlert({
                    type: 'INVENTORY_MISMATCH',
                    severity: 'critical',
                    message: `Trial balance is out of balance by ${result.variance.toFixed(2)} EGP`,
                    details: { variance: result.variance }
                });
            } catch {
                // Alert sending failed, but continue
            }
        }

        return {
            success: true,
            isBalanced: result.isBalanced,
            message: result.message
        };
    } catch (error) {
        logger.error('Reconciliation check failed', { error });
        return {
            success: false,
            isBalanced: false,
            message: 'Reconciliation check failed to run'
        };
    }
}

// ============================================
// INVENTORY EXPIRY WARNING JOB
// ============================================
/**
 * Alert on inventory batches expiring within specified days
 */
export async function runExpiryWarningCheck(warningDays: number = 30): Promise<{
    success: boolean;
    expiringBatches: number;
}> {
    try {
        const warningDate = new Date();
        warningDate.setDate(warningDate.getDate() + warningDays);

        const expiringBatches = await prisma.inventoryBatch.findMany({
            where: {
                expiryDate: { lte: warningDate },
                remainingQuantity: { gt: 0 }
            },
            include: {
                variant: {
                    include: {
                        product: { select: { name: true } }
                    }
                }
            }
        });

        if (expiringBatches.length > 0) {
            logger.warn('Inventory batches expiring soon', {
                count: expiringBatches.length,
                batches: expiringBatches.map(b => ({
                    batchId: b.id.slice(0, 8),
                    product: b.variant.product.name,
                    expiryDate: b.expiryDate,
                    quantity: b.remainingQuantity
                }))
            });

            // Could send email alert here
        }

        return {
            success: true,
            expiringBatches: expiringBatches.length
        };
    } catch (error) {
        logger.error('Expiry warning check failed', { error });
        return { success: false, expiringBatches: 0 };
    }
}

// ============================================
// ORDER AGE ALERT JOB
// ============================================
/**
 * Alert if orders are stuck in certain states too long
 */
export async function runOrderAgeCheck(maxAgeHours: number = 48): Promise<{
    success: boolean;
    stuckOrders: number;
}> {
    try {
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - maxAgeHours);

        const stuckOrders = await prisma.order.findMany({
            where: {
                status: { in: ['pending', 'confirmed', 'paid'] },
                createdAt: { lt: cutoffDate }
            },
            select: {
                id: true,
                status: true,
                createdAt: true,
                customerEmail: true
            }
        });

        if (stuckOrders.length > 0) {
            logger.warn('Orders stuck in processing states', {
                count: stuckOrders.length,
                orders: stuckOrders.map(o => ({
                    id: o.id,
                    status: o.status,
                    age: Math.round((Date.now() - o.createdAt.getTime()) / 3600000) + ' hours'
                }))
            });
        }

        return {
            success: true,
            stuckOrders: stuckOrders.length
        };
    } catch (error) {
        logger.error('Order age check failed', { error });
        return { success: false, stuckOrders: 0 };
    }
}

// ============================================
// ABANDONED CART RECOVERY JOB
// ============================================
/**
 * Find carts abandoned for too long and optionally send recovery emails
 */
export async function runAbandonedCartCheck(abandonedAfterHours: number = 1): Promise<{
    success: boolean;
    abandonedCarts: number;
}> {
    try {
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - abandonedAfterHours);

        const abandonedCarts = await prisma.cart.findMany({
            where: {
                updatedAt: { lt: cutoffDate },
                items: { some: {} } // Has items
            },
            include: {
                user: { select: { email: true, name: true } },
                items: { include: { product: true } }
            }
        });

        // Filter to only include carts with user emails (can't send recovery to anonymous)
        const recoverable = abandonedCarts.filter(c => c.user?.email);

        if (recoverable.length > 0) {
            logger.info('Abandoned carts found', {
                total: abandonedCarts.length,
                recoverable: recoverable.length
            });

            // TODO: Send recovery emails
            // for (const cart of recoverable) {
            //   await sendCartRecoveryEmail(cart.user!.email, cart.items);
            // }
        }

        return {
            success: true,
            abandonedCarts: abandonedCarts.length
        };
    } catch (error) {
        logger.error('Abandoned cart check failed', { error });
        return { success: false, abandonedCarts: 0 };
    }
}

// ============================================
// PARTNER SHARE RECALCULATION JOB
// ============================================
/**
 * Recalculate partner ownership percentages based on capital contributions
 */
export async function runPartnerShareRecalc(): Promise<{
    success: boolean;
    partnersUpdated: number;
}> {
    try {
        // Get total capital from all investors
        const allInvestors = await prisma.investor.findMany();
        const totalCapital = allInvestors.reduce((sum, inv) => sum + Number(inv.netContributed), 0);

        if (totalCapital <= 0) {
            return { success: true, partnersUpdated: 0 };
        }

        let updated = 0;
        for (const investor of allInvestors) {
            const newShare = (Number(investor.netContributed) / totalCapital) * 100;

            if (Math.abs(Number(investor.currentShare) - newShare) > 0.01) {
                await prisma.investor.update({
                    where: { id: investor.id },
                    data: { currentShare: newShare }
                });
                updated++;
            }
        }

        if (updated > 0) {
            logger.info('Partner shares recalculated', {
                totalCapital,
                partnersUpdated: updated
            });
        }

        return { success: true, partnersUpdated: updated };
    } catch (error) {
        logger.error('Partner share recalculation failed', { error });
        return { success: false, partnersUpdated: 0 };
    }
}

// ============================================
// RUN ALL MAINTENANCE JOBS
// ============================================
/**
 * Run all daily maintenance jobs
 */
export async function runDailyMaintenance(): Promise<{
    reconciliation: { isBalanced: boolean };
    expiry: { expiringBatches: number };
    orderAge: { stuckOrders: number };
    abandonedCarts: { abandonedCarts: number };
    partnerShares: { partnersUpdated: number };
}> {
    const [reconciliation, expiry, orderAge, abandonedCarts, partnerShares] = await Promise.all([
        runReconciliationCheck(),
        runExpiryWarningCheck(),
        runOrderAgeCheck(),
        runAbandonedCartCheck(),
        runPartnerShareRecalc()
    ]);

    return {
        reconciliation: { isBalanced: reconciliation.isBalanced },
        expiry: { expiringBatches: expiry.expiringBatches },
        orderAge: { stuckOrders: orderAge.stuckOrders },
        abandonedCarts: { abandonedCarts: abandonedCarts.abandonedCarts },
        partnerShares: { partnersUpdated: partnerShares.partnersUpdated }
    };
}
