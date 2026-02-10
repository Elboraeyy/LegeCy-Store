'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

export default function ProcurementClient() {
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];

    return (
        <div className="fade-in">
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">{t.procurement?.title || 'Procurement'}</h1>
                    <p className="admin-subtitle">{t.procurement?.subtitle || 'Manage suppliers, invoices, and stock intake'}</p>
                </div>
            </div>

            <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                <Link href="/admin/procurement/suppliers" className="admin-card hover:border-accent transition-colors">
                    <h3 className="text-lg font-bold mb-2">{t.procurement?.suppliers || 'Suppliers'}</h3>
                    <p className="text-muted text-sm">{t.procurement?.suppliers_desc || 'Manage supplier database and contacts'}</p>
                </Link>

                <Link href="/admin/procurement/invoices" className="admin-card hover:border-accent transition-colors">
                    <h3 className="text-lg font-bold mb-2">{t.procurement?.invoices || 'Invoices'}</h3>
                    <p className="text-muted text-sm">{t.procurement?.invoices_desc || 'View purchase invoices and draft new ones'}</p>
                </Link>

                <Link href="/admin/procurement/invoices/new" className="admin-card hover:border-accent transition-colors">
                    <h3 className="text-lg font-bold mb-2 text-primary">{t.procurement?.new_stock || 'New Stock Intake'}</h3>
                    <p className="text-muted text-sm">{t.procurement?.new_stock_desc || 'Register new stock from supplier invoice'}</p>
                </Link>
            </div>
        </div>
    );
}
