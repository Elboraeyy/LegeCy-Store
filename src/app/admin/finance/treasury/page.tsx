import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import TreasuryClient from './TreasuryClient';

export const dynamic = 'force-dynamic';

export default async function TreasuryPage() {
    const { user: adminUser } = await validateAdminSession();
    if (!adminUser) redirect('/admin/login');

    return <TreasuryClient />;
}
