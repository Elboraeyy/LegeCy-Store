'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CustomerDetailsPro, updateCustomerProfile, addCustomerTag, removeCustomerTag } from '@/lib/actions/customer-pro';
import { toast } from 'sonner';
import '@/app/admin/admin.css';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';

interface CustomerProfileProps {
    customer: CustomerDetailsPro;
}

export default function CustomerProfileClient({ customer }: CustomerProfileProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    
    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: customer.name || '',
        phone: customer.phone || '',
        status: customer.status,
        notes: customer.notes || ''
    });

    // Tag State
    const [newTag, setNewTag] = useState('');

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await updateCustomerProfile(customer.id, editForm);
            if (result.success) {
                toast.success('Profile updated');
                setIsEditing(false);
                router.refresh();
            }
        } catch {
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTag.trim()) return;
        
        try {
            await addCustomerTag(customer.id, newTag.trim());
            setNewTag('');
            router.refresh();
        } catch {
            toast.error('Failed to add tag');
        }
    };

    const handleRemoveTag = async (tag: string) => {
        try {
            await removeCustomerTag(customer.id, tag);
            router.refresh();
        } catch {
            toast.error('Failed to remove tag');
        }
    };

    return (
        <div>
             {/* Header */}
             <div className="admin-header">
                <div>
                     <Link href="/admin/customers" style={{ textDecoration: 'none', color: 'var(--admin-text-muted)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                        ← Back to Customers
                     </Link>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ 
                            width: '64px', height: '64px', borderRadius: '50%',
                            background: '#3b82f6', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '24px', fontWeight: 600
                        }}>
                            {customer.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <h1 className="admin-title" style={{ marginBottom: '4px', fontSize: '24px' }}>
                                {customer.name || 'Unknown User'}
                            </h1>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <span className="admin-subtitle" style={{ margin: 0 }}>{customer.email}</span>
                                <span style={{
                                    padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                                    background: customer.status === 'active' ? '#dcfce7' : customer.status === 'banned' ? '#fee2e2' : '#f3f4f6',
                                    color: customer.status === 'active' ? '#166534' : customer.status === 'banned' ? '#991b1b' : '#374151',
                                    border: '1px solid currentColor',
                                    opacity: 0.8
                                }}>
                                    {customer.status.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="admin-btn admin-btn-outline">
                            Edit Profile
                        </button>
                    )}
                </div>
            </div>

            <div className="admin-grid" style={{ gridTemplateColumns: '1fr 2fr 1fr', gap: '24px', alignItems: 'start' }}>
                
                {/* Left Column: Contact & Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Identity Card */}
                    <div className="admin-card">
                        <h3 className="admin-label" style={{ marginBottom: '16px' }}>Contact Information</h3>
                        
                        {isEditing ? (
                            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <label className="admin-label" style={{ fontSize: '11px' }}>Name</label>
                                    <input 
                                        className="form-input" 
                                        value={editForm.name} 
                                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="admin-label" style={{ fontSize: '11px' }}>Phone</label>
                                    <input 
                                        className="form-input" 
                                        value={editForm.phone} 
                                        onChange={e => setEditForm({...editForm, phone: e.target.value})}
                                        placeholder="+20..."
                                    />
                                </div>
                                <div>
                                    <label className="admin-label" style={{ fontSize: '11px' }}>Status</label>
                                    <AdminDropdown
                                        value={editForm.status}
                                        onChange={(val) => setEditForm({...editForm, status: val})}
                                        options={[
                                            { value: 'active', label: 'Active' },
                                            { value: 'banned', label: 'Banned' },
                                            { value: 'archived', label: 'Archived' },
                                        ]}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    <button type="submit" disabled={loading} className="admin-btn admin-btn-primary" style={{ flex: 1 }}>Save</button>
                                    <button type="button" onClick={() => setIsEditing(false)} className="admin-btn admin-btn-outline" style={{ flex: 1 }}>Cancel</button>
                                </div>
                            </form>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <div className="admin-label" style={{ fontSize: '11px', color: '#999' }}>Email</div>
                                    <div style={{ fontSize: '13px' }}>{customer.email}</div>
                                </div>
                                <div>
                                    <div className="admin-label" style={{ fontSize: '11px', color: '#999' }}>Phone</div>
                                    <div style={{ fontSize: '13px' }}>{customer.phone || '—'}</div>
                                </div>
                                <div>
                                    <div className="admin-label" style={{ fontSize: '11px', color: '#999' }}>Joined</div>
                                    <div style={{ fontSize: '13px' }}>{new Date(customer.joinedAt).toLocaleDateString()}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    <div className="admin-card">
                        <h3 className="admin-label" style={{ marginBottom: '16px' }}>Tags</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                            {customer.tags.map(tag => (
                                <span key={tag} style={{ 
                                    background: '#eff6ff', color: '#1e40af', padding: '4px 10px', 
                                    borderRadius: '12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px',
                                    border: '1px solid #dbeafe'
                                }}>
                                    {tag}
                                    <button 
                                        onClick={() => handleRemoveTag(tag)}
                                        style={{ border: 'none', background: 'none', color: '#1e40af', cursor: 'pointer', padding: 0 }}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                            {customer.tags.length === 0 && <span style={{ fontSize: '13px', color: '#999' }}>No tags</span>}
                        </div>
                        <form onSubmit={handleAddTag} style={{ display: 'flex', gap: '8px' }}>
                            <input 
                                className="form-input" 
                                placeholder="Add tag..." 
                                style={{ padding: '6px 12px', fontSize: '13px' }}
                                value={newTag}
                                onChange={e => setNewTag(e.target.value)}
                            />
                            <button type="submit" className="admin-btn admin-btn-outline" style={{ padding: '6px 12px' }}>+</button>
                        </form>
                    </div>

                </div>

                {/* Middle Column: Activity & Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Stats Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        <div className="admin-card" style={{ padding: '16px' }}>
                            <div className="admin-label" style={{ fontSize: '11px', color: '#999' }}>Total Spent</div>
                            <div style={{ fontSize: '18px', fontWeight: 600, marginTop: '4px' }}>
                                {new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(customer.totalSpend)}
                            </div>
                        </div>
                        <div className="admin-card" style={{ padding: '16px' }}>
                            <div className="admin-label" style={{ fontSize: '11px', color: '#999' }}>Orders</div>
                            <div style={{ fontSize: '18px', fontWeight: 600, marginTop: '4px' }}>
                                {customer.totalOrders}
                            </div>
                        </div>
                        <div className="admin-card" style={{ padding: '16px' }}>
                            <div className="admin-label" style={{ fontSize: '11px', color: '#999' }}>Last Order</div>
                            <div style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px' }}>
                                {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'Never'}
                            </div>
                        </div>
                    </div>

                    {/* Orders List */}
                    <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', background: '#f9fafb' }}>
                            <h3 className="admin-label" style={{ margin: 0 }}>Recent Orders</h3>
                        </div>
                        {customer.ordersList.length > 0 ? (
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Amount</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customer.ordersList.map((order) => (
                                        <tr key={order.id}>
                                            <td style={{ fontFamily: 'monospace' }}>#{order.id.slice(0, 8)}</td>
                                            <td style={{ fontSize: '13px' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`status-badge ${
                                                    order.status === 'delivered' ? 'status-paid' :
                                                    order.status === 'cancelled' ? 'status-cancelled' : 'status-pending'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>
                                                {new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(order.totalPrice)}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <Link href={`/admin/orders/${order.id}`} className="admin-btn admin-btn-outline" style={{ padding: '4px 8px', fontSize: '11px' }}>
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
                                No orders found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Notes & Addresses */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Internal Notes */}
                    <div className="admin-card">
                        <h3 className="admin-label" style={{ marginBottom: '12px' }}>Internal Notes</h3>
                        <p style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>Only visible to admins.</p>
                        
                        {isEditing ? (
                            <textarea 
                                className="form-input" 
                                style={{ minHeight: '120px', fontSize: '13px', lineHeight: '1.5' }}
                                value={editForm.notes}
                                onChange={e => setEditForm({...editForm, notes: e.target.value})}
                                placeholder="Add note..."
                            />
                        ) : (
                            <div style={{ 
                                background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', 
                                padding: '12px', fontSize: '13px', color: '#92400e', minHeight: '80px',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {customer.notes || 'No notes added.'}
                            </div>
                        )}
                    </div>

                    {/* Addresses */}
                    <div className="admin-card">
                        <h3 className="admin-label" style={{ marginBottom: '16px' }}>Addresses</h3>
                        {customer.addresses.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {customer.addresses.map((addr) => (
                                    <div key={addr.id} style={{ 
                                        padding: '12px', border: '1px solid #eee', borderRadius: '8px', fontSize: '13px' 
                                    }}>
                                        <div style={{ fontWeight: 600 }}>{addr.name}</div>
                                        <div style={{ color: '#666' }}>{addr.street}</div>
                                        <div style={{ color: '#666' }}>{addr.city}</div>
                                        <div style={{ color: '#999', fontSize: '11px', marginTop: '4px' }}>{addr.phone}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ color: '#999', fontSize: '13px', fontStyle: 'italic' }}>
                                No addresses saved.
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
}
