'use client';

import '@/app/admin/admin.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner'; // Assuming sonner is used for toasts
import { previewPeriodClose, closePeriod } from '@/lib/services/accountingPeriodService';
import { FinancialPeriod } from '@prisma/client';

interface PreviewData {
    period: FinancialPeriod;
    journalEntriesCount: number;
    totalDebits: number;
    totalCredits: number;
    ordersCount: number;
    revenueRecognized: number;
    warnings: string[];
}

export default function PeriodClosePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<PreviewData | null>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadPreview();
    }, [params.id]);

    const loadPreview = async () => {
        try {
            const result = await previewPeriodClose(params.id);
            setData(result);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load period details');
            router.push('/admin/finance/periods');
        } finally {
            setLoading(false);
        }
    };

    const handleClosePeriod = async () => {
        if (!confirm('Are you sure you want to PERMANENTLY CLOSE this period? This action cannot be undone easily.')) return;
        
        setProcessing(true);
        try {
            // TODO: Get real admin ID from session
            const adminId = 'system'; 
            await closePeriod(params.id, adminId);
            toast.success('Period closed successfully');
            router.push('/admin/finance/periods');
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error('Failed to close period');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading period data...</div>;
    if (!data) return <div className="p-8 text-center">Period not found</div>;

    return (
        <div className="admin-page">
            <div className="mb-8">
                <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-800 mb-4">
                    ← Back to Periods
                </button>
                <h1 className="admin-title">Period Close: {data.period.name}</h1>
                <p className="admin-subtitle">
                    Follow the steps to validate and lock the financial period.
                </p>
            </div>

            {/* Stepper */}
            <div className="flex items-center mb-8 border-b border-gray-200 pb-4">
                <div className={`step-item ${step >= 1 ? 'active' : ''} ${step === 1 ? 'current' : ''}`}>
                    <div className="step-circle">1</div>
                    <span>Validation</span>
                </div>
                <div className="step-line"></div>
                <div className={`step-item ${step >= 2 ? 'active' : ''} ${step === 2 ? 'current' : ''}`}>
                    <div className="step-circle">2</div>
                    <span>Review</span>
                </div>
                <div className="step-line"></div>
                <div className={`step-item ${step >= 3 ? 'active' : ''} ${step === 3 ? 'current' : ''}`}>
                    <div className="step-circle">3</div>
                    <span>Confirmation</span>
                </div>
            </div>

            {/* Step 1: Validation */}
            {step === 1 && (
                <div className="admin-card max-w-2xl mx-auto">
                    <h2 className="text-xl font-semibold mb-4">Step 1: System Validation</h2>
                    
                    {data.warnings.length > 0 ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                            <h3 className="text-amber-800 font-medium flex items-center gap-2 mb-2">
                                ⚠️ Warnings Found
                            </h3>
                            <ul className="list-disc list-inside text-amber-700 text-sm space-y-1">
                                {data.warnings.map((w, i) => (
                                    <li key={i}>{w}</li>
                                ))}
                            </ul>
                            <p className="mt-4 text-sm text-amber-900">
                                You can proceed, but it is recommended to resolve these issues first.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <h3 className="text-green-800 font-medium flex items-center gap-2">
                                ✅ System Healthy
                            </h3>
                            <p className="text-green-700 text-sm mt-1">
                                No blocking issues found. You are ready to proceed.
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end mt-4">
                        <button 
                            className="admin-btn admin-btn-primary"
                            onClick={() => setStep(2)}
                        >
                            Next: Review →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
                <div className="admin-card max-w-3xl mx-auto">
                    <h2 className="text-xl font-semibold mb-6">Step 2: Financial Snapshot Review</h2>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Journal Entries</p>
                            <p className="text-2xl font-bold">{data.journalEntriesCount}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Orders Processed</p>
                            <p className="text-2xl font-bold">{data.ordersCount}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Total Debits</p>
                            <p className="text-xl font-mono">{data.totalDebits.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Total Credits</p>
                            <p className="text-xl font-mono">{data.totalCredits.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}</p>
                        </div>
                    </div>

                    <div className="border-t pt-6 mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-lg font-medium">Net Revenue Recognized</span>
                            <span className="text-2xl font-bold text-green-700">
                                {data.revenueRecognized.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 text-right">
                            *Excluding Tax and Refunds
                        </p>
                    </div>

                    <div className="flex justify-between mt-8">
                        <button 
                            className="admin-btn admin-btn-outline"
                            onClick={() => setStep(1)}
                        >
                            ← Back
                        </button>
                        <button 
                            className="admin-btn admin-btn-primary"
                            onClick={() => setStep(3)}
                        >
                            Next: Confirm →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
                <div className="admin-card max-w-xl mx-auto text-center py-8">
                    <div className="text-4xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold mb-2">Ready to Close Period?</h2>
                    <p className="text-gray-600 mb-8">
                        This will lock all transactions for <strong>{data.period.name}</strong>.<br/>
                        No further journal entries or order modifications will be allowed for this date range.
                    </p>

                    <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-8 text-left text-sm text-red-800">
                        <strong>Note:</strong> Reopening a closed period requires special administrative privileges and will be logged in the audit trail.
                    </div>

                    <div className="flex justify-between w-full max-w-xs mx-auto">
                        <button 
                            className="admin-btn admin-btn-outline"
                            onClick={() => setStep(2)}
                            disabled={processing}
                        >
                            Back
                        </button>
                        <button 
                            className="admin-btn admin-btn-danger"
                            onClick={handleClosePeriod}
                            disabled={processing}
                        >
                            {processing ? 'Closing...' : 'Confirm & Close Period'}
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .step-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    opacity: 0.5;
                    font-weight: 500;
                }
                .step-item.active {
                    opacity: 1;
                    color: var(--admin-primary);
                }
                .step-item.current {
                    color: var(--admin-primary);
                }
                .step-circle {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background: #eee;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                }
                .step-item.active .step-circle {
                    background: var(--admin-primary);
                    color: white;
                }
                .step-line {
                    flex: 1;
                    height: 2px;
                    background: #eee;
                    margin: 0 16px;
                }
                .admin-btn-primary {
                    background: var(--admin-bg-dark);
                    color: white;
                }
                .admin-btn-danger {
                    background: #dc2626;
                    color: white;
                }
            `}</style>
        </div>
    );
}
