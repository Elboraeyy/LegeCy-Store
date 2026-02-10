import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getAnalyticsSummary, DateRange } from '@/lib/actions/analytics';
import { getAnalyticsTargets } from '@/lib/actions/targets';
import AnalyticsClient from './AnalyticsClient';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    const resolvedParams = await searchParams;
    const range = (resolvedParams.range as DateRange) || '30d';
    const customStart = resolvedParams.start as string | undefined;
    const customEnd = resolvedParams.end as string | undefined;
    
    // Fetch data and targets in parallel
    const [data, targets] = await Promise.all([
        getAnalyticsSummary(range, customStart, customEnd),
        getAnalyticsTargets()
    ]);

    return (
        <AnalyticsClient
            data={data}
            range={range}
            customStart={customStart}
            customEnd={customEnd}
            targets={targets}
        />
    );
}
