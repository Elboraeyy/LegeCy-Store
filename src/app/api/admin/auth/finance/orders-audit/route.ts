import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/finance/orders-audit
 * Fetch orders for financial review (delivered orders of the current or specified month)
 * Query: ?tab=pending|audited&month=5&year=2026
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { searchParams } = new URL(request.url);
        const tab = searchParams.get('tab') || 'pending'; // pending | audited
        const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
        const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

        // Date range for the month
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

        const isAudited = tab === 'audited';

        const orders = await prisma.order.findMany({
            where: {
                status: 'delivered',
                deliveredAt: { gte: startOfMonth, lte: endOfMonth },
                isFinanciallyAudited: isAudited,
            },
            include: {
                items: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        quantity: true,
                        costAtPurchase: true,
                        sku: true,
                        product: {
                            select: {
                                id: true,
                                name: true,
                                specs: true,
                                costPrice: true,
                            },
                        },
                    },
                },
                auditedBy: { select: { id: true, name: true } },
                auditSafe: { select: { id: true, name: true, type: true } },
            },
            orderBy: { deliveredAt: 'desc' },
        });

        // Summary counts
        const [pendingCount, auditedCount] = await Promise.all([
            prisma.order.count({
                where: {
                    status: 'delivered',
                    deliveredAt: { gte: startOfMonth, lte: endOfMonth },
                    isFinanciallyAudited: false,
                },
            }),
            prisma.order.count({
                where: {
                    status: 'delivered',
                    deliveredAt: { gte: startOfMonth, lte: endOfMonth },
                    isFinanciallyAudited: true,
                },
            }),
        ]);

        // Get available safes for the audit form
        const safes = await prisma.safe.findMany({
            where: { isActive: true },
            select: { id: true, name: true, type: true },
        });

        return NextResponse.json({
            orders: orders.map(o => ({
                id: o.id,
                orderNumber: o.orderNumber,
                customerName: o.customerName || o.firstName || 'Guest',
                customerPhone: o.customerPhone || o.alternativePhone || '',
                shippingGovernorate: o.shippingGovernorate || '',
                shippingCity: o.shippingCity || '',
                totalPrice: o.totalPrice.toNumber(),
                subtotal: o.subtotal?.toNumber() || 0,
                shippingCost: o.shippingCost?.toNumber() || 0,
                discountAmount: o.discountAmount?.toNumber() || 0,
                paymentMethod: o.paymentMethod,
                deliveredAt: o.deliveredAt?.toISOString(),
                // Financial audit fields (pre-filled or manually set)
                wholesaleCost: o.wholesaleCost?.toNumber() || null,
                packagingCost: o.packagingCost?.toNumber() || null,
                actualShippingCost: o.actualShippingCost?.toNumber() || null,
                extraExpenses: o.extraExpenses?.toNumber() || null,
                netProfit: o.netProfit?.toNumber() || null,
                isFinanciallyAudited: o.isFinanciallyAudited,
                auditedAt: o.auditedAt?.toISOString(),
                auditedBy: o.auditedBy,
                auditSafe: o.auditSafe,
                auditSafeId: o.auditSafeId,
                auditNotes: o.auditNotes,
                // Items for COGS auto-calculation
                items: o.items.map(i => ({
                    id: i.id,
                    name: i.name,
                    price: i.price.toNumber(),
                    quantity: i.quantity,
                    costAtPurchase: i.costAtPurchase?.toNumber() || 0,
                    sku: i.sku,
                    product: i.product ? {
                        id: i.product.id,
                        name: i.product.name,
                        specs: i.product.specs,
                        costPrice: i.product.costPrice ? i.product.costPrice.toNumber() : null,
                    } : null,
                })),
            })),
            summary: { pendingCount, auditedCount },
            safes,
            month,
            year,
        });
    } catch (error) {
        console.error('Orders Audit GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

/**
 * PUT /api/admin/finance/orders-audit
 * Confirm financial audit for an order
 * Body: { orderId, wholesaleCost, packagingCost, actualShippingCost, extraExpenses, auditSafeId, auditNotes }
 */
export async function PUT(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const body = await request.json();
        const {
            orderId,
            wholesaleCost = 0,
            packagingCost = 0,
            actualShippingCost = 0,
            extraExpenses = 0,
            auditSafeId,
            auditNotes,
            itemCosts,
        } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        // Fetch the order
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { totalPrice: true, discountAmount: true, isFinanciallyAudited: true },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Calculate net profit
        const totalRevenue = order.totalPrice.toNumber();
        const totalCosts = wholesaleCost + packagingCost + actualShippingCost + extraExpenses;
        const netProfit = totalRevenue - totalCosts;

        // Use transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Update individual order item costs if provided
            if (itemCosts && Array.isArray(itemCosts)) {
                for (const itemCost of itemCosts) {
                    await tx.orderItem.update({
                        where: { id: itemCost.itemId },
                        data: { costAtPurchase: itemCost.cost },
                    });
                }
            }

            // Update order with audit data
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    wholesaleCost,
                    packagingCost,
                    actualShippingCost,
                    extraExpenses,
                    netProfit,
                    isFinanciallyAudited: true,
                    auditedAt: new Date(),
                    auditedById: admin.id,
                    auditSafeId: auditSafeId || undefined,
                    auditNotes: auditNotes || undefined,
                },
            });

            // If a safe is specified and this is the first audit (not re-audit), record the income
            if (auditSafeId && !order.isFinanciallyAudited) {
                const safe = await tx.safe.update({
                    where: { id: auditSafeId },
                    data: { balance: { increment: totalRevenue } },
                });

                await tx.safeTransaction.create({
                    data: {
                        safeId: auditSafeId,
                        type: 'CREDIT',
                        amount: totalRevenue,
                        balanceAfter: safe.balance.toNumber(),
                        description: `Order #${updatedOrder.orderNumber} revenue`,
                        referenceType: 'ORDER',
                        referenceId: orderId,
                        createdBy: admin.id,
                    },
                });
            }

            return updatedOrder;
        });

        return NextResponse.json({
            success: true,
            order: {
                id: result.id,
                orderNumber: result.orderNumber,
                netProfit,
                profitMargin: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 1000) / 10 : 0,
            },
        });
    } catch (error) {
        console.error('Orders Audit PUT Error:', error);
        return NextResponse.json({ error: 'Failed to update order audit' }, { status: 500 });
    }
}
