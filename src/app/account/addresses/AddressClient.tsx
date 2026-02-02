"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';
import { addAddress, deleteAddress } from '@/lib/actions/user';
import { Reveal } from '@/components/ui/Reveal';
import { useLanguage } from '@/context/LanguageContext';

interface Address {
    id: string;
    type: string;
    name: string;
    street: string; // was address
    city: string;
    phone: string;
    isDefault: boolean; 
}

interface AddressClientProps {
    initialAddresses: Address[];
}

export default function AddressClient({ initialAddresses }: AddressClientProps) {
    const { t, language } = useLanguage();
    const [addresses, setAddresses] = useState(initialAddresses);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);

    const [newAddress, setNewAddress] = useState({
        type: 'Home',
        name: '',
        phone: '',
        street: '',
        city: '',
        isDefault: false
    });

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await addAddress(newAddress);
            if (result.success) {
                toast.success(t.account.addresses_page.added_success);
                setIsAdding(false);
                // Refresh logic would ideally involve revalidating path or refetching
                // For now, we rely on router.refresh() or manual update if we returned the new address
                // Since action returns success only, let's reload or we need to fetch again.
                // Simple: reload window or router.refresh()
                window.location.reload();
            } else {
                toast.error(result.error || t.account.addresses_page.failed_add);
            }
        } catch {
            toast.error(t.common.error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t.account.addresses_page.confirm_delete)) return;
        
        try {
            const result = await deleteAddress(id);
            if (result.success) {
                toast.success(t.account.addresses_page.deleted_success);
                setAddresses(addresses.filter(a => a.id !== id));
            } else {
                toast.error(t.account.addresses_page.failed_delete);
            }
        } catch {
            toast.error(t.common.error);
        }
    };

    return (
        <div style={{ padding: '20px' }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontFamily: 'var(--font-heading)' }}>{t.account.addresses_page.title}</h1>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="btn btn-primary"
                >
                    {isAdding ? t.account.addresses_page.cancel : t.account.addresses_page.add_new}
                </button>
            </div>

            {isAdding && (
                <Reveal>
                    <form onSubmit={handleAdd} style={{ 
                        background: '#f9f9f9', 
                        padding: '24px', 
                        borderRadius: '12px',
                        marginBottom: '32px',
                        display: 'grid',
                        gap: '16px'
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <input 
                                placeholder={t.account.addresses_page.placeholders.name}
                                value={newAddress.type}
                                onChange={e => setNewAddress({...newAddress, type: e.target.value})}
                                style={inputStyle}
                                required
                            />
                            <input 
                                placeholder={t.account.addresses_page.placeholders.contact}
                                value={newAddress.name}
                                onChange={e => setNewAddress({...newAddress, name: e.target.value})}
                                style={inputStyle}
                                required
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <input 
                                placeholder={t.account.addresses_page.placeholders.phone}
                                value={newAddress.phone}
                                onChange={e => setNewAddress({...newAddress, phone: e.target.value})}
                                style={inputStyle}
                                required
                            />
                            <input 
                                placeholder={t.account.addresses_page.placeholders.city}
                                value={newAddress.city}
                                onChange={e => setNewAddress({...newAddress, city: e.target.value})}
                                style={inputStyle}
                                required
                            />
                        </div>
                        <input 
                            placeholder={t.account.addresses_page.placeholders.street}
                            value={newAddress.street}
                            onChange={e => setNewAddress({...newAddress, street: e.target.value})}
                            style={inputStyle}
                            required
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input 
                                type="checkbox"
                                checked={newAddress.isDefault}
                                onChange={e => setNewAddress({...newAddress, isDefault: e.target.checked})}
                            />
                            {t.account.addresses_page.set_default}
                        </label>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? t.account.addresses_page.saving : t.account.addresses_page.save}
                        </button>
                    </form>
                </Reveal>
            )}

            <div style={{ display: 'grid', gap: '16px' }}>
                {addresses.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>{t.account.addresses_page.no_addresses}</p>
                ) : (
                    addresses.map((addr) => (
                        <div key={addr.id} style={{ 
                            border: '1px solid #eee', 
                            padding: '20px', 
                            borderRadius: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{addr.type}</h3>
                                    {addr.isDefault && (
                                        <span style={{ 
                                            background: '#1a3c34', 
                                            color: '#fff', 
                                            padding: '2px 8px', 
                                            borderRadius: '4px', 
                                            fontSize: '12px' 
                                        }}>{t.account.addresses_page.default}</span>
                                    )}
                                </div>
                                <p><strong>{addr.name}</strong> • {addr.phone}</p>
                                <p style={{ color: 'var(--text-muted)' }}>{addr.street}, {addr.city}</p>
                            </div>
                            <button 
                                onClick={() => handleDelete(addr.id)}
                                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                {t.account.addresses_page.delete}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

const inputStyle = {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    width: '100%'
};
