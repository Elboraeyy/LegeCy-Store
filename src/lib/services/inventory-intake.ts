import prisma from '@/lib/prisma';
import { CostEngine } from './cost-engine';
import { FinancialIntegrator } from './financial-integrator';
import { InvoiceStateMachine } from './invoice-machine';

export class InventoryIntakeService {

    /**
     * Master function to Post an Invoice
     * 1. Validate State
     * 2. Lock Invoice
     * 3. Update Inventory (Qty + Batches)
     * 4. Update Costs (Avg Cost + History)
     * 5. Record Financials
     */
    static async postInvoice(invoiceId: string, warehouseId: string, adminId: string) {
        
        // Transaction to ensure atomicity
        return await prisma.$transaction(async (tx) => {
            
            // 1. Transition State (includes Validation)
            await InvoiceStateMachine.transition(invoiceId, 'POSTED', adminId, tx);
            
            // Fetch Invoice with Items
            const invoice = await tx.purchaseInvoice.findUnique({
                where: { id: invoiceId },
                include: { items: { include: { variant: true } } }
            });

            if (!invoice) throw new Error("Invoice not found");

            // 2. Create StockIn Event
            const stockIn = await tx.stockInEvent.create({
                data: {
                    invoiceId,
                    warehouseId,
                    postedBy: adminId,
                }
            });

            // 3. Process Each Item
            for (const item of invoice.items) {
                if (!item.variantId) continue; // Skip non-stock items (services)

                // Calculate Landed Cost per Unit
                // item.totalCost includes assigned shipping/fees?
                // Assuming item.finalUnitCost is already calculated/distributed before posting
                // or we calculate it here based on total cost
                const unitCost = item.finalUnitCost ?? item.unitCost;

                // A. Create Inventory Batch (FIFO layer)
                await tx.inventoryBatch.create({
                    data: {
                        stockInId: stockIn.id,
                        variantId: item.variantId,
                        initialQuantity: item.quantity,
                        remainingQuantity: item.quantity,
                        unitCost: unitCost,
                        purchaseItemId: item.id,
                    }
                });

                // B. Update/Create Inventory Record in Warehouse
                // Find existing inventory in this warehouse
                const inventory = await tx.inventory.findUnique({
                    where: {
                        warehouseId_variantId: {
                            warehouseId,
                            variantId: item.variantId
                        }
                    }
                });

                const currentStock = inventory ? inventory.available : 0;

                if (inventory) {
                    await tx.inventory.update({
                        where: { id: inventory.id },
                        data: { available: { increment: item.quantity } }
                    });
                } else {
                    await tx.inventory.create({
                        data: {
                            warehouseId,
                            variantId: item.variantId,
                            available: item.quantity,
                        }
                    });
                }

                // C. Update Cost Average (Global or Per-Warehouse? Usually Global)
                const variant = item.variant;
                if (variant) {
                    const newAvgCost = CostEngine.calculateWeightedAverage(
                        currentStock, // This might be total global stock if avg is global
                        variant.costPrice ?? 0,
                        item.quantity,
                        unitCost
                    );

                    // Update Variant Cost
                    await tx.variant.update({
                        where: { id: variant.id },
                        data: { costPrice: newAvgCost }
                    });

                    // Log Cost History
                    await tx.costHistory.create({
                        data: {
                            variantId: variant.id,
                            oldCost: variant.costPrice ?? 0,
                            newCost: newAvgCost,
                            reason: 'INVOICE_POST',
                            referenceId: invoice.id,
                        }
                    });
                }
            }

            // 4. Financials
            await FinancialIntegrator.postInvoiceToLedger(invoice.id, adminId, tx);
            
            return invoice;
        });
    }
}
