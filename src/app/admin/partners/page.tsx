'use client';

import '@/app/admin/admin.css';
import { useState, useEffect, useCallback } from 'react';
import { getPartners, createPartner, processPayoutAction } from '@/lib/actions/partners';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

interface Partner {
    id: string;
    name: string;
    email: string | null;
    code: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    commissionRate: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    walletBalance: any;
}

export default function PartnersPage() {
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    
    // Create Form State
    const [newName, setNewName] = useState('');
    const [newCode, setNewCode] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newRate, setNewRate] = useState(0.10);

    // Payout State
    const [payoutPartner, setPayoutPartner] = useState<Partner | null>(null);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [payoutRef, setPayoutRef] = useState('');

    const loadPartners = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getPartners();
            setPartners(data);
        } catch {
            toast.error(t.partners?.failed_load || 'Failed to load partners');
        } finally {
            setLoading(false);
        }
    }, [t.partners?.failed_load]);

    useEffect(() => {
        loadPartners();
    }, [loadPartners]);



    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', newName);
        formData.append('code', newCode);
        formData.append('email', newEmail);
        formData.append('rate', newRate.toString());

        try {
            await createPartner(formData);
            toast.success(t.partners?.partner_created || 'Partner created');
            setShowCreate(false);
            loadPartners();
            // Reset form
            setNewName(''); setNewCode(''); setNewEmail('');
        } catch {
            toast.error(t.partners?.failed_create || 'Failed to create partner');
        }
    };

    const handlePayout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!payoutPartner) return;
        
        try {
            await processPayoutAction(payoutPartner.id, Number(payoutAmount), payoutRef);
            toast.success(t.partners?.payout_processed || 'Payout processed');
            setPayoutPartner(null);
            loadPartners();
        } catch {
            toast.error(t.partners?.payout_failed || 'Payout failed (check balance)');
        }
    };

    return (
        <div className="admin-page">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="admin-title">{t.partners?.title || 'Partner Program'}</h1>
                    <p className="admin-subtitle">{t.partners?.subtitle || 'Manage affiliates, influencers, and commissions'}</p>
                </div>
                <button className="admin-btn admin-btn-primary" onClick={() => setShowCreate(true)}>
                    + {t.partners?.new_partner || 'New Partner'}
                </button>
            </div>

            {/* Partners Table */}
            <div className="admin-card overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-medium text-gray-500">{t.partners?.partner || 'Partner'}</th>
                            <th className="px-6 py-4 font-medium text-gray-500">{t.partners?.code || 'Code'}</th>
                            <th className="px-6 py-4 font-medium text-gray-500 text-right">{t.partners?.rate || 'Rate'}</th>
                            <th className="px-6 py-4 font-medium text-gray-500 text-right">{t.partners?.wallet_balance || 'Wallet Balance'}</th>
                            <th className="px-6 py-4 font-medium text-gray-500 text-right">{t.partners?.actions || 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">{t.partners?.loading || 'Loading...'}</td></tr>
                        ) : partners.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">{t.partners?.no_partners || 'No partners yet.'}</td></tr>
                        ) : partners.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{p.name}</div>
                                    <div className="text-xs text-gray-500">{p.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono">
                                        {p.code}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {(Number(p.commissionRate) * 100).toFixed(0)}%
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`font-bold ${Number(p.walletBalance) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                        {Number(p.walletBalance).toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {Number(p.walletBalance) > 0 && (
                                        <button 
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                            onClick={() => {
                                                setPayoutPartner(p);
                                                setPayoutAmount(p.walletBalance.toString());
                                            }}
                                        >
                                            {t.partners?.payout || 'Payout'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold mb-4">{t.partners?.add_partner || 'Add New Partner'}</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">{t.partners?.partner_name || 'Partner Name'}</label>
                                <input 
                                    className="w-full border rounded px-3 py-2" 
                                    value={newName} onChange={e => setNewName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t.partners?.promo_code || 'Promo Code'}</label>
                                <input 
                                    className="w-full border rounded px-3 py-2 uppercase" 
                                    value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. SUMMER10"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t.partners?.email_optional || 'Email (Optional)'}</label>
                                <input 
                                    className="w-full border rounded px-3 py-2" 
                                    type="email"
                                    value={newEmail} onChange={e => setNewEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t.partners?.commission_rate || 'Commission Rate (Decimal)'}</label>
                                <input 
                                    className="w-full border rounded px-3 py-2" 
                                    type="number" step="0.01" min="0" max="1"
                                    value={newRate} onChange={e => setNewRate(Number(e.target.value))}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">{t.partners?.rate_hint || '0.10 = 10% commission'}</p>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">{t.partners?.cancel || 'Cancel'}</button>
                                <button type="submit" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">{t.partners?.create_partner || 'Create Partner'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payout Modal */}
            {payoutPartner && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold mb-4">{t.partners?.process_payout || 'Process Payout'}</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            {t.partners?.payout_to || 'Payout to'} <strong>{payoutPartner.name}</strong>. {t.partners?.current_balance || 'Current Balance'}: <strong>{Number(payoutPartner.walletBalance).toFixed(2)} EGP</strong>
                        </p>
                        <form onSubmit={handlePayout} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">{t.partners?.amount_to_pay || 'Amount to Pay'}</label>
                                <input 
                                    className="w-full border rounded px-3 py-2" 
                                    type="number" step="0.01" max={payoutPartner.walletBalance}
                                    value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t.partners?.reference || 'Reference (Tx ID / Check #)'}</label>
                                <input 
                                    className="w-full border rounded px-3 py-2" 
                                    value={payoutRef} onChange={e => setPayoutRef(e.target.value)}
                                    placeholder={t.partners?.reference_placeholder || 'Bank Transfer Ref...'}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setPayoutPartner(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">{t.partners?.cancel || 'Cancel'}</button>
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">{t.partners?.confirm_payout || 'Confirm Payout'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
