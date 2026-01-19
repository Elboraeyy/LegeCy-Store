import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Get high risk customers
        const highRiskCount = await prisma.customerRiskProfile.count({
            where: { riskLevel: 'HIGH' }
        });

        // Get customers pending review (medium risk needing attention)
        const pendingReviewCount = await prisma.customerRiskProfile.count({
            where: {
                riskLevel: 'MEDIUM'
            }
        });

        // Get blocked customers
        const blockedCount = await prisma.customerRiskProfile.count({
            where: { riskLevel: 'BLOCKED' }
        });

        // Get recent flags
        const recentFlags = await prisma.customerRiskProfile.findMany({
            where: {
                riskLevel: { in: ['HIGH', 'MEDIUM'] },
                updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            },
            orderBy: { updatedAt: 'desc' },
            take: 5,
            include: {
                user: { select: { email: true } }
            }
        });

        return NextResponse.json({
            highRiskCount,
            pendingReviewCount,
            blockedCount,
            recentFlags: recentFlags.map(flag => ({
                email: flag.user?.email || 'Unknown',
                riskLevel: flag.riskLevel,
                reason: `Score: ${flag.riskScore}`
            }))
        });
    } catch (error) {
        logger.error('Failed to fetch customer risk data', { error });
        return NextResponse.json(
            { error: 'Failed to fetch customer risk data' },
            { status: 500 }
        );
    }
}
