'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Step1_Supplier } from './_components/Step1_Supplier';
import { Step2_Items } from './_components/Step2_Items';
import { Step3_Review } from './_components/Step3_Review';

import { Supplier } from '@prisma/client';

export default function WizardClient({ suppliers, defaultWarehouseId }: { suppliers: Supplier[], defaultWarehouseId: string }) {
    const [step, setStep] = useState(1);
    const [invoiceId, setInvoiceId] = useState<string | null>(null);

    const handleStep1Complete = (id: string) => {
        setInvoiceId(id);
        setStep(2);
    };

    return (
        <div className="fade-in max-w-5xl mx-auto">
            <div className="admin-header">
                <div className="flex flex-col gap-4">
                     <Link href="/admin/procurement/invoices" className="admin-btn admin-btn-secondary w-fit">
                        ← Cancel
                    </Link>
                    <div>
                        <h1 className="admin-title">New Purchase Invoice</h1>
                        <p className="admin-subtitle">Step {step}: {step === 1 ? 'Supplier Details' : step === 2 ? 'Add Items' : 'Review & Post'}</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-6">
                {step === 1 && (
                    <Step1_Supplier suppliers={suppliers} onNext={handleStep1Complete} />
                )}
                
                {step === 2 && invoiceId && (
                    <Step2_Items 
                        invoiceId={invoiceId} 
                        onNext={() => setStep(3)} 
                        onBack={() => setStep(1)} // Note: Back to 1 might need care to not create duplicate drafts
                    />
                )}

                {step === 3 && invoiceId && (
                    <Step3_Review 
                        invoiceId={invoiceId} 
                        warehouseId={defaultWarehouseId}
                        onBack={() => setStep(2)} 
                    />
                )}
            </div>
        </div>
    );
}
