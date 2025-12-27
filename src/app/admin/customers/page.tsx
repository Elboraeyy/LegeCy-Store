import { fetchCustomersPro, CustomerFilterParams } from '@/lib/actions/customer-pro';
import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import CustomerTableClient from '@/components/admin/customers/CustomerTableClient';
import EmptyState from '@/components/admin/EmptyState';
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
        <div>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Customer Management</h1>
                    <p className="admin-subtitle">Advanced CRM and user insights</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ 
                        fontSize: '13px', 
                        color: 'var(--admin-text-muted)', 
                        background: '#fff', 
                        padding: '6px 16px', 
                        borderRadius: '99px', 
                        border: '1px solid var(--admin-border)',
                        fontWeight: 600
                    }}>
                        {total} Customers
                    </span>
                </div>
            </div>

            {data.length === 0 && !params.search ? (
                 <EmptyState
                    icon="👥"
                    title="No customers yet"
                    description="Customers will appear here when they register."
                />
            ) : (
                <CustomerTableClient 
                    data={data} 
                    // total={total} 
                    totalPages={totalPages} 
                    currentPage={params.page || 1}
                    // Pass raw string params to client for simplicity in initial state
                    searchParams={resolvedSearchParams as Record<string, string | undefined>} 
                />
            )}
        </div>
    );
}
