import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getAdminRoles } from '@/lib/actions/team';
import BackButton from '@/components/admin/BackButton';
import AddMemberForm from './AddMemberForm';
import '@/app/admin/admin.css';

export const dynamic = 'force-dynamic';

export default async function AddMemberPage() {
    const { user: adminUser } = await validateAdminSession();
    if (!adminUser) redirect('/admin/login');

    const roles = await getAdminRoles();

    return (
        <div>
            {/* Header */}
            <div className="admin-header" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <BackButton 
                        fallbackHref="/admin/team" 
                        label="←"
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
                        <h1 className="admin-title">Add Team Member</h1>
                        <p className="admin-subtitle">Create a new admin account for your team</p>
                    </div>
                </div>
            </div>

            <AddMemberForm roles={roles} />
        </div>
    );
}
