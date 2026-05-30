import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

function toNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    if (value && typeof value === 'object' && 'toNumber' in value && typeof value.toNumber === 'function') {
        return value.toNumber();
    }
    return 0;
}

export async function POST(req: NextRequest) {
    try {
        const admin = await validateMobileToken(req);
        if (!admin?.id) {
            return unauthorizedResponse();
        }
        
        const body = await req.json();
        const { 
            productId, variantId, quantity, purchaseDate, supplierId, 
            keepOldCost, newCost, keepOldSellPrice, newSellPrice, 
            keepOldExpenses, newExpenses 
        } = body;
        const parsedQuantity = Math.trunc(toNumber(quantity));
        
        if (!productId || parsedQuantity <= 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get main warehouse
        let warehouse = await prisma.warehouse.findFirst({ where: { type: 'MAIN' } });
        if (!warehouse) {
            warehouse = await prisma.warehouse.create({
                data: { name: 'Main Warehouse', code: 'WH-MAIN', type: 'MAIN', country: 'Egypt' }
            });
        }

        const date = new Date(purchaseDate || Date.now());

        // Get old variant to fetch old prices
        const variant = variantId
            ? await prisma.variant.findFirst({
                where: { id: variantId, productId },
                include: { product: true }
            })
            : await prisma.variant.findFirst({
                where: { productId },
                include: { product: true },
                orderBy: { createdAt: 'asc' }
            });

        if (!variant) return NextResponse.json({ error: 'Variant not found' }, { status: 404 });

        const specs = (variant.product.specs as Record<string, unknown> & { additionalCosts?: number }) || {};
        const oldExpenses = toNumber(specs.additionalCosts);
        const oldStoredCost = toNumber(variant.costPrice);
        const oldBaseCost = specs.supplierPrice != null
            ? toNumber(specs.supplierPrice)
            : Math.max(oldStoredCost - oldExpenses, 0);

        const unitCost = keepOldCost ? oldBaseCost : toNumber(newCost);
        const sellPrice = keepOldSellPrice ? variant.price : newSellPrice;
        const expenses = keepOldExpenses ? (specs.additionalCosts || 0) : newExpenses;

        // Execute Transaction
        let updatedAvailable = 0;

        await prisma.$transaction(async (tx) => {
            let actualSupplierId = supplierId;
            if (!actualSupplierId) {
                const defSup = await tx.supplier.findFirst({ where: { name: 'Default Supplier' } });
                if (defSup) {
                    actualSupplierId = defSup.id;
                } else {
                    const newSup = await tx.supplier.create({ data: { name: 'Default Supplier' } });
                    actualSupplierId = newSup.id;
                }
            }
            
            // Create Invoice
            const invoice = await tx.purchaseInvoice.create({
                data: {
                    invoiceNumber: `INV-MANUAL-${Date.now()}`,
                    supplierId: actualSupplierId,
                    issueDate: date,
                    subtotal: Number(unitCost) * parsedQuantity,
                    taxTotal: 0,
                    shippingTotal: 0,
                    discountTotal: 0,
                    grandTotal: Number(unitCost) * parsedQuantity,
                    status: 'POSTED',
                }
            });

            // Create Invoice Item
            const invoiceItem = await tx.purchaseInvoiceItem.create({
                data: {
                    invoiceId: invoice.id,
                    productId,
                    variantId: variant.id,
                    description: `Manual batch addition for ${variant.product.name}`,
                    quantity: parsedQuantity,
                    unitCost: Number(unitCost),
                    finalUnitCost: Number(unitCost),
                    totalCost: Number(unitCost) * parsedQuantity,
                }
            });

            // Create Stock In Event
            const stockIn = await tx.stockInEvent.create({
                data: {
                    invoiceId: invoice.id,
                    warehouseId: warehouse!.id,
                    postedBy: admin.id,
                    postedAt: date,
                }
            });

            // Create the smart InventoryBatch
            const batch = await tx.inventoryBatch.create({
                data: {
                    stockInId: stockIn.id,
                    variantId: variant.id,
                    purchaseItemId: invoiceItem.id,
                    initialQuantity: parsedQuantity,
                    remainingQuantity: parsedQuantity,
                    unitCost: Number(unitCost),
                    sellPrice: keepOldSellPrice ? null : Number(sellPrice),
                    compareAtPrice: null,
                    expenses: keepOldExpenses ? null : Number(expenses),
                    isPriceApplied: false,
                    createdAt: date,
                }
            });

            // Update main Inventory counts
            await tx.inventory.upsert({
                where: {
                    warehouseId_variantId: {
                        warehouseId: warehouse!.id,
                        variantId: variant.id
                    }
                },
                update: {
                    available: { increment: parsedQuantity }
                },
                create: {
                    warehouseId: warehouse!.id,
                    variantId: variant.id,
                    available: parsedQuantity,
                    minStock: 5,
                }
            });

            // Create Inventory Log
            await tx.inventoryLog.create({
                data: {
                    warehouseId: warehouse!.id,
                    variantId: variant.id,
                    action: 'STOCK_IN_MANUAL',
                    quantity: parsedQuantity,
                    reason: 'Added new batch manually via smart wizard',
                    adminId: admin.id,
                }
            });

            const updatedInventory = await tx.inventory.findUnique({
                where: { warehouseId_variantId: { warehouseId: warehouse!.id, variantId: variant.id } }
            });
            updatedAvailable = updatedInventory?.available ?? parsedQuantity;
            
            // FIFO Logic: If the old quantity was 0, apply the new prices instantly!
            const inventory = updatedInventory;
            
            // Available BEFORE this batch was added is (inventory.available - quantity)
            if (inventory && (inventory.available - parsedQuantity) <= 0) {
                // Instantly apply the prices if old stock was 0
                if (!keepOldSellPrice) {
                    await tx.variant.update({
                        where: { id: variant.id },
                        data: { price: Number(sellPrice) }
                    });
                    
                    // Simple hack if there's only 1 variant:
                    await tx.product.update({
                        where: { id: productId },
                        data: { compareAtPrice: null }
                    });
                }
                
                if (!keepOldCost || !keepOldExpenses) {
                    const updatedTotalCost = Number(unitCost) + Number(expenses || 0);
                    await tx.variant.update({
                        where: { id: variant.id },
                        data: { costPrice: updatedTotalCost }
                    });
                    await tx.product.update({
                        where: { id: productId },
                        data: { costPrice: updatedTotalCost }
                    });
                }

                if (!keepOldExpenses || !keepOldCost) {
                    const rawSpecs = (await tx.product.findUnique({ where: { id: productId } }))?.specs;
                    const updatedSpecs: Record<string, unknown> = typeof rawSpecs === 'object' && rawSpecs !== null && !Array.isArray(rawSpecs)
                        ? { ...rawSpecs }
                        : {};

                    if (!keepOldCost) {
                        updatedSpecs.supplierPrice = Number(unitCost);
                    }
                    if (!keepOldExpenses) {
                        updatedSpecs.additionalCosts = Number(expenses);
                    }
                        
                    await tx.product.update({
                        where: { id: productId },
                        data: { specs: updatedSpecs as Prisma.InputJsonObject }
                    });
                }
                
                // Mark price as applied
                await tx.inventoryBatch.update({
                    where: { id: batch.id },
                    data: { isPriceApplied: true }
                });
            }
        });

        return NextResponse.json({
            success: true,
            productId,
            variantId: variant.id,
            quantityAdded: parsedQuantity,
            availableAfter: updatedAvailable,
        });
    } catch (error) {
        console.error('[InventoryBatch POST] Error:', error);
        return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 });
    }
}
