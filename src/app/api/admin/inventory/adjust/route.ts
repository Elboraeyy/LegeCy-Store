import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { handleApiError } from '@/lib/api-error-handler';
import { InventoryError, ValidationError } from '@/lib/errors';
import { auditService } from '@/lib/services/auditService';
import { headers } from 'next/headers';

/**
 * POST /api/admin/inventory/adjust
 * 
 * Adjust inventory (increase/decrease available stock).
 * Requires: variantId, warehouseId, quantity (+ or -), reason
 * 
 * Rules:
 * - Cannot set available below 0
 * - Cannot modify reserved directly
 * - Must provide reason
 * - Atomic transaction
 * - Audit logged
 */
export async function POST(request: Request) {
    try {
        const { requireAdminPermission } = await import('@/lib/auth/guards');
        const { AdminPermissions } = await import('@/lib/auth/permissions');

        const admin = await requireAdminPermission(AdminPermissions.INVENTORY.MANAGE);

        const body = await request.json();
        const { variantId, warehouseId, quantity, reason } = body;

        // Validation
        if (!variantId || !warehouseId) {
            throw new ValidationError('variantId and warehouseId are required');
        }
        if (typeof quantity !== 'number' || quantity === 0) {
            throw new ValidationError('quantity must be a non-zero number');
        }
        if (!reason || reason.trim().length < 3) {
            throw new ValidationError('reason is required (min 3 characters)');
        }

        // Get IP for audit
        const h = await headers();
        const ip = h.get('x-forwarded-for') || h.get('x-real-ip') || null;
        const ua = h.get('user-agent') || null;

        // Atomic adjustment
        const result = await prisma.$transaction(async (tx) => {
            const inventory = await tx.inventory.findUnique({
                where: {
                    warehouseId_variantId: { warehouseId, variantId }
                }
            });

            if (!inventory) {
                throw new InventoryError('Inventory record not found');
            }

            const newAvailable = inventory.available + quantity;

            // Invariant: Cannot go negative
            if (newAvailable < 0) {
                throw new InventoryError(`Cannot reduce stock below 0. Current: ${inventory.available}, Requested change: ${quantity}`);
            }

            const updated = await tx.inventory.update({
                where: { id: inventory.id },
                data: { available: newAvailable }
            });

            // Audit Log
            await auditService.logAction(
                admin.id,
                quantity > 0 ? 'INVENTORY_INCREASE' : 'INVENTORY_DECREASE',
                'INVENTORY',
                inventory.id,
                {
                    variantId,
                    warehouseId,
                    previousAvailable: inventory.available,
                    newAvailable,
                    change: quantity,
                    reason: reason.trim()
                },
                ip,
                ua,
                tx
            );

            return updated;
        });

        return NextResponse.json({
            success: true,
            inventory: {
                id: result.id,
                available: result.available,
                reserved: result.reserved
            }
        });

    } catch (error) {
        return handleApiError(error);
    }
}
