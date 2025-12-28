import { fetchDashboardStats, DateRangeType } from './dashboard-actions';
import DashboardClient from './DashboardClient';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';

export default async function AdminDashboard({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    await requireAdminPermission(AdminPermissions.DASHBOARD.VIEW);

    const resolvedParams = await searchParams;
    const range = (typeof resolvedParams.range === 'string' ? resolvedParams.range : '30d') as DateRangeType;

    const stats = await fetchDashboardStats({ range });

    return (
        <DashboardClient 
            initialStats={stats} 
            searchParams={{ range }} 
        />
    );
}
