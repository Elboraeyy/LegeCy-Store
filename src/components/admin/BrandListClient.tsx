'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { deleteBrandAction } from '@/lib/actions/brand';
import EmptyState from '@/components/admin/EmptyState';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';
import '@/app/admin/admin.css';

interface Brand {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    _count: {
        products: number;
    };
}

export default function BrandListClient({ initialBrands }: { initialBrands: Brand[] }) {
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
    const [brands, setBrands] = useState(initialBrands);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`${t.brands.confirm_delete || 'Are you sure you want to delete brand'} "${name}"?`)) return;

        setLoading(true);
        try {
            const result = await deleteBrandAction(id);
            if (result.success) {
                toast.success(t.brands.deleted || 'Brand deleted successfully');
                setBrands(prev => prev.filter(b => b.id !== id));
                router.refresh();
            } else {
                toast.error(result.error || t.brands.failed_delete || 'Failed to delete brand');
            }
        } catch (error) {
            console.error(error);
            toast.error(t.brands.error || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (brands.length === 0) {
        return (
            <EmptyState
                icon="🏷️"
                title={t.brands.no_brands}
                description={t.brands.empty_desc || 'Create brands to organize your products'}
                actionLabel={t.brands.add_brand}
                actionHref="/admin/brands/new"
            />
        );
    }

    return (
        <div>
            {/* Header / Toolbar */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">{t.brands.title}</h1>
                    <p className="admin-subtitle">{t.brands.subtitle}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Link href="/admin/brands/new" className="admin-btn admin-btn-primary">
                        + {t.brands.add_brand}
                    </Link>
                </div>
            </div>

            {/* Brands Table */}
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px' }}>{t.brands.image || 'Image'}</th>
                            <th>{t.brands.name || 'Name'}</th>
                            <th>{t.brands.slug || 'Slug'}</th>
                            <th>{t.brands.products || 'Products'}</th>
                            <th style={{ textAlign: 'right' }}>{t.brands.actions || 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {brands.map((brand) => (
                            <tr key={brand.id}>
                                <td>
                                    {brand.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img 
                                            src={brand.imageUrl} 
                                            alt={brand.name} 
                                            style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #eee' }} 
                                        />
                                    ) : (
                                        <div style={{ width: '32px', height: '32px', background: '#f5f5f5', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '10px' }}>
                                            Img
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <div style={{ fontWeight: 600, color: 'var(--admin-text-on-light)' }}>
                                        {brand.name}
                                    </div>
                                </td>
                                <td>
                                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                                        {brand.slug}
                                    </span>
                                </td>
                                <td>
                                    <span style={{ 
                                        padding: '4px 10px', 
                                        borderRadius: '12px', 
                                        background: brand._count.products > 0 ? 'rgba(22, 101, 52, 0.1)' : '#f0f0f0', 
                                        fontSize: '12px', 
                                        fontWeight: 600,
                                        color: brand._count.products > 0 ? '#166534' : '#999'
                                    }}>
                                        {brand._count.products}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                        <Link 
                                            href={`/admin/brands/${brand.id}`} 
                                            className="admin-btn admin-btn-outline"
                                            style={{ padding: '8px 16px', fontSize: '11px' }}
                                        >
                                            {t.brands.edit || 'Edit'}
                                        </Link>
                                        <button 
                                            onClick={() => handleDelete(brand.id, brand.name)}
                                            className="admin-btn admin-btn-outline"
                                            style={{ 
                                                padding: '8px 16px', 
                                                fontSize: '11px',
                                                color: brand._count.products > 0 ? '#999' : '#b91c1c',
                                                borderColor: brand._count.products > 0 ? '#ddd' : '#fecaca'
                                            }}
                                            disabled={loading || brand._count.products > 0}
                                            title={brand._count.products > 0 ? (t.brands.remove_products_first || 'Remove products first') : (t.brands.delete_brand || 'Delete brand')}
                                        >
                                            {t.brands.delete || 'Delete'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
