import { validateAdminSession } from '@/lib/auth/session';
import { redirect, notFound } from 'next/navigation';
import { getTeamMember } from '@/lib/actions/team';
import Link from 'next/link';
import '@/app/admin/admin.css';

export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function ViewMemberPage({ params }: Props) {
    const { user: adminUser } = await validateAdminSession();
    if (!adminUser) redirect('/admin/login');

    const resolvedParams = await params;
    const member = await getTeamMember(resolvedParams.id);
    
    if (!member) notFound();

    const formatDate = (date: Date | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const calculateAge = (birthDate: Date | null) => {
        if (!birthDate) return '-';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return `${age} years`;
    };

    return (
        <div>
            {/* Header */}
            <div className="admin-header" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link 
                        href="/admin/team" 
                        style={{ 
                            fontSize: '24px', 
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            background: '#f3f4f6'
                        }}
                    >
                        ←
                    </Link>
                    <div>
                        <h1 className="admin-title">Team Member Details</h1>
                        <p className="admin-subtitle">View team member information</p>
                    </div>
                </div>
                <Link href={`/admin/team/${member.id}/edit`} className="admin-btn admin-btn-primary">
                    ✏️ Edit Member
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
                                {member.isActive ? '● Active' : '○ Inactive'}
                            </span>
                            <span style={{
                                padding: '4px 12px',
                                borderRadius: '99px',
                                fontSize: '11px',
                                background: 'rgba(212, 175, 55, 0.2)'
                            }}>
                                {member.role?.name || 'No Role'}
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
                        <span>📞</span> Contact Information
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <InfoRow label="Email" value={member.email} />
                        <InfoRow label="Phone" value={member.phone || '-'} />
                        <InfoRow label="Emergency Contact" value={member.emergencyContact || '-'} />
                        <InfoRow label="Address" value={member.address || '-'} />
                    </div>
                </div>

                {/* Personal Information */}
                <div className="admin-card">
                    <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>👤</span> Personal Information
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <InfoRow label="National ID" value={member.nationalId || '-'} />
                        <InfoRow label="Birth Date" value={formatDate(member.birthDate)} />
                        <InfoRow label="Age" value={calculateAge(member.birthDate)} />
                        {member.idCardImage && (
                            <div>
                                <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>ID Card Image</div>
                                <a href={member.idCardImage} target="_blank" rel="noopener noreferrer" style={{ color: '#1a3c34', fontSize: '14px' }}>
                                    📎 View ID Card
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Work Information */}
                <div className="admin-card">
                    <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>💼</span> Work Information
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <InfoRow label="Position" value={member.position || '-'} />
                        <InfoRow label="Role" value={member.role?.name || 'No Role Assigned'} />
                        <InfoRow label="Salary" value={member.salary ? `${member.salary.toLocaleString()} EGP` : '-'} />
                        <InfoRow label="Hire Date" value={formatDate(member.hireDate)} />
                    </div>
                </div>

                {/* Account Information */}
                <div className="admin-card">
                    <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🔐</span> Account Information
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <InfoRow label="Account ID" value={member.id.slice(0, 8) + '...'} />
                        <InfoRow label="Status" value={member.isActive ? 'Active' : 'Inactive'} />
                        <InfoRow label="Created" value={formatDate(member.createdAt)} />
                        <InfoRow label="Last Login" value={formatDate(member.lastLoginAt)} />
                    </div>
                </div>

                {/* Notes */}
                {member.notes && (
                    <div className="admin-card" style={{ gridColumn: '1 / -1' }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>📝</span> Internal Notes
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
