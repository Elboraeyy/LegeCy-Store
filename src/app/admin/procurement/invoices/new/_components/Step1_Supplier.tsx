'use client';

import { createDraftInvoice } from '@/lib/actions/procurement';
import { useState } from 'react';
import { toast } from 'sonner';

import { Supplier } from '@prisma/client';

interface Props {
    suppliers: Supplier[];
    onNext: (invoiceId: string) => void;
}

export function Step1_Supplier({ suppliers, onNext }: Props) {
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            const data = {
                supplierId: formData.get('supplierId') as string,
                invoiceNumber: formData.get('invoiceNumber') as string,
                issueDate: new Date(formData.get('issueDate') as string),
                dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : undefined,
                notes: formData.get('notes') as string,
            };

            const invoice = await createDraftInvoice(data);
            toast.success('Draft invoice created');
            onNext(invoice.id);
        } catch (error) {
            toast.error('Failed to create draft');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group col-span-2">
                    <label>Select Supplier</label>
                    <select name="supplierId" className="admin-input" required autoFocus>
                        <option value="">-- Choose Supplier --</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Supplier Invoice #</label>
                    <input name="invoiceNumber" type="text" className="admin-input" required placeholder="e.g. INV-2024-001" />
                </div>

                <div className="form-group">
                    <label>Issue Date</label>
                    <input name="issueDate" type="date" className="admin-input" required defaultValue={new Date().toISOString().split('T')[0]} />
                </div>

                <div className="form-group">
                    <label>Due Date</label>
                    <input name="dueDate" type="date" className="admin-input" />
                </div>

                <div className="form-group col-span-2">
                    <label>Notes</label>
                    <textarea name="notes" className="admin-input" rows={3}></textarea>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button type="submit" disabled={loading} className="admin-btn-primary w-full md:w-auto">
                    {loading ? 'Creating Draft...' : 'Next: Add Items'}
                </button>
            </div>
        </form>
    );
}
