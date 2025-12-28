import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateAdminSession } from '@/lib/auth/session';

export async function GET() {
    try {
        // Validate session
        let user;
        try {
            const session = await validateAdminSession();
            user = session?.user;
        } catch {
            // Continue without user if session fails
        }
        
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                categoryRel: {
                    select: { id: true, name: true }
                },
                variants: {
                    include: {
                        inventory: {
                            select: { available: true }
                        }
                    }
                }
            }
        });

        // Transform to match expected format
        const transformed = products.map(p => ({
            ...p,
            category: p.categoryRel,
            categoryId: p.categoryRel?.id || p.categoryId
        }));

        console.log(`[Products API] Fetched ${products.length} products`);
        return NextResponse.json(transformed);
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
