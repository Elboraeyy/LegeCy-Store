'use client';

import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';
import { CustomerFilterParams, CustomerProData } from '@/lib/actions/customer-pro';
import CustomerTableClient from '@/components/admin/customers/CustomerTableClient';
import EmptyState from '@/components/admin/EmptyState';

interface CustomersPageClientProps {
    total: number;
    data: CustomerProData[];
    totalPages: number;
    params: CustomerFilterParams;
    searchParams: Record<string, string | undefined>;
}

export default function CustomersPageClient({ 
    total, 
    data, 
    totalPages, 
    params, 
    searchParams 
}: CustomersPageClientProps) {
    const { language } = useLanguage();
    const t = adminDictionary[language].customers;

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">{t.title}</h1>
                    <p className="admin-subtitle">{t.subtitle}</p>
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
                        {total} {t.total_customers}
                    </span>
                </div>
            </div>

            {data.length === 0 && !params.search ? (
                 <EmptyState
                    icon="👥"
                    title={t.no_customers}
                    description={t.no_customers_desc}
                />
            ) : (
                <CustomerTableClient 
                    data={data} 
                    totalPages={totalPages} 
                    currentPage={params.page || 1}
                    searchParams={searchParams} 
                />
            )}
        </div>
    );
}

