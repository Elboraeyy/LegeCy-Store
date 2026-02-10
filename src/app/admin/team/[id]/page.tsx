import { validateAdminSession } from '@/lib/auth/session';
import { redirect, notFound } from 'next/navigation';
import { getTeamMember } from '@/lib/actions/team';
import '@/app/admin/admin.css';
import ViewMemberDetails from './ViewMemberDetails';

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

    return <ViewMemberDetails member={member} />;
}
