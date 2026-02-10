import { fetchCustomersPro, CustomerFilterParams } from '@/lib/actions/customer-pro';
import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import CustomerTableClient from '@/components/admin/customers/CustomerTableClient';
import EmptyState from '@/components/admin/EmptyState';
import CustomersPageClient from './CustomersPageClient';
import '@/app/admin/admin.css';

export default async function CustomersPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    const resolvedSearchParams = await searchParams;
    
    // Parse params
    const params: CustomerFilterParams = {
        page: Number(resolvedSearchParams.page) || 1,
        pageSize: 10,
        search: (resolvedSearchParams.search as string) || undefined,
        status: (resolvedSearchParams.status as string) || undefined,
        tags: resolvedSearchParams.tags ? (resolvedSearchParams.tags as string).split(',') : undefined,
    };

    const { data, total, totalPages } = await fetchCustomersPro(params);

    return (
        <CustomersPageClient 
            total={total}
            data={data}
            totalPages={totalPages}
            params={params}
            searchParams={resolvedSearchParams as Record<string, string | undefined>}
        />
    );
}
