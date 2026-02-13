"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/admin/ImageUpload";
import { createProductAction, updateProductAction, ProductInput, fetchCategories } from "@/lib/actions/product";
import { fetchAllBrands } from "@/lib/actions/brand";
import { fetchAllMaterials } from "@/lib/actions/material";
import { fetchWarehouses } from "@/lib/actions/warehouse-actions";
// import { createPurchaseInvoiceAction } from "@/lib/actions/procurement-actions"; 
import { toast } from "sonner";
import Link from 'next/link';
import '@/app/admin/admin.css';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import SupplierSelect from "@/components/admin/procurement/SupplierSelect";
import ProductPicker from "@/components/admin/ProductPicker";

interface Category {
    id: string;
    name: string;
}

interface ProductFormProps {
    initialData?: {
        id: string;
        name: string;
        nameAr?: string | null;
        description: string | null;
        descriptionAr?: string | null;
        detailedDescription: string | null;
        detailedDescriptionAr?: string | null;
        imageUrl: string | null;
        images: { url: string }[];
        variants: { sku: string; price: number }[]; 
        stock?: number;
        compareAtPrice?: number | null;
        costPrice?: number | null;
        status?: string;
        categoryId?: string | null;
        brandId?: string | null;
        materialId?: string | null;
        showInNewArrivals?: boolean;
        showInForYou?: boolean;
        detailTags?: string[];
        similarProducts?: { id: string }[];

        // SEO
        slug?: string | null;
        metaTitle?: string | null;
        metaDescription?: string | null;
        metaTitleAr?: string | null;
        metaDescriptionAr?: string | null;

        specs?: {
            dialSize?: string;
            dialColor?: string;
            caseColor?: string;
            strapColor?: string;
            strapMaterial?: string;
            strapWidth?: string;
            movement?: string;
            glass?: string;
            waterResistance?: string;
            case?: string;
            hourMarkers?: string;
        };
    } | null;
}

