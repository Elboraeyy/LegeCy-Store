'use server';

import { FinancialIntegrator } from '@/lib/services/financial-integrator';
import { revalidatePath } from 'next/cache';

export async function recordInvoicePaymentAction(
    invoiceId: string,
    amount: number,
    treasuryAccountId: string,
    method: string,
    reference: string,
    adminId: string
) {
    try {
        await FinancialIntegrator.recordPayment(
            invoiceId,
            amount,
            treasuryAccountId,
            method,
            reference,
            adminId
        );
        revalidatePath(`/admin/procurement/invoices/${invoiceId}`);
        revalidatePath('/admin/finance');
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
