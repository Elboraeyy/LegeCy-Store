"use server";

import prisma from "@/lib/prisma";
import { validateAdminSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export type PurchaseInvoiceInput = {
  supplierId: string;
  invoiceNumber: string;
  issueDate: Date;
  items: {
    productId?: string;
    variantId?: string; // If known
    description: string;
    sku?: string;
    quantity: number;
    unitCost: number;
    taxAmount?: number;
  }[];
  additionalCosts?: {
    shipping?: number;
    tax?: number;
    discount?: number;
  };
  notes?: string;
  warehouseId: string; // For immediate stock-in
};

/**
 * Creates a Purchase Invoice and optionally immediately processes it as a Stock-In event.
 */
export async function createPurchaseInvoiceAction(data: PurchaseInvoiceInput) {
  const { user } = await validateAdminSession();
  if (!user) throw new Error("Unauthorized");

  // Calculate totals
  const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  const taxTotal = (data.additionalCosts?.tax || 0) + data.items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
  const shippingTotal = data.additionalCosts?.shipping || 0;
  const discountTotal = data.additionalCosts?.discount || 0;
  const grandTotal = subtotal + taxTotal + shippingTotal - discountTotal;

  // 1. Create the Invoice
  const invoice = await prisma.purchaseInvoice.create({
    data: {
      supplierId: data.supplierId,
      invoiceNumber: data.invoiceNumber,
      issueDate: data.issueDate,
      status: "DRAFT", // Will update to POSTED if we process stock immediately
      subtotal,
      taxTotal,
      shippingTotal,
      discountTotal,
      grandTotal,
      remainingAmount: grandTotal, // Initially unpaid
      notes: data.notes,
      items: {
        create: data.items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          description: item.description,
          sku: item.sku,
          quantity: item.quantity,
          unitCost: item.unitCost, // Raw cost
          taxAmount: item.taxAmount || 0,
          // Simple landed cost allocation (pro-rated by value or quantity - defaulting to 0 for now)
          // Ideally we spread shippingTotal across items
          landedCostShare: 0,
          finalUnitCost: item.unitCost, // + landedCostShare
          totalCost: item.quantity * item.unitCost
        }))
      },
      auditLogs: {
        create: {
          action: "CREATED",
          actorId: user.id,
          actorName: user.name,
          details: "Created via Product Flow"
        }
      }
    },
    include: {
      items: true
    }
  });

  // 2. Process Stock In (Immediate Mode)
  // In a robust system this might be a separate step, but for this flow we want immediate stock.

  // Create StockIn Event
  const stockInResult = await prisma.$transaction(async (tx) => {

    const stockIn = await tx.stockInEvent.create({
      data: {
        invoiceId: invoice.id,
        warehouseId: data.warehouseId,
        postedBy: user.id,
        batches: {
          create: invoice.items.map(item => ({
            variantId: item.variantId!, // Must have variant ID for stock
            initialQuantity: item.quantity,
            remainingQuantity: item.quantity,
            unitCost: item.finalUnitCost,
            purchaseItemId: item.id
          }))
        }
      }
    });

    // Update Inventory Levels & Average Cost
    for (const item of invoice.items) {
      if (!item.variantId) continue;

      // Update/Upsert Inventory
      const inventory = await tx.inventory.findUnique({
        where: {
          warehouseId_variantId: {
            warehouseId: data.warehouseId,
            variantId: item.variantId
          }
        }
      });

      const oldQty = inventory?.available || 0;
      const newQty = oldQty + item.quantity;

      await tx.inventory.upsert({
        where: {
          warehouseId_variantId: {
            warehouseId: data.warehouseId,
            variantId: item.variantId
          }
        },
        create: {
          warehouseId: data.warehouseId,
          variantId: item.variantId,
          available: item.quantity
        },
        update: {
          available: { increment: item.quantity }
        }
      });

      // Log it
      await tx.inventoryLog.create({
        data: {
          warehouseId: data.warehouseId,
          variantId: item.variantId,
          action: "PURCHASE_RECEIVE",
          quantity: item.quantity,
          balanceAfter: newQty,
          reason: `Invoice #${data.invoiceNumber}`,
          referenceId: invoice.id,
          adminId: user.id
        }
      });

      // Update Product/Variant Cost Price (Weighted Average)
      // Current Cost * Current Total Qty (across all warehouses? typically yes for logic) 
      // specific warehouse weighted average is complex. Let's use global weighted average for simplicity or just update latest.
      // Simple Weighted Average: ((OldCost * OldTotalQty) + (NewCost * NewQty)) / (OldTotalQty + NewQty)

      const variant = await tx.variant.findUnique({ where: { id: item.variantId } });
      if (variant) {
        // We need total stock across company to do accurate WAC
        // Approximate for now:
        // const currentCost = Number(variant.costPrice || 0);
        // If it's a new product, old variants might be 0

        // Let's just update cost to latest for now if 0, or weighted if we had extensive logic.
        // For this task: Update to latest purchase price is a common simple start for retail.
        // OR implement simple WAC if possible.

        await tx.variant.update({
          where: { id: item.variantId },
          data: { costPrice: item.finalUnitCost }
        });

        // Record Cost History
        if (Number(variant.costPrice) !== Number(item.finalUnitCost)) {
          await tx.costHistory.create({
            data: {
              variantId: item.variantId,
              oldCost: variant.costPrice || 0,
              newCost: item.finalUnitCost,
              reason: "INVOICE_POST",
              referenceId: invoice.id
            }
          })
        }
      }
    }

    // Update Invoice Status
    await tx.purchaseInvoice.update({
      where: { id: invoice.id },
      data: { status: "POSTED", postedDate: new Date() }
    });

    // Update Supplier Balance (AP)
    await tx.accountsPayable.create({
      data: {
        supplierId: data.supplierId,
        invoiceId: invoice.id,
        amount: invoice.remainingAmount, // You owe this
        status: "OPEN"
      }
    });

    await tx.supplier.update({
      where: { id: data.supplierId },
      data: { accountBalance: { increment: invoice.remainingAmount } }
    });

    return stockIn;
  });

  revalidatePath('/admin/procurement');
  revalidatePath('/admin/products');
  return { invoice, stockIn: stockInResult };
}
