import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getAnalyticsTargets } from '@/lib/actions/targets';
import TargetsForm from '@/components/admin/TargetsForm';
import '@/app/admin/admin.css';

export const dynamic = 'force-dynamic';

export default async function TargetsPage() {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    const targets = await getAnalyticsTargets();

    return <TargetsForm initialTargets={targets} />;
}
