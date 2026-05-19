import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/finance/withdrawals
 * List all withdrawal requests (for finance admin)
 * Query: ?status=PENDING|APPROVED|REJECTED
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const where: Record<string, unknown> = {};
        if (status) where.status = status;

        const withdrawals = await prisma.partnerWithdrawal.findMany({
            where,
            include: {
                investor: { select: { id: true, name: true, walletBalance: true, currentShare: true } },
                safe: { select: { id: true, name: true, type: true } },
                approvedBy: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        const safes = await prisma.safe.findMany({
            where: { isActive: true },
            select: { id: true, name: true, type: true, balance: true },
        });

        const pendingCount = await prisma.partnerWithdrawal.count({ where: { status: 'PENDING' } });

        return NextResponse.json({
            withdrawals: withdrawals.map(w => ({
                id: w.id,
                investorId: w.investorId,
                investorName: w.investor.name,
                investorBalance: w.investor.walletBalance.toNumber(),
                investorShare: w.investor.currentShare.toNumber(),
                amount: w.amount.toNumber(),
                status: w.status,
                safe: w.safe ? { id: w.safe.id, name: w.safe.name, type: w.safe.type } : null,
                approvedBy: w.approvedBy,
                approvedAt: w.approvedAt?.toISOString(),
                rejectedReason: w.rejectedReason,
                notes: w.notes,
                createdAt: w.createdAt.toISOString(),
            })),
            safes: safes.map(s => ({
                id: s.id,
                name: s.name,
                type: s.type,
                balance: s.balance.toNumber(),
            })),
            pendingCount,
        });
    } catch (error) {
        console.error('Withdrawals GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch withdrawals' }, { status: 500 });
    }
}

/**
 * PUT /api/admin/finance/withdrawals
 * Approve or reject a withdrawal request
 * Body: { withdrawalId, action: "approve"|"reject", safeId?, rejectedReason? }
 */
export async function PUT(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { withdrawalId, action, safeId, rejectedReason } = body;

        if (!withdrawalId || !action) {
            return NextResponse.json({ error: 'Withdrawal ID and action are required' }, { status: 400 });
        }

        const withdrawal = await prisma.partnerWithdrawal.findUnique({
            where: { id: withdrawalId },
            include: { investor: true },
        });

        if (!withdrawal) {
            return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
        }

        if (withdrawal.status !== 'PENDING') {
            return NextResponse.json({ error: 'Withdrawal already processed' }, { status: 400 });
        }

        if (action === 'reject') {
            await prisma.partnerWithdrawal.update({
                where: { id: withdrawalId },
                data: {
                    status: 'REJECTED',
                    rejectedReason: rejectedReason || 'Rejected by admin',
                },
            });
            return NextResponse.json({ success: true, message: 'Withdrawal rejected' });
        }

        // Approve
        if (!safeId) {
            return NextResponse.json({ error: 'Safe is required for approval' }, { status: 400 });
        }

        const amount = withdrawal.amount.toNumber();

        await prisma.$transaction(async (tx) => {
            // Update withdrawal status
            await tx.partnerWithdrawal.update({
                where: { id: withdrawalId },
                data: {
                    status: 'APPROVED',
                    safeId,
                    approvedById: admin.id,
                    approvedAt: new Date(),
                },
            });

            // Deduct from partner's wallet
            await tx.investor.update({
                where: { id: withdrawal.investorId },
                data: {
                    walletBalance: { decrement: amount },
                    totalWithdrawn: { increment: amount },
                },
            });

            // Deduct from safe
            const safe = await tx.safe.update({
                where: { id: safeId },
                data: { balance: { decrement: amount } },
            });

            // Record safe transaction
            await tx.safeTransaction.create({
                data: {
                    safeId,
                    type: 'DEBIT',
                    amount,
                    balanceAfter: safe.balance.toNumber(),
                    description: `Partner withdrawal: ${withdrawal.investor.name}`,
                    referenceType: 'WITHDRAWAL',
                    referenceId: withdrawalId,
                    createdBy: admin.id,
                },
            });
        });

        return NextResponse.json({ success: true, message: 'Withdrawal approved' });
    } catch (error) {
        console.error('Withdrawals PUT Error:', error);
        return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 });
    }
}
