import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

const prisma = prismaClient!;

export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const notifications = await prisma.stockNotification.findMany({
            include: {
                product: {
                    select: {
                        name: true,
                        images: {
                            select: { url: true },
                            take: 1,
                        },
                    }
                },
                variant: {
                    select: {
                        sku: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formatted = notifications.map(n => ({
            id: n.id,
            email: n.email,
            whatsapp: n.whatsapp,
            status: n.status,
            channel: n.channel,
            createdAt: n.createdAt.toISOString(),
            productId: n.productId,
            productName: n.product.name,
            productImage: n.product.images[0]?.url ?? null,
            variantId: n.variantId,
            variantName: n.variant?.sku ? `SKU: ${n.variant.sku}` : null,
            sku: n.variant?.sku ?? null,
        }));

        return NextResponse.json({ requests: formatted });
    } catch (error) {
        console.error('Stock Notifications GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch stock notifications' }, { status: 500 });
    }
}
