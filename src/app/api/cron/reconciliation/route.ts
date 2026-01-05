import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { PermissionError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Inventory Reconciliation Cron Job
 * 
 * Checks for inventory discrepancies:
 * 1. Negative stock values
 * 2. Reserved stock with no pending orders
 * 3. Orphaned reservations
 */
export async function GET(request: Request) {
    const requestId = request.headers.get('x-request-id') || 'reconciliation-' + Date.now();
    const startTime = Date.now();
    
    logger.info('Inventory reconciliation started', { requestId });
    
    try {
        // Security Check
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (config.isProd && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
            logger.warn('Reconciliation unauthorized access attempt', { requestId });
            throw new PermissionError('Unauthorized');
        }

        const issues: Array<{ type: string; details: Record<string, unknown> }> = [];

        // 1. Find negative available stock
        const negativeStock = await prisma.inventory.findMany({
            where: { available: { lt: 0 } },
            include: { variant: { select: { sku: true, product: { select: { name: true } } } } }
        });

        for (const inv of negativeStock) {
            issues.push({
                type: 'NEGATIVE_STOCK',
                details: {
                    inventoryId: inv.id,
                    variantId: inv.variantId,
                    sku: inv.variant.sku,
                    product: inv.variant.product.name,
                    available: inv.available,
                    reserved: inv.reserved
                }
            });
        }

        // 2. Find reserved stock that exceeds total stock
        const invalidReserved = await prisma.inventory.findMany({
            where: {
                reserved: { gt: 0 },
                // Where reserved > total would be invalid
            },
            include: { variant: { select: { sku: true, product: { select: { name: true } } } } }
        });

        for (const inv of invalidReserved) {
            if (inv.reserved > inv.available + inv.reserved) {
                issues.push({
                    type: 'RESERVED_EXCEEDS_TOTAL',
                    details: {
                        inventoryId: inv.id,
                        variantId: inv.variantId,
                        sku: inv.variant.sku,
                        available: inv.available,
                        reserved: inv.reserved
                    }
                });
            }
        }

        // 3. Check for orphaned pending orders (orders pending > 24h without payment intent)
        const oldPendingOrders = await prisma.order.findMany({
            where: {
                status: 'pending',
                paymentMethod: { not: 'cod' },
                createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                paymentIntent: null
            },
            select: { id: true, createdAt: true, paymentMethod: true }
        });

        for (const order of oldPendingOrders) {
            issues.push({
                type: 'ORPHANED_ORDER',
                details: {
                    orderId: order.id,
                    createdAt: order.createdAt,
                    paymentMethod: order.paymentMethod
                }
            });
        }

        // 4. Log issues to store config for admin visibility
        if (issues.length > 0) {
            const issueData = {
                issues: issues.map(i => ({ type: i.type, details: JSON.parse(JSON.stringify(i.details)) })),
                checkedAt: new Date().toISOString(),
                count: issues.length
            };
            
            await prisma.storeConfig.upsert({
                where: { key: 'reconciliation_issues' },
                create: {
                    key: 'reconciliation_issues',
                    value: issueData as unknown as Prisma.InputJsonValue
                },
                update: {
                    value: issueData as unknown as Prisma.InputJsonValue
                }
            });

            logger.warn('Reconciliation found issues', { requestId, issueCount: issues.length });
        }

        // Update last run timestamp
        await prisma.storeConfig.upsert({
            where: { key: 'last_reconciliation' },
            create: {
                key: 'last_reconciliation',
                value: { timestamp: new Date().toISOString() }
            },
            update: {
                value: { timestamp: new Date().toISOString() }
            }
        });

        const duration = Date.now() - startTime;
        
        logger.info('Inventory reconciliation completed', { 
            requestId, 
            issuesFound: issues.length,
            durationMs: duration 
        });

        return NextResponse.json({
            success: true,
            requestId,
            results: {
                issuesFound: issues.length,
                issues: issues.slice(0, 10), // Return first 10 for visibility
            },
            durationMs: duration,
        });

    } catch (error) {
        const duration = Date.now() - startTime;
        
        logger.error('Inventory reconciliation failed', { 
            requestId, 
            error: error instanceof Error ? error.message : 'Unknown',
            durationMs: duration
        });
        
        if (error instanceof PermissionError) {
            return NextResponse.json(
                { error: { code: 'UNAUTHORIZED', message: 'Unauthorized', requestId } },
                { status: 401 }
            );
        }
        
        return NextResponse.json(
            { error: { code: 'RECONCILIATION_ERROR', message: 'Reconciliation failed', requestId } },
            { status: 500 }
        );
    }
}
