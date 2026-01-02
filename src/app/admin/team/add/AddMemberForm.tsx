'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createTeamMember, type TeamMemberData } from '@/lib/actions/team';
import ImageUpload from '@/components/admin/ImageUpload';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';

interface Props {
    roles: { id: string; name: string; description: string | null }[];
}

export default function AddMemberForm({ roles }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<TeamMemberData>({
        email: '',
        password: '',
        name: '',
        username: '',
        phone: '',
        nationalId: '',
        idCardImage: '',
        avatar: '',
        birthDate: '',
        address: '',
        emergencyContact: '',
        position: '',
        salary: undefined,
        hireDate: new Date().toISOString().split('T')[0],
        notes: '',
        roleId: '',
        isActive: true
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await createTeamMember(formData);

        if (result.success) {
            router.push('/admin/team');
        } else {
            setError(result.error || 'Failed to create team member');
            setLoading(false);
        }
    };

    const handleChange = (field: keyof TeamMemberData, value: string | number | boolean | undefined) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && (
                <div style={{
                    padding: '16px',
                    background: '#fee2e2',
                    color: '#b91c1c',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    fontSize: '14px'
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Basic Info Section */}
            <div className="admin-card" style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>👤</span> Basic Information
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            Full Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            required
                            style={inputStyle}
                            placeholder="Enter full name"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            Username (Display Name)
                        </label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => handleChange('username', e.target.value)}
                            style={inputStyle}
                            placeholder="Shown in sidebar"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            Email Address *
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            required
                            style={inputStyle}
                            placeholder="email@example.com"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            Password *
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            required
                            minLength={8}
                            style={inputStyle}
                            placeholder="Minimum 8 characters"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            style={inputStyle}
                            placeholder="01xxxxxxxxx"
                        />
                    </div>
                </div>
            </div>

            {/* Personal Info Section */}
            <div className="admin-card" style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📋</span> Personal Information
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            National ID
                        </label>
                        <input
                            type="text"
                            value={formData.nationalId}
                            onChange={(e) => handleChange('nationalId', e.target.value)}
                            style={inputStyle}
                            placeholder="Enter national ID number"
                            maxLength={14}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            Birth Date
                        </label>
                        <input
                            type="date"
                            value={formData.birthDate}
                            onChange={(e) => handleChange('birthDate', e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            Address
                        </label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            style={inputStyle}
                            placeholder="Full home address"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            Emergency Contact
                        </label>
                        <input
                            type="text"
                            value={formData.emergencyContact}
                            onChange={(e) => handleChange('emergencyContact', e.target.value)}
                            style={inputStyle}
                            placeholder="Name - Phone number"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            ID Card Image
                        </label>
                        <ImageUpload
                            value={formData.idCardImage ? [formData.idCardImage] : []}
                            onChange={(url) => handleChange('idCardImage', url)}
                            onRemove={() => handleChange('idCardImage', '')}
                        />
                    </div>
                </div>
            </div>

            {/* Work Info Section */}
            <div className="admin-card" style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>💼</span> Work Information
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            Position / Job Title
                        </label>
                        <input
                            type="text"
                            value={formData.position}
                            onChange={(e) => handleChange('position', e.target.value)}
                            style={inputStyle}
                            placeholder="e.g., Customer Support, Sales Manager"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            Role / Permissions
                        </label>
                        <AdminDropdown
                            value={formData.roleId || ''}
                            onChange={(val) => handleChange('roleId', val)}
                            placeholder="Select a role"
                            options={[
                                { value: '', label: 'Select a role' },
                                ...roles.map(role => ({ 
                                    value: role.id, 
                                    label: role.name + (role.description ? ` - ${role.description}` : '')
                                }))
                            ]}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            Monthly Salary (EGP)
                        </label>
                        <input
                            type="number"
                            value={formData.salary || ''}
                            onChange={(e) => handleChange('salary', e.target.value ? Number(e.target.value) : undefined)}
                            style={inputStyle}
                            placeholder="0.00"
                            min="0"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            Hire Date
                        </label>
                        <input
                            type="date"
                            value={formData.hireDate}
                            onChange={(e) => handleChange('hireDate', e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            Profile Picture
                        </label>
                        <ImageUpload
                            value={formData.avatar ? [formData.avatar] : []}
                            onChange={(url) => handleChange('avatar', url)}
                            onRemove={() => handleChange('avatar', '')}
                        />
                    </div>
                </div>
            </div>

            {/* Notes Section */}
            <div className="admin-card" style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📝</span> Internal Notes
                </h3>
                
                <div>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => handleChange('notes', e.target.value)}
                        style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                        placeholder="Any internal notes about this team member..."
                    />
                </div>
            </div>

            {/* Status */}
            <div className="admin-card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600 }}>Account Status</h3>
                        <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                            Inactive accounts cannot log in
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleChange('isActive', !formData.isActive)}
                        style={{
                            width: '50px',
                            height: '28px',
                            borderRadius: '14px',
                            background: formData.isActive ? '#12403C' : '#d1d5db',
                            border: 'none',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'background 0.2s'
                        }}
                    >
                        <span style={{
                            position: 'absolute',
                            top: '4px',
                            left: formData.isActive ? '26px' : '4px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#fff',
                            transition: 'left 0.2s',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }} />
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Link 
                    href="/admin/team" 
                    style={{
                        padding: '12px 24px',
                        background: '#f3f4f6',
                        color: '#333',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: 500
                    }}
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: '12px 32px',
                        background: loading ? '#6b7280' : '#12403C',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Adding...' : 'Add Team Member'}
                </button>
            </div>
        </form>
    );
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
};
