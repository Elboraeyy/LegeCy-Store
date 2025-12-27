'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { reorderCategoriesAction } from '@/lib/actions/category';
import CategoryActions from '@/components/admin/CategoryActions';
import EmptyState from '@/components/admin/EmptyState';
import BrandListClient from '@/components/admin/BrandListClient';
import MaterialListClient from '@/components/admin/MaterialListClient';
import '@/app/admin/admin.css';

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
    parentName: string | null;
    productCount: number;
    sortOrder: number;
    createdAt: string;
}

interface Brand {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    _count: {
        products: number;
    };
}

interface Material {
    id: string;
    name: string;
    slug: string;
    _count: {
        products: number;
    };
}

interface CategoryListClientProps {
    initialCategories: Category[];
    initialBrands?: Brand[];
    initialMaterials?: Material[];
}

export default function CategoryListClient({ initialCategories, initialBrands = [], initialMaterials = [] }: CategoryListClientProps) {
    const [categories, setCategories] = useState(initialCategories);
    const [isReordering, setIsReordering] = useState(false);
    const [loading, setLoading] = useState(false);

    // Toggle Reorder Mode
    const toggleReorder = () => {
        if (isReordering) {
            // Cancelled
            setCategories(initialCategories);
        }
        setIsReordering(!isReordering);
    };

    const saveOrder = async () => {
        setLoading(true);
        try {
            const updates = categories.map(c => ({ id: c.id, sortOrder: c.sortOrder }));
            const result = await reorderCategoriesAction(updates);
            
            if (result.success) {
                toast.success('Category order updated');
                setIsReordering(false);
            } else {
                toast.error(result.error || 'Failed to reorder');
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const moveUp = (index: number) => {
        if (index === 0) return;
        const newCategories = [...categories];
        const temp = newCategories[index];
        newCategories[index] = newCategories[index - 1];
        newCategories[index - 1] = temp;
        // Update sortOrders to reflect new positions
        newCategories.forEach((c, i) => c.sortOrder = i);
        setCategories(newCategories);
    };

    const moveDown = (index: number) => {
        if (index === categories.length - 1) return;
        const newCategories = [...categories];
        const temp = newCategories[index];
        newCategories[index] = newCategories[index + 1];
        newCategories[index + 1] = temp;
        // Update sortOrders
        newCategories.forEach((c, i) => c.sortOrder = i);
        setCategories(newCategories);
    };

    return (
        <div style={{ paddingBottom: '80px' }}>
            {/* Header / Toolbar */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Categories</h1>
                    <p className="admin-subtitle">Organize your products into categories</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {isReordering ? (
                        <>
                             <div className="text-sm text-gray-500 mr-2">Drag or use arrows to reorder</div>
                             <button
                                onClick={toggleReorder}
                                className="admin-btn admin-btn-outline"
                                disabled={loading}
                             >
                                Cancel
                             </button>
                             <button
                                onClick={saveOrder}
                                className="admin-btn admin-btn-primary"
                                disabled={loading}
                             >
                                {loading ? 'Saving...' : 'Save Sorting'}
                             </button>
                        </>
                    ) : (
                        <>
                             <button
                                onClick={toggleReorder}
                                className="admin-btn admin-btn-outline"
                                disabled={categories.length === 0}
                             >
                                ⇅ Reorder
                             </button>
                             <Link href="/admin/categories/new" className="admin-btn admin-btn-primary">
                                + Add Category
                             </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Categories Table */}
            {categories.length === 0 ? (
                 <EmptyState
                    icon="📁"
                    title="No categories yet"
                    description="Create categories to organize your products"
                    actionLabel="Create Category"
                    actionHref="/admin/categories/new"
                />
            ) : (
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
                            {categories.map((category, index) => (
                                <tr key={category.id} className={isReordering ? 'reorder-row' : ''}>
                                    <td>
                                        <div style={{ fontWeight: 600, color: 'var(--admin-text-on-light)' }}>
                                            {category.name}
                                        </div>
                                        {category.description && (
                                           <div style={{ fontSize: '12px', color: '#999', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                               {category.description}
                                           </div>
                                        )}
                                    </td>
                                    <td>
                                        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                                            {category.slug}
                                        </span>
                                    </td>
                                    <td>
                                        {category.parentName || <span style={{ color: '#ccc' }}>—</span>}
                                    </td>
                                    <td>
                                        <span style={{ 
                                            padding: '4px 10px', 
                                            borderRadius: '12px', 
                                            background: category.productCount > 0 ? 'rgba(22, 101, 52, 0.1)' : '#f0f0f0', 
                                            fontSize: '12px', 
                                            fontWeight: 600,
                                            color: category.productCount > 0 ? '#166534' : '#999'
                                        }}>
                                            {category.productCount}
                                        </span>
                                    </td>
                                    <td>
                                        {isReordering ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <button 
                                                    onClick={() => moveUp(index)} 
                                                    disabled={index === 0}
                                                    style={{ padding: '2px', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.3 : 1 }}
                                                >
                                                    ⬆️
                                                </button>
                                                <span style={{ fontWeight: 'bold' }}>{category.sortOrder}</span>
                                                <button 
                                                    onClick={() => moveDown(index)} 
                                                    disabled={index === categories.length - 1}
                                                    style={{ padding: '2px', cursor: index === categories.length - 1 ? 'default' : 'pointer', opacity: index === categories.length - 1 ? 0.3 : 1 }}
                                                >
                                                    ⬇️
                                                </button>
                                            </div>
                                        ) : (
                                            category.sortOrder
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {!isReordering && (
                                            <CategoryActions 
                                                categoryId={category.id} 
                                                hasProducts={category.productCount > 0} 
                                            />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Separator / Brands Section */}
            <div style={{ marginTop: '60px', borderTop: '1px solid #eee', paddingTop: '40px' }}>
                <BrandListClient initialBrands={initialBrands} />
            </div>

            {/* Separator / Materials Section */}
            <div style={{ marginTop: '60px', borderTop: '1px solid #eee', paddingTop: '40px' }}>
                <MaterialListClient initialMaterials={initialMaterials} />
            </div>

        </div>
    );
}
