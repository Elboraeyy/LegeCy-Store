'use client';

import Link from 'next/link';
import BackButton from '@/components/admin/BackButton';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';
import { TeamMember } from '@/lib/actions/team';
import '@/app/admin/admin.css';

interface Props {
    member: TeamMember;
}

export default function ViewMemberDetails({ member }: Props) {
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];

    const formatDate = (date: Date | null | string) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const calculateAge = (birthDate: Date | null | string) => {
        if (!birthDate) return '-';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return `${age} ${t.team.view.labels.year}`;
    };

    return (
        <div>
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
                        <h1 className="admin-title">{t.team.view.title}</h1>
                        <p className="admin-subtitle">{t.team.view.subtitle}</p>
                    </div>
                </div>
                <Link href={`/admin/team/${member.id}/edit`} className="admin-btn admin-btn-primary">
                    ✏️ {t.team.view.edit}
                </Link>
            </div>

            {/* Profile Card */}
            <div className="admin-card" style={{ 
                background: 'linear-gradient(135deg, #1a3c34, #2d5a4e)',
                color: '#fff',
                padding: '32px',
                marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: member.avatar 
                            ? `url(${member.avatar}) center/cover`
                            : 'linear-gradient(135deg, #d4af37, #f0d060)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        fontWeight: 700,
                        color: '#1a3c34'
                    }}>
                        {!member.avatar && member.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: '24px' }}>{member.name}</h2>
                        <p style={{ margin: '4px 0 0', opacity: 0.8 }}>{member.email}</p>
                        <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
                            <span style={{
                                padding: '4px 12px',
                                borderRadius: '99px',
                                fontSize: '11px',
                                fontWeight: 600,
                                background: member.isActive ? 'rgba(22, 101, 52, 0.3)' : 'rgba(185, 28, 28, 0.3)'
                            }}>
                                {member.isActive ? `● ${t.team.view.active}` : `○ ${t.team.view.inactive}`}
                            </span>
                            <span style={{
                                padding: '4px 12px',
                                borderRadius: '99px',
                                fontSize: '11px',
                                background: 'rgba(212, 175, 55, 0.2)'
                            }}>
                                {member.role?.name || t.team.view.no_role}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                
                {/* Contact Information */}
                <div className="admin-card">
                    <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📞</span> {t.team.view.contact_info}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <InfoRow label={t.team.view.labels.email} value={member.email} />
                        <InfoRow label={t.team.view.labels.phone} value={member.phone || '-'} />
                        <InfoRow label={t.team.view.labels.emergency} value={member.emergencyContact || '-'} />
                        <InfoRow label={t.team.view.labels.address} value={member.address || '-'} />
                    </div>
                </div>

                {/* Personal Information */}
                <div className="admin-card">
                    <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>👤</span> {t.team.view.personal_info}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <InfoRow label={t.team.view.labels.national_id} value={member.nationalId || '-'} />
                        <InfoRow label={t.team.view.labels.birth_date} value={formatDate(member.birthDate)} />
                        <InfoRow label={t.team.view.labels.age} value={calculateAge(member.birthDate)} />
                        {member.idCardImage && (
                            <div>
                                <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>{t.team.view.id_image}</div>
                                <a href={member.idCardImage} target="_blank" rel="noopener noreferrer" style={{ color: '#1a3c34', fontSize: '14px' }}>
                                    📎 {t.team.view.view_id}
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Work Information */}
                <div className="admin-card">
                    <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>💼</span> {t.team.view.work_info}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <InfoRow label={t.team.view.labels.position} value={member.position || '-'} />
                        <InfoRow label={t.team.view.labels.role} value={member.role?.name || t.team.view.no_role} />
                        <InfoRow label={t.team.view.labels.salary} value={member.salary ? `${member.salary.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} EGP` : '-'} />
                        <InfoRow label={t.team.view.labels.hire_date} value={formatDate(member.hireDate)} />
                    </div>
                </div>

                {/* Account Information */}
                <div className="admin-card">
                    <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🔐</span> {t.team.view.account_info}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <InfoRow label={t.team.view.labels.account_id} value={member.id.slice(0, 8) + '...'} />
                        <InfoRow label={t.team.view.labels.status} value={member.isActive ? t.team.view.active : t.team.view.inactive} />
                        <InfoRow label={t.team.view.labels.created} value={formatDate(member.createdAt)} />
                        {member.lastLoginAt && <InfoRow label={t.team.view.labels.last_login} value={formatDate(member.lastLoginAt)} />}
                    </div>
                </div>

                {/* Notes */}
                {member.notes && (
                    <div className="admin-card" style={{ gridColumn: '1 / -1' }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>📝</span> {t.team.view.notes}
                        </h3>
                        <p style={{ margin: 0, fontSize: '14px', color: '#555', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {member.notes}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#666' }}>{label}</span>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{value}</span>
        </div>
    );
}
