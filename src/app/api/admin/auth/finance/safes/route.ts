import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/finance/safes
 * List all safes with their balances and recent transactions
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const safes = await prisma.safe.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
        });

        // Get recent transactions for each safe (last 10)
        const safesWithTransactions = await Promise.all(
            safes.map(async (safe) => {
                const recentTransactions = await prisma.safeTransaction.findMany({
                    where: { safeId: safe.id },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                });
                return {
                    ...safe,
                    balance: safe.balance.toNumber(),
                    recentTransactions: recentTransactions.map(t => ({
                        id: t.id,
                        type: t.type,
                        amount: t.amount.toNumber(),
                        balanceAfter: t.balanceAfter.toNumber(),
                        description: t.description,
                        referenceType: t.referenceType,
                        referenceId: t.referenceId,
                        createdAt: t.createdAt.toISOString(),
                    })),
                };
            })
        );

        const totalBalance = safes.reduce((sum, s) => sum + s.balance.toNumber(), 0);

        return NextResponse.json({
            safes: safesWithTransactions,
            totalBalance,
            count: safes.length,
        });
    } catch (error) {
        console.error('Safes GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch safes' }, { status: 500 });
    }
}

/**
 * POST /api/admin/finance/safes
 * Create a new safe OR perform a transfer between safes
 * Body: { action: "create" | "transfer", ...data }
 */
export async function POST(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'transfer') {
            // Internal transfer between safes
            const { fromSafeId, toSafeId, amount, description } = body;
            if (!fromSafeId || !toSafeId || !amount || amount <= 0) {
                return NextResponse.json({ error: 'Invalid transfer data' }, { status: 400 });
            }

            const result = await prisma.$transaction(async (tx) => {
                // Debit from source safe
                const fromSafe = await tx.safe.update({
                    where: { id: fromSafeId },
                    data: { balance: { decrement: amount } },
                });

                // Credit to destination safe
                const toSafe = await tx.safe.update({
                    where: { id: toSafeId },
                    data: { balance: { increment: amount } },
                });

                // Record both transactions
                await tx.safeTransaction.createMany({
                    data: [
                        {
                            safeId: fromSafeId,
                            type: 'TRANSFER_OUT',
                            amount,
                            balanceAfter: fromSafe.balance.toNumber(),
                            description: description || `Transfer to ${toSafe.name}`,
                            referenceType: 'TRANSFER',
                            referenceId: toSafeId,
                            createdBy: admin.id,
                        },
                        {
                            safeId: toSafeId,
                            type: 'TRANSFER_IN',
                            amount,
                            balanceAfter: toSafe.balance.toNumber(),
                            description: description || `Transfer from ${fromSafe.name}`,
                            referenceType: 'TRANSFER',
                            referenceId: fromSafeId,
                            createdBy: admin.id,
                        },
                    ],
                });

                return { fromSafe, toSafe };
            });

            return NextResponse.json({ success: true, ...result });
        }

        // Default: Create new safe
        const { name, type, description, balance } = body;
        if (!name) {
            return NextResponse.json({ error: 'Safe name is required' }, { status: 400 });
        }

        const safe = await prisma.safe.create({
            data: {
                name,
                type: type || 'CASH',
                description,
                balance: balance || 0,
            },
        });

        // If initial balance > 0, record it
        if (balance && balance > 0) {
            await prisma.safeTransaction.create({
                data: {
                    safeId: safe.id,
                    type: 'CREDIT',
                    amount: balance,
                    balanceAfter: balance,
                    description: 'Initial balance / رصيد افتتاحي',
                    referenceType: 'DEPOSIT',
                    createdBy: admin.id,
                },
            });
        }

        return NextResponse.json({ success: true, safe });
    } catch (error) {
        console.error('Safes POST Error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
