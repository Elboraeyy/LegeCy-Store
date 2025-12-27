'use client';

import { useState, useEffect } from 'react';
import { createWarehouse, updateWarehouse, fetchAdminUsersForDropdown, WarehouseFormData, WarehouseWithStats } from '@/lib/actions/warehouse-actions';
import { toast } from 'sonner';

interface WarehouseFormDialogProps {
    warehouse: WarehouseWithStats | null;
    onClose: () => void;
    onSuccess: () => void;
}

const warehouseTypes = [
    { value: 'MAIN', label: 'Main Warehouse', description: 'Primary storage facility' },
    { value: 'REGIONAL', label: 'Regional Hub', description: 'Distribution center for a region' },
    { value: 'DROPSHIP', label: 'Dropship', description: 'Third-party fulfillment' },
    { value: 'RETURNS', label: 'Returns Center', description: 'Processing returned items' },
];

export default function WarehouseFormDialog({ warehouse, onClose, onSuccess }: WarehouseFormDialogProps) {
    const isEdit = !!warehouse;
    
    const [form, setForm] = useState<WarehouseFormData>({
        name: warehouse?.name || '',
        code: warehouse?.code || '',
        address: warehouse?.address || '',
        city: warehouse?.city || '',
        country: warehouse?.country || 'Egypt',
        phone: warehouse?.phone || '',
        email: warehouse?.email || '',
        managerId: warehouse?.managerId || '',
        type: warehouse?.type || 'MAIN',
        notes: warehouse?.notes || '',
    });

    const [admins, setAdmins] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchAdminUsersForDropdown().then(setAdmins);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            toast.error('Warehouse name is required');
            return;
        }

        setLoading(true);
        try {
            const res = isEdit 
                ? await updateWarehouse(warehouse.id, form)
                : await createWarehouse(form);

            if ('error' in res) {
                toast.error(res.error);
            } else {
                toast.success(isEdit ? 'Warehouse updated successfully' : 'Warehouse created successfully');
                onSuccess();
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="confirm-dialog-overlay" onClick={onClose}>
            <div 
                className="confirm-dialog" 
                onClick={(e) => e.stopPropagation()} 
                style={{ maxWidth: '600px', textAlign: 'left', maxHeight: '90vh', overflowY: 'auto' }}
            >
                <div className="confirm-dialog-icon">🏭</div>
                <h2 className="confirm-dialog-title">{isEdit ? 'Edit Warehouse' : 'New Warehouse'}</h2>

                {/* Form Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
                    {/* Name - Full Width */}
                    <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Warehouse Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="e.g., Cairo Main Warehouse"
                        />
                    </div>

                    {/* Code */}
                    <div className="admin-form-group">
                        <label>Code</label>
                        <input
                            type="text"
                            name="code"
                            value={form.code}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="e.g., WH-CAIRO-01"
                        />
                    </div>

                    {/* Type */}
                    <div className="admin-form-group">
                        <label>Type</label>
                        <select
                            name="type"
                            value={form.type}
                            onChange={handleChange}
                            className="form-input"
                        >
                            {warehouseTypes.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Divider */}
                    <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--admin-border)', margin: '8px 0' }} />

                    {/* Address */}
                    <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Address</label>
                        <input
                            type="text"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="Full street address"
                        />
                    </div>

                    {/* City */}
                    <div className="admin-form-group">
                        <label>City</label>
                        <input
                            type="text"
                            name="city"
                            value={form.city}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="e.g., Cairo"
                        />
                    </div>

                    {/* Country */}
                    <div className="admin-form-group">
                        <label>Country</label>
                        <input
                            type="text"
                            name="country"
                            value={form.country}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="e.g., Egypt"
                        />
                    </div>

                    {/* Divider */}
                    <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--admin-border)', margin: '8px 0' }} />

                    {/* Phone */}
                    <div className="admin-form-group">
                        <label>Phone</label>
                        <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="+20 xxx xxx xxxx"
                        />
                    </div>

                    {/* Email */}
                    <div className="admin-form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="warehouse@example.com"
                        />
                    </div>

                    {/* Manager */}
                    <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Warehouse Manager</label>
                        <select
                            name="managerId"
                            value={form.managerId}
                            onChange={handleChange}
                            className="form-input"
                        >
                            <option value="">No manager assigned</option>
                            {admins.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Notes */}
                    <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Internal Notes</label>
                        <textarea
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="Any internal notes about this warehouse..."
                            rows={3}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                    <button type="button" onClick={onClose} className="admin-btn admin-btn-outline">
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        onClick={handleSubmit} 
                        className="admin-btn admin-btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : (isEdit ? 'Update Warehouse' : 'Create Warehouse')}
                    </button>
                </div>
            </div>
        </div>
    );
}
