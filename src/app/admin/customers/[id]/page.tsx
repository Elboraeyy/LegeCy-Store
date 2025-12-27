import { fetchCustomerDetailsPro } from '@/lib/actions/customer-pro';
import { validateAdminSession } from '@/lib/auth/session';
import { redirect, notFound } from 'next/navigation';
import CustomerProfileClient from '@/components/admin/customers/CustomerProfileClient';
import '@/app/admin/admin.css';

export default async function CustomerDetailsPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    const resolvedParams = await params;
    const customer = await fetchCustomerDetailsPro(resolvedParams.id);

    if (!customer) notFound();

    return <CustomerProfileClient customer={customer} />;
}
