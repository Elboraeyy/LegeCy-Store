import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/guards';

export type DisputeStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'ESCALATED';
export type DisputeOutcome = 'REFUNDED' | 'REJECTED' | 'PARTIAL_REFUND';

export async function createDispute(data: {
    orderId: string;
    type: 'refund_request' | 'fraud' | 'quality' | 'shipping' | 'other';
    reason: string; // Will map to description
    description: string;
    customerId: string;
    evidenceUrls?: string[];
}) {
    // Check if dispute already exists
    const existing = await prisma.orderDispute.findFirst({
        where: { orderId: data.orderId, status: { not: 'resolved' } }
    });

    if (existing) {
        throw new Error('An active dispute already exists for this order.');
    }

    const dispute = await prisma.orderDispute.create({
        data: {
            orderId: data.orderId,
            createdBy: data.customerId,
            type: data.type,
            description: `${data.reason}\n\n${data.description}`,
            evidence: data.evidenceUrls ? JSON.stringify(data.evidenceUrls) : null,
            status: 'OPEN',
            priority: 'normal'
        }
    });

    return dispute;
}

export async function updateDisputeStatus(disputeId: string, status: string) {
    await requireAdmin();

    const dispute = await prisma.orderDispute.update({
        where: { id: disputeId },
        data: {
            status: status.toLowerCase(),
            // We don't have a history table, so we rely on status updates only
        }
    });
    return dispute;
}

export async function resolveDispute(
    disputeId: string,
    outcome: DisputeOutcome,
    adminId: string,
    resolutionNote: string,
    refundAmount?: number
) {
    await requireAdmin();

    const dispute = await prisma.orderDispute.findUnique({
        where: { id: disputeId },
        include: { order: true }
    });

    if (!dispute) throw new Error('Dispute not found');

    if (outcome === 'REFUNDED' || outcome === 'PARTIAL_REFUND') {
        if (!refundAmount && outcome === 'PARTIAL_REFUND') {
            throw new Error('Refund amount required for partial refund');
        }
        // Logic to trigger refund would go here
    }

    await prisma.orderDispute.update({
        where: { id: disputeId },
        data: {
            status: 'resolved',
            resolution: `[${outcome}] ${resolutionNote}`,
            resolvedAt: new Date(),
            resolvedBy: adminId
        }
    });
}
