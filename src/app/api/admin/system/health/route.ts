import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getKillSwitches } from '@/lib/killSwitches';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const killSwitches = await getKillSwitches();

        // Get pending approvals count
        const pendingApprovals = await prisma.approvalRequest.count({
            where: { status: 'pending' }
        });

        // Get inventory alerts (low stock) - using status field instead of isActive
        const inventoryAlerts = await prisma.stockAlert.count({
            where: { status: 'ACTIVE' }
        });

        // Check for failed cron jobs - simplified query without JSON path filtering
        let failedCronJobs = 0;
        try {
            const recentErrors = await prisma.auditLog.count({
                where: {
                    action: { contains: 'CRON' },
                    createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }
            });
            // Assume non-zero count indicates issues (simplified)
            failedCronJobs = recentErrors > 0 ? 1 : 0;
        } catch {
            // Audit log might not have this structure
        }

        return NextResponse.json({
            killSwitches: {
                checkout_enabled: killSwitches.checkout_enabled,
                payments_enabled: killSwitches.payments_enabled,
                coupons_enabled: killSwitches.coupons_enabled,
                cod_enabled: killSwitches.cod_enabled
            },
            pendingApprovals,
            failedCronJobs,
            inventoryAlerts,
            recentIssues: []
        });
    } catch (error) {
        logger.error('Failed to fetch system health', { error });
        return NextResponse.json(
            { error: 'Failed to fetch system health' },
            { status: 500 }
        );
    }
}
