'use client';

import '@/app/admin/admin.css';
import { useState, useEffect } from 'react';
import { getPartners, createPartner, processPayoutAction } from '@/lib/actions/partners';
import { toast } from 'sonner';

export default function PartnersPage() {
    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    
    // Create Form State
    const [newName, setNewName] = useState('');
    const [newCode, setNewCode] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newRate, setNewRate] = useState(0.10);

    // Payout State
    const [payoutPartner, setPayoutPartner] = useState<any>(null);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [payoutRef, setPayoutRef] = useState('');

    useEffect(() => {
        loadPartners();
    }, []);

    const loadPartners = async () => {
        setLoading(true);
        try {
            const data = await getPartners();
            setPartners(data);
        } catch (error) {
            toast.error('Failed to load partners');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', newName);
        formData.append('code', newCode);
        formData.append('email', newEmail);
        formData.append('rate', newRate.toString());

        try {
            await createPartner(formData);
            toast.success('Partner created');
            setShowCreate(false);
            loadPartners();
            // Reset form
            setNewName(''); setNewCode(''); setNewEmail('');
        } catch (error) {
            toast.error('Failed to create partner');
        }
    };

    const handlePayout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!payoutPartner) return;
        
        try {
            await processPayoutAction(payoutPartner.id, Number(payoutAmount), payoutRef);
            toast.success('Payout processed');
            setPayoutPartner(null);
            loadPartners();
        } catch (error) {
            toast.error('Payout failed (check balance)');
        }
    };

    return (
        <div className="admin-page">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="admin-title">Partner Program</h1>
                    <p className="admin-subtitle">Manage affiliates, influencers, and commissions</p>
                </div>
                <button className="admin-btn admin-btn-primary" onClick={() => setShowCreate(true)}>
                    + New Partner
                </button>
            </div>

            {/* Partners Table */}
            <div className="admin-card overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-medium text-gray-500">Partner</th>
                            <th className="px-6 py-4 font-medium text-gray-500">Code</th>
                            <th className="px-6 py-4 font-medium text-gray-500 text-right">Rate</th>
                            <th className="px-6 py-4 font-medium text-gray-500 text-right">Wallet Balance</th>
                            <th className="px-6 py-4 font-medium text-gray-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading...</td></tr>
                        ) : partners.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No partners yet.</td></tr>
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
                                            Payout
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
                        <h2 className="text-xl font-bold mb-4">Add New Partner</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Partner Name</label>
                                <input 
                                    className="w-full border rounded px-3 py-2" 
                                    value={newName} onChange={e => setNewName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Promo Code</label>
                                <input 
                                    className="w-full border rounded px-3 py-2 uppercase" 
                                    value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. SUMMER10"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email (Optional)</label>
                                <input 
                                    className="w-full border rounded px-3 py-2" 
                                    type="email"
                                    value={newEmail} onChange={e => setNewEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Commission Rate (Decimal)</label>
                                <input 
                                    className="w-full border rounded px-3 py-2" 
                                    type="number" step="0.01" min="0" max="1"
                                    value={newRate} onChange={e => setNewRate(Number(e.target.value))}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">0.10 = 10% commission</p>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">Create Partner</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payout Modal */}
            {payoutPartner && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Process Payout</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Payout to <strong>{payoutPartner.name}</strong>. Current Balance: <strong>{Number(payoutPartner.walletBalance).toFixed(2)} EGP</strong>
                        </p>
                        <form onSubmit={handlePayout} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Amount to Pay</label>
                                <input 
                                    className="w-full border rounded px-3 py-2" 
                                    type="number" step="0.01" max={payoutPartner.walletBalance}
                                    value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Reference (Tx ID / Check #)</label>
                                <input 
                                    className="w-full border rounded px-3 py-2" 
                                    value={payoutRef} onChange={e => setPayoutRef(e.target.value)}
                                    placeholder="Bank Transfer Ref..."
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setPayoutPartner(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Confirm Payout</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
