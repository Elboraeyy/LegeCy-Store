import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateAdminSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
    try {
        const sessionResult = await validateAdminSession();
        if (!sessionResult || !sessionResult.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const admin = sessionResult.user;
        const body = await request.json();
        const { sessionId, items, customerId, customerName, customerPhone, discountType, discountAmount = 0, payments, note } = body;

        // Validate session
        const session = await prisma.pOSSession.findUnique({
            where: { id: sessionId },
            include: { cashier: { include: { role: true } } }
        });

        if (!session || session.status !== 'OPEN') {
            return NextResponse.json(
                { error: 'Invalid or closed session' },
                { status: 400 }
            );
        }

        // SECURITY: Verify the admin is either the session owner or has elevated privileges
        if (session.cashierId !== admin.id) {
            const adminRole = admin.role;
            const isElevated = adminRole?.name === 'owner' || adminRole?.name === 'super_admin';
            
            if (!isElevated) {
                return NextResponse.json(
                    { error: 'Not authorized to add transactions to this session' },
                    { status: 403 }
                );
            }
        }

        // Calculate totals
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subtotal = items.reduce((sum: number, item: any) =>
            sum + (item.unitPrice * item.quantity), 0);

        const discount = discountType === 'PERCENTAGE'
            ? (subtotal * discountAmount / 100)
            : (discountAmount || 0);

        const total = Math.max(0, subtotal - discount);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalReceived = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
        const changeDue = Math.max(0, totalReceived - total);

        // Generate transaction number
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
        const count = await prisma.pOSTransaction.count({
            where: {
                createdAt: {
                    gte: new Date(today.getFullYear(), today.getMonth(), today.getDate())
                }
            }
        });
        const transactionNo = `TXN-${dateStr}-${String(count + 1).padStart(6, '0')}`;

        // Create transaction with items and payments
        const transaction = await prisma.pOSTransaction.create({
            data: {
                transactionNo,
                sessionId,
                type: 'SALE',
                customerId: customerId || null,
                customerName: customerName || null,
                customerPhone: customerPhone || null,
                subtotal,
                discountType: discountType || null,
                discountAmount: discount,
                discountReason: null,
                taxAmount: 0,
                total,
                changeDue,
                status: 'COMPLETED',
                note: note || null,
                 
                items: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        variantId: item.variantId || null,
                        name: item.name,
                        sku: item.sku,
                        barcode: item.barcode || null,
                        imageUrl: item.imageUrl || null,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discountAmount: item.discountAmount || 0,
                        taxAmount: 0,
                        totalPrice: item.unitPrice * item.quantity - (item.discountAmount || 0)
                    }))
                },
                 
                payments: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    create: payments.map((p: any) => ({
                        method: p.method,
                        amount: p.amount,
                        reference: p.reference || null,
                        cardType: p.cardType || null
                    }))
                }
            },
            include: {
                items: true,
                payments: true
            }
        });

        // Update session counters
        await prisma.pOSSession.update({
            where: { id: sessionId },
            data: {
                salesCount: { increment: 1 },
                salesTotal: { increment: total },
                discountsTotal: { increment: discount }
            }
        });

        // Record cash movement for cash payments
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cashPayment = payments.find((p: any) => p.method === 'CASH');
        if (cashPayment) {
            const lastMovement = await prisma.cashMovement.findFirst({
                where: { sessionId },
                orderBy: { createdAt: 'desc' }
            });
            const currentBalance = lastMovement ? Number(lastMovement.balanceAfter) : Number(session.openingBalance);

            await prisma.cashMovement.create({
                data: {
                    sessionId,
                    type: 'SALE',
                    amount: total,
                    reference: transaction.id,
                    balanceAfter: currentBalance + total,
                    performedById: admin.id
                }
            });
        }

        // Update inventory for each item
        for (const item of items) {
            if (item.variantId) {
                const terminal = await prisma.pOSTerminal.findUnique({
                    where: { id: session.terminalId },
                    select: { warehouseId: true }
                });

                if (terminal) {
                    await prisma.inventory.updateMany({
                        where: {
                            variantId: item.variantId,
                            warehouseId: terminal.warehouseId
                        },
                        data: {
                            available: { decrement: item.quantity }
                        }
                    });

                    await prisma.inventoryLog.create({
                        data: {
                            warehouseId: terminal.warehouseId,
                            variantId: item.variantId,
                            action: 'ORDER_FULFILL',
                            quantity: -item.quantity,
                            reason: `POS Sale: ${transactionNo}`,
                            referenceId: transaction.id,
                            adminId: admin.id
                        }
                    });
                }
            }
        }

        return NextResponse.json({
            transaction: {
                id: transaction.id,
                transactionNo: transaction.transactionNo,
                type: transaction.type,
                subtotal: Number(transaction.subtotal),
                discountAmount: Number(transaction.discountAmount),
                total: Number(transaction.total),
                changeDue: Number(transaction.changeDue),
                status: transaction.status,
                createdAt: transaction.createdAt,
                items: transaction.items,
                payments: transaction.payments
            }
        });
    } catch (error) {
        console.error('Error creating POS transaction:', error);
        return NextResponse.json(
            { error: 'Failed to create transaction' },
            { status: 500 }
        );
    }
}

// Get transactions
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');
        const limit = parseInt(searchParams.get('limit') || '50');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: Record<string, any> = {};
        if (sessionId) where.sessionId = sessionId;

        const transactions = await prisma.pOSTransaction.findMany({
            where,
            include: {
                items: true,
                payments: true,
                session: {
                    select: {
                        cashier: { select: { name: true } },
                        terminal: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return NextResponse.json({ transactions });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transactions' },
            { status: 500 }
        );
    }
}
