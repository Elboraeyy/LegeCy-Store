import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/auth/orders
 * List orders with optional filters: status, search, page, limit
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '200');
        const skip = (page - 1) * limit;

        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build where clause
        const where: Record<string, unknown> = {};
        if (status && status !== 'all') {
            where.status = status;
        }

        if (startDate || endDate) {
            const createdAtFilter: { gte?: Date; lte?: Date } = {};
            if (startDate) {
                createdAtFilter.gte = new Date(startDate);
            }
            if (endDate) {
                createdAtFilter.lte = new Date(endDate);
            }
            where.createdAt = createdAtFilter;
        }
        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
                { customerEmail: { contains: search, mode: 'insensitive' } },
                { customerPhone: { contains: search } },
            ];
        }

        const [orders, total, statusCounts] = await Promise.all([
            prisma.order.findMany({
                where,
                select: {
                    id: true,
                    orderNumber: true,
                    customerName: true,
                    firstName: true,
                    lastName: true,
                    customerPhone: true,
                    totalPrice: true,
                    status: true,
                    paymentMethod: true,
                    createdAt: true,
                    shippingCity: true,
                    shippingGovernorate: true,
                    _count: { select: { items: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.order.count({ where }),
            prisma.order.groupBy({
                by: ['status'],
                _count: { _all: true },
            }),
        ]);

        const counts: Record<string, number> = {
            all: await prisma.order.count(),
        };
        statusCounts.forEach((c) => {
            counts[c.status.toLowerCase()] = c._count._all;
        });

        return NextResponse.json({
            orders: orders.map(o => ({
                ...o,
                totalPrice: o.totalPrice.toNumber(),
                displayName: o.customerName || `${o.firstName || ''} ${o.lastName || ''}`.trim() || 'Guest',
                itemCount: o._count.items,
            })),
            total,
            counts,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Mobile Orders List Error:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

/**
 * POST /api/admin/auth/orders
 * Create a manual order
 */
export async function POST(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { createManualOrder } = await import('@/lib/actions/order');
        
        const result = await createManualOrder({
            customer: body.customer,
            shippingAddress: body.shippingAddress,
            items: body.items,
            shippingCost: body.shippingCost,
            discountAmount: body.discountAmount,
            paymentMethod: body.paymentMethod,
            source: body.source,
            notes: body.notes,
            status: body.status,
            createdAt: body.createdAt,
            skipAuthCheck: true,
        });

        if (result.success) {
            return NextResponse.json({ success: true, orderId: result.orderId });
        } else {
            return NextResponse.json({ error: result.error || 'Failed to create order' }, { status: 400 });
        }
    } catch (error) {
        console.error('Mobile Order Create Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
