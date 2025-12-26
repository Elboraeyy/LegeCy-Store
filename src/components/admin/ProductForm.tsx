"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/admin/ImageUpload";
import { createProductAction, updateProductAction, ProductInput, fetchCategories } from "@/lib/actions/product";
import { toast } from "sonner";
import Link from 'next/link';
import '@/app/admin/admin.css';

interface Category {
    id: string;
    name: string;
}

interface ProductFormProps {
    initialData?: {
        id: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
        images: { url: string }[];
        variants: { sku: string; price: number }[]; 
        stock?: number;
        compareAtPrice?: number | null;
        status?: string;
        categoryId?: string | null;
    } | null;
}

export default function ProductForm({ initialData }: ProductFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // Load categories on mount
    useEffect(() => {
        fetchCategories().then(setCategories).catch(console.error);
    }, []);

    // Initial State defaults
    const defaultVariant = initialData?.variants?.[0];
    
    // Controlled State
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [sku, setSku] = useState(defaultVariant?.sku || "");
    const [price, setPrice] = useState(defaultVariant?.price?.toString() || "");
    const [compareAtPrice, setCompareAtPrice] = useState(initialData?.compareAtPrice?.toString() || "");
    const [stock, setStock] = useState(initialData?.stock?.toString() || "");
    const [status, setStatus] = useState(initialData?.status || "active");
    const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
    
    // Media State
    const [imageUrl, setImageUrl] = useState<string>(initialData?.imageUrl || "");
    const [gallery, setGallery] = useState<string[]>(initialData?.images?.map(img => img.url) || []);

    const title = initialData ? "Edit Product" : "Create Product";
    const action = initialData ? "Save Changes" : "Create Product";

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Comprehensive validation
        if (!name.trim()) {
            toast.error("Product name is required");
            setLoading(false);
            return;
        }

        if (!sku.trim()) {
            toast.error("SKU is required");
            setLoading(false);
            return;
        }

        if (!price || parseFloat(price) <= 0) {
            toast.error("Price must be greater than 0");
            setLoading(false);
            return;
        }

        if (!imageUrl) {
            toast.error("Main image is required");
            setLoading(false);
            return;
        }

        try {
            const payload: ProductInput = {
                name,
                description,
                sku,
                price: parseFloat(price),
                compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
                imageUrl,
                gallery,
                stock: stock ? parseInt(stock) : undefined,
                status,
                categoryId: categoryId || undefined
            };

            if (initialData) {
                await updateProductAction(initialData.id, payload);
                toast.success("Product updated successfully!");
            } else {
                await createProductAction(payload);
                toast.success("Product created successfully!");
            }
            
            router.refresh();
            router.push('/admin/products');
        } catch (error: unknown) {
            // Next.js redirect() throws a special error - let it propagate
            if (error && typeof error === 'object' && 'digest' in error) {
                const digest = (error as { digest?: string }).digest;
                if (digest?.startsWith('NEXT_REDIRECT')) {
                    throw error;
                }
            }
            console.error(error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={onSubmit}>
            {/* Header / Actions */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">{title}</h1>
                    <p className="admin-subtitle">{initialData ? `Editing: ${initialData.name}` : 'Add a new item to the catalog'}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Link href="/admin/products" className="admin-btn admin-btn-outline">
                        Cancel
                    </Link>
                    <button type="submit" disabled={loading} className="admin-btn admin-btn-primary">
                        {loading ? "Saving..." : action}
                    </button>
                </div>
            </div>

            <div className="admin-grid" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start' }}>
                
                {/* Left Column: Main Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Basic Details Card */}
                    <div className="admin-card">
                        <h3 className="stat-label" style={{ marginBottom: '20px' }}>Product Information</h3>
                        
                        <div className="admin-form-group">
                            <label className="stat-label" style={{ fontSize: '11px' }}>Product Name</label>
                            <input 
                                className="form-input" 
                                placeholder="e.g. Royal Oak Offshore" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="admin-form-group" style={{ marginTop: '16px' }}>
                            <label className="stat-label" style={{ fontSize: '11px' }}>Description</label>
                            <textarea 
                                className="form-input" 
                                placeholder="Product description..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={loading}
                                rows={4}
                                style={{ resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    {/* Pricing & Inventory Card */}
                    <div className="admin-card">
                        <h3 className="stat-label" style={{ marginBottom: '20px' }}>Pricing & Inventory</h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>Price (EGP)</label>
                                <input 
                                    className="form-input" 
                                    type="number"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>Compare at Price</label>
                                <input 
                                    className="form-input" 
                                    type="number"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    value={compareAtPrice}
                                    onChange={(e) => setCompareAtPrice(e.target.value)}
                                    disabled={loading}
                                />
                                <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                                    Optional. Show a struck-through price.
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
                             <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>SKU (Stock Keeping Unit)</label>
                                <input 
                                    className="form-input" 
                                    placeholder="e.g. RO-OFF-001"
                                    value={sku}
                                    onChange={(e) => setSku(e.target.value)}
                                    disabled={loading}
                                    required
                                    style={{ fontFamily: 'monospace' }}
                                />
                            </div>

                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>Stock Quantity</label>
                                <input 
                                    className="form-input" 
                                    type="number"
                                    placeholder="0"
                                    min="0"
                                    value={stock}
                                    onChange={(e) => setStock(e.target.value)}
                                    disabled={loading}
                                />
                                <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                                    Initial stock level for this item.
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: Media & Organization */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Media Card */}
                    <div className="admin-card">
                        <h3 className="stat-label" style={{ marginBottom: '20px' }}>Media</h3>
                        
                        <div className="admin-form-group">
                            <label className="stat-label" style={{ fontSize: '11px' }}>Main Image</label>
                            <ImageUpload 
                                value={imageUrl ? [imageUrl] : []}
                                disabled={loading}
                                onChange={(url) => setImageUrl(url)}
                                onRemove={() => setImageUrl("")}
                            />
                        </div>

                        <div className="admin-form-group" style={{ marginTop: '16px' }}>
                            <label className="stat-label" style={{ fontSize: '11px' }}>Gallery</label>
                            <ImageUpload 
                                value={gallery}
                                disabled={loading}
                                onChange={(url) => setGallery([...gallery, url])}
                                onRemove={(url) => setGallery(gallery.filter((current) => current !== url))}
                            />
                        </div>
                    </div>

                    {/* Organization Card */}
                    <div className="admin-card">
                         <h3 className="stat-label" style={{ marginBottom: '20px' }}>Organization</h3>
                         
                         <div className="admin-form-group">
                            <label className="stat-label" style={{ fontSize: '11px' }}>Status</label>
                            <select 
                                className="form-input" 
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                disabled={loading}
                            >
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                         </div>

                         <div className="admin-form-group" style={{ marginTop: '16px' }}>
                            <label className="stat-label" style={{ fontSize: '11px' }}>Category</label>
                            <select 
                                className="form-input"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                disabled={loading}
                            >
                                <option value="">No Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <Link 
                                href="/admin/categories" 
                                style={{ fontSize: '11px', color: 'var(--admin-accent)', marginTop: '4px', display: 'inline-block' }}
                            >
                                Manage Categories →
                            </Link>
                         </div>
                    </div>

                </div>
            </div>
        </form>
    );
}
