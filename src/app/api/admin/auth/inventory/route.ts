import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;

export async function GET(_request: NextRequest) {
    try {
        // Get inventory with low stock alerts
        const inventory = await prisma.inventory.findMany({
            include: {
                variant: {
                    include: {
                        product: {
                            select: { id: true, name: true, imageUrl: true, status: true }
                        }
                    }
                },
                warehouse: { select: { id: true, name: true, code: true } }
            },
            orderBy: { available: 'asc' }
        });

        const warehouses = await prisma.warehouse.findMany({
            select: { id: true, name: true, code: true, isActive: true, type: true },
            orderBy: { name: 'asc' }
        });

        const alerts = await prisma.stockAlert.findMany({
            where: { status: 'NEW' },
            include: {
                variant: {
                    include: {
                        product: { select: { name: true } }
                    }
                },
                warehouse: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        // Summary stats
        const totalItems = inventory.length;
        const lowStock = inventory.filter(i => i.available > 0 && i.available <= i.minStock).length;
        const outOfStock = inventory.filter(i => i.available <= 0).length;
        const totalUnits = inventory.reduce((sum, i) => sum + i.available, 0);

        return NextResponse.json({
            inventory: inventory.map(i => ({
                id: i.id,
                warehouseId: i.warehouseId,
                warehouseName: i.warehouse.name,
                variantId: i.variantId,
                sku: i.variant.sku,
                productName: i.variant.product.name,
                productImage: i.variant.product.imageUrl,
                productStatus: i.variant.product.status,
                available: i.available,
                reserved: i.reserved,
                minStock: i.minStock,
                isLowStock: i.available > 0 && i.available <= i.minStock,
                isOutOfStock: i.available <= 0,
            })),
            warehouses,
            alerts: alerts.map(a => ({
                id: a.id,
                alertType: a.alertType,
                threshold: a.threshold,
                currentStock: a.currentStock,
                productName: a.variant.product.name,
                sku: a.variant.sku,
                warehouseName: a.warehouse.name,
                createdAt: a.createdAt.toISOString(),
            })),
            summary: { totalItems, lowStock, outOfStock, totalUnits }
        });
    } catch (error) {
        console.error('Inventory GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }
}
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, available, minStock, reason, adminId } = body;

        if (!id) return NextResponse.json({ error: 'Inventory ID is required' }, { status: 400 });

        const currentInv = await prisma.inventory.findUnique({
            where: { id },
            include: { warehouse: true, variant: true }
        });

        if (!currentInv) return NextResponse.json({ error: 'Inventory record not found' }, { status: 404 });

        const updateData: any = {};
        if (available !== undefined) updateData.available = available;
        if (minStock !== undefined) updateData.minStock = minStock;

        const updated = await prisma.inventory.update({
            where: { id },
            data: updateData
        });

        // Log the change if quantity changed
        if (available !== undefined && available !== currentInv.available) {
            await prisma.inventoryLog.create({
                data: {
                    warehouseId: currentInv.warehouseId,
                    variantId: currentInv.variantId,
                    action: available > currentInv.available ? 'ADJUST_UP' : 'ADJUST_DOWN',
                    quantity: Math.abs(available - currentInv.available),
                    balanceAfter: available,
                    reason: reason || 'Manual adjustment via Admin App',
                    adminId: adminId,
                }
            });
        }

        return NextResponse.json({
            message: 'Inventory updated successfully',
            inventory: updated
        });
    } catch (error) {
        console.error('Inventory POST Error:', error);
        return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
    }
}
