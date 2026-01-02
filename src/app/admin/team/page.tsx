import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getTeamMembers, getAdminRoles } from '@/lib/actions/team';
import Link from 'next/link';
import TeamTable from './TeamTable';
import '@/app/admin/admin.css';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
    const { user: adminUser } = await validateAdminSession();
    if (!adminUser) redirect('/admin/login');

    const [members, roles] = await Promise.all([
        getTeamMembers(),
        getAdminRoles()
    ]);

    const activeCount = members.filter(m => m.isActive).length;
    const inactiveCount = members.filter(m => !m.isActive).length;

    return (
        <div>
            {/* Header */}
            <div className="admin-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 className="admin-title">Team Management</h1>
                    <p className="admin-subtitle">Manage your team members and their access</p>
                </div>
                <Link href="/admin/team/add" className="admin-btn admin-btn-primary">
                    ➕ Add Team Member
                </Link>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div className="admin-card" style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 700, color: '#12403C' }}>{members.length}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Total Members</div>
                </div>
                <div className="admin-card" style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 700, color: '#166534' }}>{activeCount}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Active</div>
                </div>
                <div className="admin-card" style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 700, color: '#b91c1c' }}>{inactiveCount}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Inactive</div>
                </div>
                <div className="admin-card" style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 700, color: '#d4af37' }}>{roles.length}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Roles</div>
                </div>
            </div>

            {/* Team Table */}
            <div className="admin-card">
                <TeamTable members={members} />
            </div>
        </div>
    );
}
