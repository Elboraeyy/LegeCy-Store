"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';
import { addAddress, deleteAddress } from '@/lib/actions/user';
import { Reveal } from '@/components/ui/Reveal';

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
                toast.success('Address added successfully');
                setIsAdding(false);
                // Refresh logic would ideally involve revalidating path or refetching
                // For now, we rely on router.refresh() or manual update if we returned the new address
                // Since action returns success only, let's reload or we need to fetch again.
                // Simple: reload window or router.refresh()
                window.location.reload();
            } else {
                toast.error(result.error || 'Failed to add address');
            }
        } catch {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this address?')) return;
        
        try {
            const result = await deleteAddress(id);
            if (result.success) {
                toast.success('Address deleted');
                setAddresses(addresses.filter(a => a.id !== id));
            } else {
                toast.error('Failed to delete address');
            }
        } catch {
            toast.error('An error occurred');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontFamily: 'var(--font-heading)' }}>My Addresses</h1>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="btn btn-primary"
                >
                    {isAdding ? 'Cancel' : 'Add New Address'}
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
                                placeholder="Address Name (e.g. Home)" 
                                value={newAddress.type}
                                onChange={e => setNewAddress({...newAddress, type: e.target.value})}
                                style={inputStyle}
                                required
                            />
                            <input 
                                placeholder="Contact Name" 
                                value={newAddress.name}
                                onChange={e => setNewAddress({...newAddress, name: e.target.value})}
                                style={inputStyle}
                                required
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <input 
                                placeholder="Phone Number" 
                                value={newAddress.phone}
                                onChange={e => setNewAddress({...newAddress, phone: e.target.value})}
                                style={inputStyle}
                                required
                            />
                            <input 
                                placeholder="City" 
                                value={newAddress.city}
                                onChange={e => setNewAddress({...newAddress, city: e.target.value})}
                                style={inputStyle}
                                required
                            />
                        </div>
                        <input 
                            placeholder="Full Address / Street" 
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
                            Set as default address
                        </label>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Address'}
                        </button>
                    </form>
                </Reveal>
            )}

            <div style={{ display: 'grid', gap: '16px' }}>
                {addresses.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No addresses saved yet.</p>
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
                                        }}>Default</span>
                                    )}
                                </div>
                                <p><strong>{addr.name}</strong> • {addr.phone}</p>
                                <p style={{ color: 'var(--text-muted)' }}>{addr.street}, {addr.city}</p>
                            </div>
                            <button 
                                onClick={() => handleDelete(addr.id)}
                                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                Delete
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
