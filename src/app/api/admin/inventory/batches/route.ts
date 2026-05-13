import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateAdminSession } from '@/lib/auth/session';

export async function POST(req: Request) {
    try {
        const session = await validateAdminSession();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const body = await req.json();
        const { 
            productId, variantId, quantity, purchaseDate, supplierId, 
            keepOldCost, newCost, keepOldSellPrice, newSellPrice, 
            keepOldExpenses, newExpenses 
        } = body;
        
        if (!productId || !variantId || !quantity) {
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
        const variant = await prisma.variant.findUnique({
            where: { id: variantId },
            include: { product: true }
        });

        if (!variant) return NextResponse.json({ error: 'Variant not found' }, { status: 404 });

        const unitCost = keepOldCost ? (variant.costPrice || 0) : newCost;
        const sellPrice = keepOldSellPrice ? variant.price : newSellPrice;
        
        const specs = variant.product.specs as any || {};
        const expenses = keepOldExpenses ? (specs.additionalCosts || 0) : newExpenses;

        // Execute Transaction
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
                    subtotal: Number(unitCost) * quantity,
                    taxTotal: 0,
                    shippingTotal: 0,
                    discountTotal: 0,
                    grandTotal: Number(unitCost) * quantity,
                    status: 'POSTED',
                }
            });

            // Create Invoice Item
            const invoiceItem = await tx.purchaseInvoiceItem.create({
                data: {
                    invoiceId: invoice.id,
                    productId,
                    variantId,
                    description: `Manual batch addition for ${variant.product.name}`,
                    quantity,
                    unitCost: Number(unitCost),
                    finalUnitCost: Number(unitCost),
                    totalCost: Number(unitCost) * quantity,
                }
            });

            // Create Stock In Event
            const stockIn = await tx.stockInEvent.create({
                data: {
                    invoiceId: invoice.id,
                    warehouseId: warehouse!.id,
                    postedBy: session.user!.id,
                    postedAt: date,
                }
            });

            // Create the smart InventoryBatch
            const batch = await tx.inventoryBatch.create({
                data: {
                    stockInId: stockIn.id,
                    variantId,
                    purchaseItemId: invoiceItem.id,
                    initialQuantity: quantity,
                    remainingQuantity: quantity,
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
                        variantId
                    }
                },
                update: {
                    available: { increment: quantity }
                },
                create: {
                    warehouseId: warehouse!.id,
                    variantId,
                    available: quantity,
                    minStock: 5,
                }
            });

            // Create Inventory Log
            await tx.inventoryLog.create({
                data: {
                    warehouseId: warehouse!.id,
                    variantId,
                    action: 'STOCK_IN_MANUAL',
                    quantity,
                    reason: 'Added new batch manually via smart wizard',
                    adminId: session.user!.id,
                }
            });
            
            // FIFO Logic: If the old quantity was 0, apply the new prices instantly!
            const inventory = await tx.inventory.findUnique({
                where: { warehouseId_variantId: { warehouseId: warehouse!.id, variantId } }
            });
            
            // Available BEFORE this batch was added is (inventory.available - quantity)
            if (inventory && (inventory.available - quantity) <= 0) {
                // Instantly apply the prices if old stock was 0
                if (!keepOldSellPrice) {
                    await tx.variant.update({
                        where: { id: variantId },
                        data: { price: Number(sellPrice) }
                    });
                    
                    // Simple hack if there's only 1 variant:
                    await tx.product.update({
                        where: { id: productId },
                        data: { compareAtPrice: null }
                    });
                }
                
                if (!keepOldCost) {
                    await tx.variant.update({
                        where: { id: variantId },
                        data: { costPrice: Number(unitCost) }
                    });
                    await tx.product.update({
                        where: { id: productId },
                        data: { costPrice: Number(unitCost) }
                    });
                }

                if (!keepOldExpenses) {
                    const existingSpecs = (await tx.product.findUnique({ where: { id: productId } }))?.specs as any || {};
                    existingSpecs.additionalCosts = Number(expenses);
                    await tx.product.update({
                        where: { id: productId },
                        data: { specs: existingSpecs }
                    });
                }
                
                // Mark price as applied
                await tx.inventoryBatch.update({
                    where: { id: batch.id },
                    data: { isPriceApplied: true }
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[InventoryBatch POST] Error:', error);
        return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 });
    }
}
