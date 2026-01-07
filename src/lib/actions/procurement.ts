'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';


// ==========================================
// Supplier Actions
// ==========================================

export async function createSupplier(data: {
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    paymentTerms?: string;
}) {
    const supplier = await prisma.supplier.create({
        data: {
            ...data
        }
    });
    revalidatePath('/admin/procurement/suppliers');
    return supplier;
}

import { Prisma } from '@prisma/client';

export async function updateSupplier(id: string, data: Prisma.SupplierUpdateInput) {
    await prisma.supplier.update({
        where: { id },
        data: { ...data }
    });
    revalidatePath(`/admin/procurement/suppliers/${id}`);
}

export async function getSuppliers() {
    return await prisma.supplier.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { invoices: true } } }
    });
}

// ==========================================
// Invoice Actions (Drafting)
// ==========================================

export async function createDraftInvoice(data: {
    supplierId: string;
    invoiceNumber: string;
    issueDate: Date;
    dueDate?: Date;
    notes?: string;
}) {
    const invoice = await prisma.purchaseInvoice.create({
        data: {
            ...data,
            status: 'DRAFT',
            subtotal: 0,
            taxTotal: 0,
            shippingTotal: 0,
            discountTotal: 0,
            grandTotal: 0,
        }
    });
    return invoice;
}

export async function addInvoiceItem(invoiceId: string, item: {
    productId?: string;
    variantId?: string;
    description: string;
    quantity: number;
    unitCost: number;
    taxAmount?: number;
}) {
    const totalCost = item.quantity * item.unitCost;
    
    await prisma.purchaseInvoiceItem.create({
        data: {
            invoiceId,
            productId: item.productId,
            variantId: item.variantId,
            description: item.description,
            quantity: item.quantity,
            unitCost: item.unitCost, // Store as decimal in DB
            taxAmount: item.taxAmount || 0,
            totalCost: totalCost, 
            finalUnitCost: item.unitCost, // Will be updated if shipping added
        }
    });

    await updateInvoiceTotals(invoiceId);
    revalidatePath(`/admin/procurement/invoices/${invoiceId}`);
}

export async function removeInvoiceItem(itemId: string) {
    const item = await prisma.purchaseInvoiceItem.findUnique({ where: { id: itemId } });
    if (!item) return;
    
    await prisma.purchaseInvoiceItem.delete({ where: { id: itemId } });
    await updateInvoiceTotals(item.invoiceId);
    revalidatePath(`/admin/procurement/invoices/${item.invoiceId}`);
}

/**
 * Re-calculate totals for invoice headers
 */
async function updateInvoiceTotals(invoiceId: string) {
    const items = await prisma.purchaseInvoiceItem.findMany({ where: { invoiceId } });
    
    let subtotal = 0;
    let taxTotal = 0;
    
    items.forEach(item => {
        subtotal += Number(item.totalCost);
        taxTotal += Number(item.taxAmount);
    });

    // Fetch existing invoice to get shipping/discount if any
    const existing = await prisma.purchaseInvoice.findUnique({ where: { id: invoiceId } });
    if (!existing) return;

    const grandTotal = subtotal + taxTotal + Number(existing.shippingTotal) - Number(existing.discountTotal);

    await prisma.purchaseInvoice.update({
        where: { id: invoiceId },
        data: {
            subtotal,
            taxTotal,
            grandTotal,
            remainingAmount: grandTotal - Number(existing.paidAmount) 
        }
    });
}

export async function getInvoice(id: string) {
    const invoice = await prisma.purchaseInvoice.findUnique({
        where: { id },
        include: {
            supplier: true,
            items: {
                // orderBy: { createdAt: 'asc' } // PurchaseInvoiceItem doesn't have createdAt yet.
                orderBy: { description: 'asc' }
            },
            attachments: true,
            auditLogs: {
                orderBy: { timestamp: 'desc' },
            },
            stockIn: true,
            ledgerEvents: true
        }
    });

    if (!invoice) return null;

    // Serialize to plain object to handle Prisma Decimals (which are objects) passing to Client
    return JSON.parse(JSON.stringify(invoice));
}
