import { validateAdminSession } from '@/lib/auth/session';
import { redirect, notFound } from 'next/navigation';
import { getTeamMember, getAdminRoles } from '@/lib/actions/team';
import Link from 'next/link';
import EditMemberForm from './EditMemberForm';
import '@/app/admin/admin.css';

export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EditMemberPage({ params }: Props) {
    const { user: adminUser } = await validateAdminSession();
    if (!adminUser) redirect('/admin/login');

    const resolvedParams = await params;
    const member = await getTeamMember(resolvedParams.id);

    if (!member) notFound();

    const roles = await getAdminRoles();

    return (
        <div>
            {/* Header */}
            <div className="admin-header" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link 
                        href={`/admin/team/${member.id}`}
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
                        <h1 className="admin-title">Edit Team Member</h1>
                        <p className="admin-subtitle">Update {member.name}&apos;s information</p>
                    </div>
                </div>
            </div>

            <EditMemberForm member={member} roles={roles} />
        </div>
    );
}
