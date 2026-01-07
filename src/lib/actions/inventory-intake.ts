'use server';

import prisma from '@/lib/prisma';
import { InventoryIntakeService } from '@/lib/services/inventory-intake';
import { InvoiceStateMachine } from '@/lib/services/invoice-machine';
import { revalidatePath } from 'next/cache';

export async function postInvoiceAction(invoiceId: string, warehouseId: string, adminId: string) {
    try {
        // 1. Fetch current status to determine necessary transitions
        const invoice = await prisma.purchaseInvoice.findUnique({
            where: { id: invoiceId },
            select: { status: true }
        });

        if (!invoice) throw new Error("Invoice not found");

        // 2. Auto-approve if currently in DRAFT or REVIEWED
        // Note: In a stricter system, these would be separate UI actions. 
        // For this Wizard, we assume "Post" implies "I approve and want to commit".
        if (invoice.status === 'DRAFT') {
            await InvoiceStateMachine.transition(invoiceId, 'REVIEWED', adminId);
            await InvoiceStateMachine.transition(invoiceId, 'APPROVED', adminId);
        } else if (invoice.status === 'REVIEWED') {
            await InvoiceStateMachine.transition(invoiceId, 'APPROVED', adminId);
        }

        // 3. Now safe to Post (APPROVED -> POSTED)
        const result = await InventoryIntakeService.postInvoice(invoiceId, warehouseId, adminId);
        
        revalidatePath('/admin/procurement');
        revalidatePath('/admin/finance');
        return { success: true, invoice: result };
    } catch (error) {
        console.error('Failed to post invoice:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

}
