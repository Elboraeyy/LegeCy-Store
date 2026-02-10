import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getAdminRoles } from '@/lib/actions/team';
import AddMemberForm from './AddMemberForm';
import '@/app/admin/admin.css';

export const dynamic = 'force-dynamic';

export default async function AddMemberPage() {
    const { user: adminUser } = await validateAdminSession();
    if (!adminUser) redirect('/admin/login');

    const roles = await getAdminRoles();

    return (
        <div className="team-page">
            <AddMemberForm roles={roles} />
        </div>
    );
}
