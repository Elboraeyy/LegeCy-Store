'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createTeamMember, type TeamMemberData } from '@/lib/actions/team';
import ImageUpload from '@/components/admin/ImageUpload';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';
import BackButton from '@/components/admin/BackButton';
import PasswordInput from '@/components/ui/PasswordInput';

interface Props {
    roles: { id: string; name: string; description: string | null }[];
}

export default function AddMemberForm({ roles }: Props) {
    const router = useRouter();
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
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
            setError(result.error || t.team.form.error_create);
            setLoading(false);
        }
    };

    const handleChange = (field: keyof TeamMemberData, value: string | number | boolean | undefined) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="admin-header" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <BackButton
                        fallbackHref="/admin/team"
                        label={language === 'ar' ? '→' : '←'}
                        style={{
                            fontSize: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            background: '#f3f4f6'
                        }}
                    />
                    <div>
                        <h1 className="admin-title">{t.team.form.title_add}</h1>
                        <p className="admin-subtitle">{t.team.form.subtitle_add}</p>
                    </div>
                </div>
            </div>
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
                    <span>👤</span> {t.team.form.basic_info}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            {t.team.form.full_name} *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            required
                            style={inputStyle}
                            placeholder={t.team.form.placeholders.name}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            {t.team.form.username}
                        </label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => handleChange('username', e.target.value)}
                            style={inputStyle}
                            placeholder={t.team.form.placeholders.username}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            {t.team.form.email} *
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            required
                            style={inputStyle}
                            placeholder={t.team.form.placeholders.email}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            {t.team.form.password} *
                        </label>
                        <PasswordInput
                            value={formData.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            required
                            minLength={8}
                            style={inputStyle}
                            placeholder={t.team.form.placeholders.password}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            {t.team.form.phone}
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            style={inputStyle}
                            placeholder={t.team.form.placeholders.phone}
                        />
                    </div>
                </div>
            </div>

            {/* Personal Info Section */}
            <div className="admin-card" style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📋</span> {t.team.form.personal_info}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            {t.team.form.national_id}
                        </label>
                        <input
                            type="text"
                            value={formData.nationalId}
                            onChange={(e) => handleChange('nationalId', e.target.value)}
                            style={inputStyle}
                            placeholder={t.team.form.placeholders.national_id}
                            maxLength={14}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            {t.team.form.birth_date}
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
                            {t.team.form.address}
                        </label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            style={inputStyle}
                            placeholder={t.team.form.placeholders.address}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            {t.team.form.emergency_contact}
                        </label>
                        <input
                            type="text"
                            value={formData.emergencyContact}
                            onChange={(e) => handleChange('emergencyContact', e.target.value)}
                            style={inputStyle}
                            placeholder={t.team.form.placeholders.emergency}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            {t.team.form.id_card}
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
                    <span>💼</span> {t.team.form.work_info}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            {t.team.form.position}
                        </label>
                        <input
                            type="text"
                            value={formData.position}
                            onChange={(e) => handleChange('position', e.target.value)}
                            style={inputStyle}
                            placeholder={t.team.form.placeholders.position}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            {t.team.form.role}
                        </label>
                        <AdminDropdown
                            value={formData.roleId || ''}
                            onChange={(val) => handleChange('roleId', val)}
                            placeholder={t.team.form.placeholders.role}
                            options={[
                                { value: '', label: t.team.form.placeholders.role },
                                ...roles.map(role => ({ 
                                    value: role.id, 
                                    label: role.name + (role.description ? ` - ${role.description}` : '')
                                }))
                            ]}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>
                            {t.team.form.salary}
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
                            {t.team.form.hire_date}
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
                            {t.team.form.avatar}
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
                    <span>📝</span> {t.team.form.notes_info}
                </h3>
                
                <div>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => handleChange('notes', e.target.value)}
                        style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                        placeholder={t.team.form.placeholders.notes}
                    />
                </div>
            </div>

            {/* Status */}
            <div className="admin-card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600 }}>{t.team.form.status}</h3>
                        <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                            {t.team.form.inactive_desc}
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
                    {t.team.form.cancel}
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
                    {loading ? t.team.form.saving : t.team.form.save}
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