export default function ProductForm({ initialData }: ProductFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'basic' | 'merchandising' | 'sourcing'>('basic');

    // Data Sources
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
    const [materials, setMaterials] = useState<{ id: string; name: string }[]>([]);
    const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                 const [cats, brs, mats, whs] = await Promise.all([
                     fetchCategories(),
                     fetchAllBrands(),
                     fetchAllMaterials(),
                     fetchWarehouses()
                 ]);
                 setCategories(cats);
                 setBrands(brs);
                 setMaterials(mats);
                 setWarehouses(whs.map(w => ({ id: w.id, name: w.name })));
            } catch (error) {
                console.error("Failed to load form data", error);
            }
        };
        load();
    }, []);

    // Initial State defaults
    const defaultVariant = initialData?.variants?.[0];
    
    // --- Basic Info ---
    const [name, setName] = useState(initialData?.name || "");
    const [nameAr, setNameAr] = useState(initialData?.nameAr || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [descriptionAr, setDescriptionAr] = useState(initialData?.descriptionAr || "");
    const [detailedDescription, setDetailedDescription] = useState(initialData?.detailedDescription || "");
    const [detailedDescriptionAr, setDetailedDescriptionAr] = useState(initialData?.detailedDescriptionAr || "");
    
    // --- Pricing & core ---
    const [sku, setSku] = useState(defaultVariant?.sku || "");
    const [price, setPrice] = useState(defaultVariant?.price?.toString() || "");
    const [compareAtPrice, setCompareAtPrice] = useState(initialData?.compareAtPrice?.toString() || "");
    const [status, setStatus] = useState(initialData?.status || "active");
    const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
    const [brandId, setBrandId] = useState(initialData?.brandId || "");
    const [materialId, setMaterialId] = useState(initialData?.materialId || "");
    
    // --- Merchandising ---
    const [showInNewArrivals, setShowInNewArrivals] = useState(initialData?.showInNewArrivals ?? true);
    const [showInForYou, setShowInForYou] = useState(initialData?.showInForYou ?? true);
    // Detail tags as comma separated string for input
    const [detailTagsInput, setDetailTagsInput] = useState((initialData?.detailTags || []).join(", "));
    const [similarProductIds, setSimilarProductIds] = useState<string[]>(initialData?.similarProducts?.map(p => p.id) || []);

    // --- Media ---
    const [imageUrl, setImageUrl] = useState<string>(initialData?.imageUrl || "");
    const [gallery, setGallery] = useState<string[]>(initialData?.images?.map(img => img.url) || []);

    // --- SEO ---
    const [slug, setSlug] = useState(initialData?.slug || "");
    const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || "");
    const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || "");
    const [metaTitleAr, setMetaTitleAr] = useState(initialData?.metaTitleAr || "");
    const [metaDescriptionAr, setMetaDescriptionAr] = useState(initialData?.metaDescriptionAr || "");

    // --- Specifications ---
    const [specs, setSpecs] = useState({
        dialSize: initialData?.specs?.dialSize || "",
        dialColor: initialData?.specs?.dialColor || "",
        caseColor: initialData?.specs?.caseColor || "",
        strapColor: initialData?.specs?.strapColor || "",
        strapMaterial: initialData?.specs?.strapMaterial || "",
        strapWidth: initialData?.specs?.strapWidth || "",
        movement: initialData?.specs?.movement || "",
        glass: initialData?.specs?.glass || "",
        waterResistance: initialData?.specs?.waterResistance || "",
        case: initialData?.specs?.case || "",
        hourMarkers: initialData?.specs?.hourMarkers || ""
    });

    // --- Sourcing & Inventory (New Mode) ---
    // Mode: 'create_new' (standard) or 'add_stock' (for existing) - usually for NEW page.
    // But here we are in ProductForm which handles Edit too.
    // If Edit: 'add_stock' workflow might be confusing here. Usually separate.
    // For 'Create': we can support full procurement.
    
    const [stock, setStock] = useState(initialData?.stock?.toString() || ""); // Initial stock count
    const [warehouseId, setWarehouseId] = useState("");
    
    // Procurement Fields
    const [supplierId, setSupplierId] = useState("");
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [unitCost, setUnitCost] = useState(initialData?.costPrice?.toString() || ""); 
    
    const title = initialData ? "Edit Product" : "Create Product";
    const action = initialData ? "Save Changes" : "Create Product";

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Validation
        if (!name.trim()) { toast.error("Product name is required"); setLoading(false); return; }
        if (!sku.trim()) { toast.error("SKU is required"); setLoading(false); return; }
        if (!price || parseFloat(price) <= 0) { toast.error("Price must be > 0"); setLoading(false); return; }
        if (!imageUrl) { toast.error("Main image is required"); setLoading(false); return; }

        try {
            // Prepare Common Payload
            const payload: ProductInput = {
                name,
                nameAr: nameAr || undefined,
                description: description || undefined,
                descriptionAr: descriptionAr || undefined,
                detailedDescription: detailedDescription || undefined,
                detailedDescriptionAr: detailedDescriptionAr || undefined,
                sku,
                price: parseFloat(price),
                compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
                costPrice: unitCost ? parseFloat(unitCost) : undefined,
                imageUrl,
                gallery,
                stock: stock ? parseInt(stock) : undefined,
                status,
                categoryId: categoryId || undefined,
                brandId: brandId || undefined,
                materialId: materialId || undefined,
                warehouseId: warehouseId || undefined,
                // New Fields
                showInNewArrivals,
                showInForYou,
                detailTags: detailTagsInput.split(",").map(t => t.trim()).filter(Boolean),
                similarProductIds,

                // SEO Fields
                slug: slug || undefined,
                metaTitle: metaTitle || undefined,
                metaDescription: metaDescription || undefined,
                metaTitleAr: metaTitleAr || undefined,
                metaDescriptionAr: metaDescriptionAr || undefined,

                // Specs
                specs: {
                    ...specs,
                    // Filter out empty strings
                    dialSize: specs.dialSize || undefined,
                    dialColor: specs.dialColor || undefined,
                    caseColor: specs.caseColor || undefined,
                    strapColor: specs.strapColor || undefined,
                    strapMaterial: specs.strapMaterial || undefined,
                    strapWidth: specs.strapWidth || undefined,
                    movement: specs.movement || undefined,
                    glass: specs.glass || undefined,
                    waterResistance: specs.waterResistance || undefined,
                    case: specs.case || undefined,
                    hourMarkers: specs.hourMarkers || undefined
                }
            };

            if (initialData) {
                await updateProductAction(initialData.id, payload);
                toast.success("Product updated successfully!");
            } else {
                // Creation Logic
                await createProductAction(payload);
                toast.success("Product created!");
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

    // Tab Button Helper
    const TabButton = ({ id, label }: { id: typeof activeTab, label: string }) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={`admin-tab-btn ${activeTab === id ? 'active' : ''}`}
            style={{
                padding: '10px 20px',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === id ? '2px solid var(--admin-primary)' : '2px solid transparent',
                color: activeTab === id ? 'var(--admin-primary)' : 'var(--admin-text-muted)',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
        >
            {label}
        </button>
    );

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

            {/* Tabs */}
            <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--admin-border)', display: 'flex', gap: '10px' }}>
                <TabButton id="basic" label="Basic Info" />
                <TabButton id="merchandising" label="Merchandising & Visibility" />
                <TabButton id="sourcing" label="Sourcing & Pricing" />
                <button
                    type="button"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onClick={() => setActiveTab('seo' as any)}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    className={`admin-tab-btn ${activeTab === 'seo' as any ? 'active' : ''}`}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        background: 'transparent',
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        borderBottom: activeTab === 'seo' as any ? '2px solid var(--admin-primary)' : '2px solid transparent',
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        color: activeTab === 'seo' as any ? 'var(--admin-primary)' : 'var(--admin-text-muted)',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    SEO & Metadata
                </button>
            </div>

            <div className="admin-grid" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start', display: activeTab === 'basic' ? 'grid' : 'none' }}>
                {/* Basic Info Tab */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="admin-card">
                        <h3 className="stat-label" style={{ marginBottom: '20px' }}>Product Details</h3>
                        
                        <div className="admin-form-group">
                            <label className="stat-label" style={{ fontSize: '11px' }}>Product Name (English)</label>
                            <input className="form-input" value={name} onChange={e => setName(e.target.value)} required />
                        </div>

                        <div className="admin-form-group" style={{ marginTop: '16px' }}>
                            <label className="stat-label" style={{ fontSize: '11px', direction: 'rtl' }}>اسم المنتج (عربي)</label>
                            <input className="form-input" value={nameAr} onChange={e => setNameAr(e.target.value)} dir="rtl" />
                        </div>

                        <div className="admin-form-group" style={{ marginTop: '16px' }}>
                            <label className="stat-label" style={{ fontSize: '11px' }}>Short Description</label>
                            <textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
                        </div>
                        <div className="admin-form-group" style={{ marginTop: '16px' }}>
                            <label className="stat-label" style={{ fontSize: '11px', direction: 'rtl' }}>وصف قصير (عربي)</label>
                            <textarea className="form-input" value={descriptionAr} onChange={e => setDescriptionAr(e.target.value)} rows={2} dir="rtl" />
                        </div>

                        <div className="admin-form-group" style={{ marginTop: '16px' }}>
                            <label className="stat-label" style={{ fontSize: '11px' }}>Detailed Description</label>
                            <textarea className="form-input" value={detailedDescription} onChange={e => setDetailedDescription(e.target.value)} rows={6} />
                        </div>
                         <div className="admin-form-group" style={{ marginTop: '16px' }}>
                            <label className="stat-label" style={{ fontSize: '11px', direction: 'rtl' }}>وصف تفصيلي (عربي)</label>
                            <textarea className="form-input" value={detailedDescriptionAr} onChange={e => setDetailedDescriptionAr(e.target.value)} rows={6} dir="rtl" />
                        </div>
                    </div>
                 </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="admin-card">
                        <h3 className="stat-label" style={{ marginBottom: '20px' }}>Media</h3>
                        <div className="admin-form-group">
                            <label className="stat-label" style={{ fontSize: '11px' }}>Main Image</label>
                            <ImageUpload value={imageUrl ? [imageUrl] : []} onChange={setImageUrl} onRemove={() => setImageUrl("")} />
                        </div>
                        <div className="admin-form-group" style={{ marginTop: '16px' }}>
                            <label className="stat-label" style={{ fontSize: '11px' }}>Gallery</label>
                            <ImageUpload value={gallery} onChange={url => setGallery(c => [...c, url])} onRemove={url => setGallery(c => c.filter(i => i !== url))} />
                        </div>
                    </div>

                    <div className="admin-card">
                         <h3 className="stat-label" style={{ marginBottom: '20px' }}>Organization</h3>
                         <div className="admin-form-group">
                            <label className="stat-label" style={{ fontSize: '11px' }}>Status</label>
                            <AdminDropdown value={status} onChange={setStatus} options={[{ value: 'active', label: 'Active' }, { value: 'draft', label: 'Draft' }, { value: 'archived', label: 'Archived' }]} />
                         </div>
                         <div className="admin-form-group" style={{ marginTop: '16px' }}>
                            <label className="stat-label" style={{ fontSize: '11px' }}>Category</label>
                            <AdminDropdown value={categoryId} onChange={setCategoryId} options={[{ value: '', label: 'None' }, ...categories.map(c => ({ value: c.id, label: c.name }))]} />
                         </div>
                         <div className="admin-form-group" style={{ marginTop: '16px' }}>
                            <label className="stat-label" style={{ fontSize: '11px' }}>Brand</label>
                             <AdminDropdown value={brandId} onChange={setBrandId} options={[{ value: '', label: 'None' }, ...brands.map(b => ({ value: b.id, label: b.name }))]} />
                         </div>
                         <div className="admin-form-group" style={{ marginTop: '16px' }}>
                            <label className="stat-label" style={{ fontSize: '11px' }}>Material</label>
                             <AdminDropdown value={materialId} onChange={setMaterialId} options={[{ value: '', label: 'None' }, ...materials.map(m => ({ value: m.id, label: m.name }))]} />
                         </div>
                    </div>

                    <div className="admin-card">
                        <h3 className="stat-label" style={{ marginBottom: '20px' }}>Specifications</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {/* Dial Specs */}
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>Dial Size (mm)</label>
                                <input className="form-input" placeholder="e.g. 40mm" value={specs.dialSize} onChange={e => setSpecs({ ...specs, dialSize: e.target.value })} />
                            </div>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>Dial Color</label>
                                <input className="form-input" placeholder="e.g. Blue" value={specs.dialColor} onChange={e => setSpecs({ ...specs, dialColor: e.target.value })} />
                            </div>

                            {/* Case Specs */}
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>Case Material (Detail)</label>
                                <input className="form-input" placeholder="e.g. 316L Stainless Steel" value={specs.case} onChange={e => setSpecs({ ...specs, case: e.target.value })} />
                            </div>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>Case Color</label>
                                <input className="form-input" placeholder="e.g. Silver" value={specs.caseColor} onChange={e => setSpecs({ ...specs, caseColor: e.target.value })} />
                            </div>

                            {/* Strap Specs */}
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>Strap Material</label>
                                <input className="form-input" placeholder="e.g. Genuine Leather" value={specs.strapMaterial} onChange={e => setSpecs({ ...specs, strapMaterial: e.target.value })} />
                            </div>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>Strap Color</label>
                                <input className="form-input" placeholder="e.g. Brown" value={specs.strapColor} onChange={e => setSpecs({ ...specs, strapColor: e.target.value })} />
                            </div>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>Strap Width</label>
                                <input className="form-input" placeholder="e.g. 20mm" value={specs.strapWidth} onChange={e => setSpecs({ ...specs, strapWidth: e.target.value })} />
                            </div>

                            {/* Technical Specs */}
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>Movement</label>
                                <input className="form-input" placeholder="e.g. Quartz" value={specs.movement} onChange={e => setSpecs({ ...specs, movement: e.target.value })} />
                            </div>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>Glass Type</label>
                                <input className="form-input" placeholder="e.g. Sapphire Crystal" value={specs.glass} onChange={e => setSpecs({ ...specs, glass: e.target.value })} />
                            </div>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>Water Resistance</label>
                                <input className="form-input" placeholder="e.g. 5 ATM" value={specs.waterResistance} onChange={e => setSpecs({ ...specs, waterResistance: e.target.value })} />
                            </div>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>Hour Markers</label>
                                <input className="form-input" placeholder="e.g. Roman Numerals" value={specs.hourMarkers} onChange={e => setSpecs({ ...specs, hourMarkers: e.target.value })} />
                            </div>
                        </div>
                    </div>
                 </div>
            </div>

            {/* Merchandising Tab */}
            <div style={{ display: activeTab === 'merchandising' ? 'block' : 'none', maxWidth: '800px' }}>
                <div className="admin-card">
                    <h3 className="stat-label" style={{ marginBottom: '20px' }}>Visibility & Recommendation</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <label className="admin-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', border: '1px solid var(--admin-border)', borderRadius: '8px' }}>
                            <input type="checkbox" checked={showInNewArrivals} onChange={e => setShowInNewArrivals(e.target.checked)} />
                            <div>
                                <div style={{ fontWeight: 600 }}>Show in New Arrivals</div>
                                <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>Boost visibility on homepage</div>
                            </div>
                        </label>

                        <label className="admin-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', border: '1px solid var(--admin-border)', borderRadius: '8px' }}>
                            <input type="checkbox" checked={showInForYou} onChange={e => setShowInForYou(e.target.checked)} />
                            <div>
                                <div style={{ fontWeight: 600 }}>Show in &quot;For You&quot;</div>
                                <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>Include in personalized scroll</div>
                            </div>
                        </label>
                    </div>

                    <div className="admin-form-group" style={{ marginTop: '24px' }}>
                        <label className="stat-label" style={{ fontSize: '11px' }}>Detail Page Tags</label>
                        <input 
                            className="form-input" 
                            placeholder="e.g. Best Seller, Limited Edition, 100% Cotton" 
                            value={detailTagsInput}
                            onChange={e => setDetailTagsInput(e.target.value)}
                        />
                        <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                            Comma separated tags displayed on product details page.
                        </div>
                    </div>

                    <div className="admin-form-group" style={{ marginTop: '24px' }}>
                        <label className="stat-label" style={{ fontSize: '11px' }}>Similar Products (Manual Override)</label>
                        <ProductPicker 
                            value={similarProductIds}
                            onChange={setSimilarProductIds} 
                            isMulti={true}
                        />
                        <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                            Manually select related products. If empty, system will auto-recommend based on category.
                        </div>
                    </div>
                </div>
            </div>

            {/* Sourcing Tab */}
            <div style={{ display: activeTab === 'sourcing' ? 'block' : 'none', maxWidth: '800px' }}>
                 <div className="admin-card">
                    <h3 className="stat-label" style={{ marginBottom: '20px' }}>Sourcing & Pricing</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="admin-form-group">
                            <label className="stat-label" style={{ fontSize: '11px' }}>SKU</label>
                            <input className="form-input" value={sku} onChange={e => setSku(e.target.value)} required style={{ fontFamily: 'monospace' }} />
                        </div>
                         <div className="admin-form-group">
                             <label className="stat-label" style={{ fontSize: '11px' }}>Selling Price (EGP)</label>
                             <input className="form-input" type="number" value={price} onChange={e => setPrice(e.target.value)} required />
                        </div>
                        <div className="admin-form-group">
                            <label className="stat-label" style={{ fontSize: '11px' }}>Compare At Price (Optional)</label>
                            <input className="form-input" type="number" value={compareAtPrice} onChange={e => setCompareAtPrice(e.target.value)} />
                        </div>
                        <div className="admin-form-group">
                            <label className="stat-label" style={{ fontSize: '11px' }}>Purchase Price / سعر الشراء</label>
                            <input className="form-input" type="number" placeholder="0.00" value={unitCost} onChange={e => setUnitCost(e.target.value)} />
                        </div>
                    </div>

                    {/* Integrated Procurement Inputs */}
                    <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--admin-border)' }}>
                        <h4 style={{ fontSize: '14px', marginBottom: '15px', color: 'var(--admin-secondary)' }}>Supplier & Costing (Optional)</h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>Supplier</label>
                                <SupplierSelect value={supplierId} onChange={setSupplierId} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>Invoice Number</label>
                                <input className="form-input" placeholder="INV-001" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
                            </div>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>Purchase Date</label>
                                <input className="form-input" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
                            </div>
                        </div>

                         <div className="admin-form-group" style={{ marginTop: '20px' }}>
                            <label className="stat-label" style={{ fontSize: '11px' }}>Initial Stock / Quantity Received</label>
                            <input className="form-input" type="number" placeholder="0" value={stock} onChange={e => setStock(e.target.value)} />
                        </div>
                        
                         <div className="admin-form-group" style={{ marginTop: '16px' }}>
                            <label className="stat-label" style={{ fontSize: '11px' }}>Target Warehouse</label>
                            <AdminDropdown 
                                value={warehouseId} 
                                onChange={setWarehouseId} 
                                options={[{ value: '', label: 'Default' }, ...warehouses.map(w => ({ value: w.id, label: w.name }))]} 
                            />
                        </div>
                    </div>
                 </div>
            </div>

            {/* SEO Tab */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <div style={{ display: activeTab === 'seo' as any ? 'block' : 'none', maxWidth: '800px' }}>
                <div className="admin-card">
                    <h3 className="stat-label" style={{ marginBottom: '20px' }}>Search Engine Optimization</h3>

                    <div className="admin-form-group">
                        <label className="stat-label" style={{ fontSize: '11px' }}>URL Slug</label>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: 'var(--admin-text-muted)', background: 'var(--admin-bg)', padding: '8px 12px', border: '1px solid var(--admin-border)', borderRight: 'none', borderRadius: '4px 0 0 4px' }}>
                                /product/
                            </span>
                            <input
                                className="form-input"
                                value={slug}
                                onChange={e => setSlug(e.target.value)}
                                placeholder="my-awesome-product"
                                style={{ borderRadius: '0 4px 4px 0' }}
                            />
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                            Leave empty to auto-generate from English name. Must be unique.
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
                        {/* English SEO */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: 600 }}>English SEO</h4>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>Meta Title</label>
                                <input className="form-input" value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="Product Name | Store Name" />
                            </div>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>Meta Description</label>
                                <textarea className="form-input" value={metaDescription} onChange={e => setMetaDescription(e.target.value)} rows={3} placeholder="Brief description for search engines..." />
                            </div>
                        </div>

                        {/* Arabic SEO */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: 600 }}>Arabic SEO</h4>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>Meta Title (Ar)</label>
                                <input className="form-input" value={metaTitleAr} onChange={e => setMetaTitleAr(e.target.value)} placeholder="اسم المنتج | اسم المتجر" dir="rtl" />
                            </div>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>Meta Description (Ar)</label>
                                <textarea className="form-input" value={metaDescriptionAr} onChange={e => setMetaDescriptionAr(e.target.value)} rows={3} placeholder="وصف مختصر لمحركات البحث..." dir="rtl" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </form>
    );
}
