'use client';

import { createSupplier } from '@/lib/actions/procurement';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function NewSupplierPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        const data = {
            name: formData.get('name') as string,
            contactPerson: formData.get('contactPerson') as string,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string,
            paymentTerms: formData.get('paymentTerms') as string,
        };

        try {
            await createSupplier(data);
            toast.success('Supplier created successfully');
            router.push('/admin/procurement/suppliers');
        } catch {
            toast.error('Failed to create supplier');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto fade-in">
            <h1 className="admin-title mb-6">New Supplier</h1>
            
            <form action={handleSubmit} className="admin-card space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                        <label>Supplier Name *</label>
                        <input name="name" type="text" className="admin-input" required />
                    </div>
                    <div className="form-group">
                        <label>Contact Person</label>
                        <input name="contactPerson" type="text" className="admin-input" />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input name="email" type="email" className="admin-input" />
                    </div>
                    <div className="form-group">
                        <label>Phone</label>
                        <input name="phone" type="text" className="admin-input" />
                    </div>
                    <div className="form-group">
                        <label>Default Payment Terms</label>
                        <select name="paymentTerms" className="admin-input">
                            <option value="Net 0">Immediate (Net 0)</option>
                            <option value="Net 15">Net 15</option>
                            <option value="Net 30">Net 30</option>
                            <option value="Net 60">Net 60</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="button" onClick={() => router.back()} className="admin-btn-secondary mr-2">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="admin-btn-primary">
                        {loading ? 'Creating...' : 'Create Supplier'}
                    </button>
                </div>
            </form>
        </div>
    );
}
