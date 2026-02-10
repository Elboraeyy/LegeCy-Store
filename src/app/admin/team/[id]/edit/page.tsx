import { validateAdminSession } from '@/lib/auth/session';
import { redirect, notFound } from 'next/navigation';
import { getTeamMember, getAdminRoles } from '@/lib/actions/team';
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

    return <EditMemberForm member={member} roles={roles} />;
}
