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
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Record<string, unknown> = {};
        if (status && status !== 'all') {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { orderNumber: { equals: parseInt(search) || -1 } },
                { customerName: { contains: search, mode: 'insensitive' } },
                { customerEmail: { contains: search, mode: 'insensitive' } },
                { customerPhone: { contains: search } },
            ];
        }

        const [orders, total] = await Promise.all([
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
        ]);

        return NextResponse.json({
            orders: orders.map(o => ({
                ...o,
                totalPrice: o.totalPrice.toNumber(),
                displayName: o.customerName || `${o.firstName || ''} ${o.lastName || ''}`.trim() || 'Guest',
                itemCount: o._count.items,
            })),
            total,
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
