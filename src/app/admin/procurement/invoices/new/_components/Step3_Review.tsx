'use client';

import { postInvoiceAction } from '@/lib/actions/inventory-intake';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
    invoiceId: string;
    warehouseId: string;
    onBack: () => void;
}

export function Step3_Review({ invoiceId, warehouseId, onBack }: Props) {
    const router = useRouter();
    const [posting, setPosting] = useState(false);

    async function handlePost() {
        if(!confirm("Are you sure? This will update stock and financials permanently.")) return;
        
        setPosting(true);
        try {
            const res = await postInvoiceAction(invoiceId, warehouseId, 'admin'); // 'admin' placeholder userId
            if (res.success) {
                toast.success('Invoice Posted Successfully');
                router.push(`/admin/procurement/invoices/${invoiceId}`);
            } else {
                toast.error('Error: ' + res.error);
            }
        } catch {
            toast.error('Failed to post');
        } finally {
            setPosting(false);
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto text-center">
            <div className="admin-card border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10">
                 <h3 className="font-bold text-lg mb-2 text-yellow-800 dark:text-yellow-200">⚠ Ready to Post?</h3>
                 <p className="text-muted">
                     This action is <strong>irreversible</strong>. <br/>
                     It will increase stock levels, update cost averages, and create a financial liability (Accounts Payable).
                 </p>
            </div>

            <div className="flex justify-center gap-4 pt-8">
                <button onClick={onBack} className="admin-btn admin-btn-secondary">
                    Back to Edit
                </button>
                <button onClick={handlePost} disabled={posting} className="admin-btn-danger">
                    {posting ? 'Posting...' : 'POST INVOICE'}
                </button>
            </div>
        </div>
    );
}
