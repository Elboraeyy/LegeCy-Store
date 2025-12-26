import Link from 'next/link';
import { fetchAllCategories } from '@/lib/actions/category';
import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import EmptyState from '@/components/admin/EmptyState';
import CategoryActions from '@/components/admin/CategoryActions';
import '@/app/admin/admin.css';

export default async function CategoriesPage() {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    const categories = await fetchAllCategories();

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Categories</h1>
                    <p className="admin-subtitle">Organize your products into categories</p>
                </div>
                <Link href="/admin/categories/new" className="admin-btn admin-btn-primary">
                    + Add Category
                </Link>
            </div>

            {/* Categories Table */}
            {categories.length > 0 ? (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Slug</th>
                                <th>Parent</th>
                                <th>Products</th>
                                <th>Order</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((cat) => (
                                <tr key={cat.id}>
                                    <td>
                                        <div style={{ fontWeight: 600, color: 'var(--admin-text-on-light)' }}>
                                            {cat.name}
                                        </div>
                                        {cat.description && (
                                            <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                                                {cat.description.slice(0, 50)}{cat.description.length > 50 ? '...' : ''}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                                            {cat.slug}
                                        </span>
                                    </td>
                                    <td>
                                        {cat.parentName ? (
                                            <span className="status-badge status-pending">{cat.parentName}</span>
                                        ) : (
                                            <span style={{ color: '#999' }}>—</span>
                                        )}
                                    </td>
                                    <td>
                                        <span style={{ 
                                            padding: '4px 10px', 
                                            borderRadius: '12px', 
                                            background: cat.productCount > 0 ? 'rgba(22, 101, 52, 0.1)' : '#f0f0f0', 
                                            fontSize: '12px', 
                                            fontWeight: 600,
                                            color: cat.productCount > 0 ? '#166534' : '#999'
                                        }}>
                                            {cat.productCount}
                                        </span>
                                    </td>
                                    <td style={{ fontFamily: 'monospace' }}>{cat.sortOrder}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <CategoryActions categoryId={cat.id} hasProducts={cat.productCount > 0} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState
                    icon="📁"
                    title="No categories yet"
                    description="Create categories to organize your products"
                    actionLabel="Create Category"
                    actionHref="/admin/categories/new"
                />
            )}
        </div>
    );
}
