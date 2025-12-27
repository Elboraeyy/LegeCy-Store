'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AnalyticsTargets } from '@/lib/actions/targets';
import { saveAnalyticsTargets } from '@/lib/actions/targets';
import '@/app/admin/admin.css';

interface TargetsFormProps {
    initialTargets: AnalyticsTargets;
}

export default function TargetsForm({ initialTargets }: TargetsFormProps) {
    const [targets, setTargets] = useState(initialTargets);
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const router = useRouter();

    const handleChange = (key: keyof AnalyticsTargets, value: string) => {
        setTargets(prev => ({
            ...prev,
            [key]: parseFloat(value) || 0
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        startTransition(async () => {
            const result = await saveAnalyticsTargets(targets);
            if (result.success) {
                setMessage({ type: 'success', text: 'Targets saved successfully!' });
                setTimeout(() => router.push('/admin/analytics'), 1500);
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to save targets' });
            }
        });
    };

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link href="/admin/analytics" style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        textDecoration: 'none',
                        color: '#333'
                    }}>
                        ←
                    </Link>
                    <div>
                        <h1 className="admin-title">Edit Targets</h1>
                        <p className="admin-subtitle">Set your monthly performance goals</p>
                    </div>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                    color: message.type === 'success' ? '#166534' : '#b91c1c',
                    fontWeight: 500
                }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Revenue Targets */}
                <div className="admin-card" style={{ marginBottom: '24px' }}>
                    <h3 className="stat-label" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>💰</span> Revenue Targets
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
                                Monthly Revenue Target (EGP)
                            </label>
                            <input
                                type="number"
                                value={targets.revenueTarget}
                                onChange={(e) => handleChange('revenueTarget', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #e5e5e5',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: 600
                                }}
                                min={0}
                                step={1000}
                            />
                            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                Current: Set a realistic monthly revenue goal
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
                                Average Order Value Target (EGP)
                            </label>
                            <input
                                type="number"
                                value={targets.aovTarget}
                                onChange={(e) => handleChange('aovTarget', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #e5e5e5',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: 600
                                }}
                                min={0}
                                step={50}
                            />
                            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                Target average order value per customer
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders Targets */}
                <div className="admin-card" style={{ marginBottom: '24px' }}>
                    <h3 className="stat-label" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>📦</span> Orders Targets
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
                                Monthly Orders Target
                            </label>
                            <input
                                type="number"
                                value={targets.ordersTarget}
                                onChange={(e) => handleChange('ordersTarget', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #e5e5e5',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: 600
                                }}
                                min={0}
                                step={10}
                            />
                            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                Total orders you want to achieve this month
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
                                Fulfillment Rate Target (%)
                            </label>
                            <input
                                type="number"
                                value={targets.fulfillmentRateTarget}
                                onChange={(e) => handleChange('fulfillmentRateTarget', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #e5e5e5',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: 600
                                }}
                                min={0}
                                max={100}
                                step={1}
                            />
                            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                Target percentage of orders delivered successfully
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer Targets */}
                <div className="admin-card" style={{ marginBottom: '24px' }}>
                    <h3 className="stat-label" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>👥</span> Customer Targets
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
                                New Customers Target
                            </label>
                            <input
                                type="number"
                                value={targets.customersTarget}
                                onChange={(e) => handleChange('customersTarget', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #e5e5e5',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: 600
                                }}
                                min={0}
                                step={10}
                            />
                            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                Number of new customers to acquire this month
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
                                Repeat Customer Rate Target (%)
                            </label>
                            <input
                                type="number"
                                value={targets.repeatCustomerRateTarget}
                                onChange={(e) => handleChange('repeatCustomerRateTarget', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid #e5e5e5',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: 600
                                }}
                                min={0}
                                max={100}
                                step={1}
                            />
                            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                Target percentage of customers who order again
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Preview */}
                <div className="admin-card" style={{ marginBottom: '24px', background: '#f8f8f8' }}>
                    <h3 className="stat-label" style={{ marginBottom: '16px' }}>Target Summary</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a3c34' }}>
                                {targets.revenueTarget.toLocaleString()} EGP
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Revenue Goal</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a3c34' }}>
                                {targets.ordersTarget.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Orders Goal</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a3c34' }}>
                                {targets.customersTarget.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Customers Goal</div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                    <Link 
                        href="/admin/analytics"
                        className="admin-btn admin-btn-outline"
                        style={{ padding: '12px 24px' }}
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="admin-btn admin-btn-primary"
                        style={{ 
                            padding: '12px 32px',
                            opacity: isPending ? 0.7 : 1
                        }}
                    >
                        {isPending ? 'Saving...' : 'Save Targets'}
                    </button>
                </div>
            </form>
        </div>
    );
}
