/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/admin/ImageUpload";
import { createProductAction, updateProductAction, ProductInput, fetchCategories, checkSkuAvailability } from "@/lib/actions/product";
import { fetchAllBrands } from "@/lib/actions/brand";
import { fetchAllMaterials } from "@/lib/actions/material";
import { fetchWarehouses } from "@/lib/actions/warehouse-actions";
// import { createPurchaseInvoiceAction } from "@/lib/actions/procurement-actions"; 
import { toast } from "sonner";
import Link from 'next/link';
import NextImage from "next/image";
import '@/app/admin/admin.css';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import SupplierSelect from "@/components/admin/procurement/SupplierSelect";
import ProductPicker from "@/components/admin/ProductPicker";
import { Reorder } from "framer-motion";
import { GripVertical, Trash2 } from "lucide-react";

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
        variants: { id?: string; sku: string; price: number }[]; 
        stock?: number;
        compareAtPrice?: number | null;
        costPrice?: number | null;
        status?: string;
        categoryId?: string | null;
        brandId?: string | null;
        materialId?: string | null;
        supplierId?: string | null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supplier?: any | null;
        showInNewArrivals?: boolean;
        showInForYou?: boolean;
        detailTags?: string[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        similarProducts?: any[];
        orderedSimilarIds?: string[];

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
            supplierPrice?: number;
            additionalCosts?: number;
            purchaseDate?: string;
            invoiceNumber?: string;
            warehouseId?: string;
            lowStockThreshold?: number;
            videoUrl?: string;
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
                     fetchAllBrands(true),
                     fetchAllMaterials(true),
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
    
    // --- Pricing & core (Swap Logic: Basic Price & Discounted Price) ---
    const [sku, setSku] = useState(defaultVariant?.sku || "");
    
    // Intuitive Mapping:
    // 如果有 compareAtPrice, 則 originalPrice = compareAtPrice, salePrice = price
    // 如果没有 compareAtPrice, 則 originalPrice = price, salePrice = ""
    const initialValues = initialData?.compareAtPrice 
        ? { original: initialData.compareAtPrice.toString(), sale: initialData.variants?.[0]?.price?.toString() || "" }
        : { original: initialData?.variants?.[0]?.price?.toString() || "", sale: "" };

    const [originalPrice, setOriginalPrice] = useState(initialValues.original);
    const [salePrice, setSalePrice] = useState(initialValues.sale);
    const [status, setStatus] = useState(initialData?.status || "active");
    const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
    const [brandId, setBrandId] = useState(initialData?.brandId || "");
    const [materialId, setMaterialId] = useState(initialData?.materialId || "");
    
    // --- Merchandising ---
    const [showInNewArrivals, setShowInNewArrivals] = useState(initialData?.showInNewArrivals ?? true);
    const [showInForYou, setShowInForYou] = useState(initialData?.showInForYou ?? true);
    // Detail tags as comma separated string for input
    const [detailTagsInput, setDetailTagsInput] = useState((initialData?.detailTags || []).join(", "));
    const [similarProductIds, setSimilarProductIds] = useState<string[]>(initialData?.orderedSimilarIds && initialData.orderedSimilarIds.length > 0 ? initialData.orderedSimilarIds : (initialData?.similarProducts?.map(p => p.id) || []));
    
    // We need the full objects to display them in the reorderable list
    const [similarProducts, setSimilarProducts] = useState<any[]>(() => {
        const initial = initialData?.similarProducts || [];
        const order = initialData?.orderedSimilarIds || [];
        if (order && order.length > 0) {
            return order.map((id: string) => initial.find((p: any) => p.id === id)).filter(Boolean);
        }
        return initial;
    });

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
    const [warehouseId, setWarehouseId] = useState(initialData?.specs?.warehouseId || "");
    
    // Procurement & Cost Fields
    const [supplierId, setSupplierId] = useState(initialData?.supplierId || "");
    const [invoiceNumber, setInvoiceNumber] = useState(initialData?.specs?.invoiceNumber || "");
    const [supplierPrice, setSupplierPrice] = useState(initialData?.specs?.supplierPrice?.toString() || "");
    const [additionalCosts, setAdditionalCosts] = useState(initialData?.specs?.additionalCosts?.toString() || "");
    const [purchaseDate, setPurchaseDate] = useState(initialData?.specs?.purchaseDate || new Date().toISOString().split('T')[0]);
    
    // SKU Validation State
    const [skuError, setSkuError] = useState("");
    const [isCheckingSku, setIsCheckingSku] = useState(false);
    
    // New Features state
    const [lowStockThreshold, setLowStockThreshold] = useState(initialData?.specs?.lowStockThreshold?.toString() || "3");

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!sku || sku === (initialData?.variants?.[0]?.sku || "")) {
                setSkuError("");
                return;
            }
            setIsCheckingSku(true);
            const isAvailable = await checkSkuAvailability(sku, initialData?.variants?.[0]?.id);
            if (!isAvailable) {
                setSkuError("هذا الـ SKU مستخدم بالفعل، الرجاء اختيار واحد آخر");
            } else {
                setSkuError("");
            }
            setIsCheckingSku(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [sku, initialData]);

    const title = initialData ? "Edit Product" : "Create Product";
    const action = initialData ? "Save Changes" : "Create Product";

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Validation
        if (skuError) { toast.error("Please provide a unique SKU"); setLoading(false); return; }
        if (!name.trim()) { toast.error("Product name is required"); setLoading(false); return; }
        if (!sku.trim()) { toast.error("SKU is required"); setLoading(false); return; }
        if (!originalPrice || parseFloat(originalPrice) <= 0) { toast.error("Price must be > 0"); setLoading(false); return; }
        if (salePrice && parseFloat(salePrice) >= parseFloat(originalPrice)) {
            toast.error("Discounted price must be lower than original price");
            setLoading(false);
            return;
        }

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
                // Resulting mapping for DB:
                price: salePrice ? parseFloat(salePrice) : parseFloat(originalPrice),
                compareAtPrice: salePrice ? parseFloat(originalPrice) : null,
                costPrice: (parseFloat(supplierPrice || "0") + parseFloat(additionalCosts || "0")) > 0 ? (parseFloat(supplierPrice || "0") + parseFloat(additionalCosts || "0")) : undefined,
                imageUrl,
                gallery,
                stock: stock ? parseInt(stock) : undefined,
                status,
                categoryId: categoryId || undefined,
                brandId: brandId || undefined,
                materialId: materialId || undefined,
                warehouseId: warehouseId || undefined,
                supplierId: supplierId || undefined,
                // New Fields
                showInNewArrivals,
                showInForYou,
                detailTags: detailTagsInput.split(",").map(t => t.trim()).filter(Boolean),
                similarProductIds,
                orderedSimilarIds: similarProductIds,

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
                    hourMarkers: specs.hourMarkers || undefined,
                    supplierPrice: supplierPrice ? parseFloat(supplierPrice) : undefined,
                    additionalCosts: additionalCosts ? parseFloat(additionalCosts) : undefined,
                    purchaseDate: purchaseDate || undefined,
                    invoiceNumber: invoiceNumber || undefined,
                    warehouseId: warehouseId || undefined,
                    lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : undefined
                }
            };

            if (initialData) {
                const result = await updateProductAction(initialData.id, payload);
                if (result.success) {
                    toast.success("Product updated successfully!");
                    router.push('/admin/products');
                    router.refresh();
                }
            } else {
                // Creation Logic
                const result = await createProductAction(payload);
                if (result.success) {
                    toast.success("Product created!");
                    router.push('/admin/products');
                    router.refresh();
                }
            }
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
                    <button type="submit" disabled={loading || !!skuError} className="admin-btn admin-btn-primary">
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

            <div className="admin-grid" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start', gap: '24px', display: activeTab === 'basic' ? 'grid' : 'none', maxWidth: '1200px' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Basic Details Card */}
                    <div className="admin-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#12403C" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--admin-text)' }}>Product Details</h3>
                                <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '2px' }}>Core information displayed on the storefront</p>
                            </div>
                        </div>
                        
                        <div className="admin-form-group">
                            <label className="stat-label" style={{ fontSize: '11px', fontWeight: 600 }}>Product Name</label>
                            <input className="form-input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Classic Two-Tone Watch" style={{ fontSize: '14px', padding: '10px 14px' }} />
                        </div>

                        <div className="admin-form-group" style={{ marginTop: '20px' }}>
                            <label className="stat-label" style={{ fontSize: '11px', fontWeight: 600 }}>Short Description</label>
                            <textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="A brief summary for product cards and quick views..." style={{ resize: 'vertical' }} />
                        </div>

                        <div className="admin-form-group" style={{ marginTop: '20px' }}>
                            <label className="stat-label" style={{ fontSize: '11px', fontWeight: 600 }}>Detailed Description</label>
                            <textarea className="form-input" value={detailedDescription} onChange={e => setDetailedDescription(e.target.value)} rows={8} placeholder="Full product features, inspiration, and details..." style={{ resize: 'vertical' }} />
                        </div>
                    </div>

                    {/* Specifications Card */}
                    <div className="admin-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#12403C" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--admin-text)' }}>Technical Specifications</h3>
                                <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '2px' }}>Detailed material and sizing properties</p>
                            </div>
                        </div>

                        <div style={{ padding: '0 0 16px 0', borderBottom: '1px dashed #e5e7eb', marginBottom: '20px' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#12403C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Dial & Case</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                <div className="admin-form-group">
                                    <label className="stat-label" style={{ fontSize: '11px' }}>Dial Size (mm)</label>
                                    <input className="form-input" placeholder="e.g. 40mm" value={specs.dialSize} onChange={e => setSpecs({ ...specs, dialSize: e.target.value })} />
                                </div>
                                <div className="admin-form-group">
                                    <label className="stat-label" style={{ fontSize: '11px' }}>Dial Color</label>
                                    <input className="form-input" placeholder="e.g. Blue" value={specs.dialColor} onChange={e => setSpecs({ ...specs, dialColor: e.target.value })} />
                                </div>
                                <div className="admin-form-group">
                                    <label className="stat-label" style={{ fontSize: '11px' }}>Case Material (Detail)</label>
                                    <input className="form-input" placeholder="e.g. 316L Stainless Steel" value={specs.case} onChange={e => setSpecs({ ...specs, case: e.target.value })} />
                                </div>
                                <div className="admin-form-group">
                                    <label className="stat-label" style={{ fontSize: '11px' }}>Case Color</label>
                                    <input className="form-input" placeholder="e.g. Silver" value={specs.caseColor} onChange={e => setSpecs({ ...specs, caseColor: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '0 0 16px 0', borderBottom: '1px dashed #e5e7eb', marginBottom: '20px' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#12403C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Strap</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
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
                            </div>
                        </div>

                        <div>
                            <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#12403C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Hardware & Functionality</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
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

                 {/* Right Column */}
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    <div className="admin-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#12403C" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--admin-text)' }}>Media</h3>
                                <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '2px' }}>Photos of the product</p>
                            </div>
                        </div>

                        <div className="admin-form-group">
                            <label className="stat-label" style={{ fontSize: '11px', fontWeight: 600 }}>Main Thumbnail Image</label>
                            <div style={{ marginTop: '8px' }}>
                                <ImageUpload value={imageUrl ? [imageUrl] : []} onChange={setImageUrl} onRemove={() => setImageUrl("")} />
                            </div>
                        </div>
                        <div className="admin-form-group" style={{ marginTop: '24px' }}>
                            <label className="stat-label" style={{ fontSize: '11px', fontWeight: 600 }}>Gallery Images</label>
                            <p className="text-[11px] text-gray-500 mb-2">Drag and drop to reorder</p>
                            <ImageUpload value={gallery} onChange={url => setGallery(c => [...c, url])} onRemove={url => setGallery(c => c.filter(i => i !== url))} onReorder={setGallery} />
                        </div>
                    </div>

                    <div className="admin-card">
                         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#12403C" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--admin-text)' }}>Organization</h3>
                                <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '2px' }}>Categorize and classify</p>
                            </div>
                        </div>

                         <div className="admin-form-group">
                            <label className="stat-label" style={{ fontSize: '11px', fontWeight: 600 }}>Visibility Status</label>
                            <AdminDropdown value={status} onChange={setStatus} options={[{ value: 'active', label: 'Active (Public)' }, { value: 'draft', label: 'Draft (Hidden)' }, { value: 'archived', label: 'Archived' }]} />
                         </div>
                         <div className="admin-form-group" style={{ marginTop: '16px' }}>
                            <label className="stat-label" style={{ fontSize: '11px', fontWeight: 600 }}>Primary Category</label>
                            <AdminDropdown value={categoryId} onChange={setCategoryId} options={[{ value: '', label: 'Uncategorized' }, ...categories.map(c => ({ value: c.id, label: c.name }))]} />
                         </div>
                         <div className="admin-form-group" style={{ marginTop: '16px' }}>
                            <label className="stat-label" style={{ fontSize: '11px', fontWeight: 600 }}>Brand</label>
                             <AdminDropdown value={brandId} onChange={setBrandId} options={[{ value: '', label: 'Unbranded' }, ...brands.map(b => ({ value: b.id, label: b.name }))]} />
                         </div>
                         <div className="admin-form-group" style={{ marginTop: '16px' }}>
                            <label className="stat-label" style={{ fontSize: '11px', fontWeight: 600 }}>Material Flag</label>
                             <AdminDropdown value={materialId} onChange={setMaterialId} options={[{ value: '', label: 'None' }, ...materials.map(m => ({ value: m.id, label: m.name }))]} />
                         </div>
                    </div>
                 </div>
            </div>

            {/* Merchandising Tab */}
            <div style={{ display: activeTab === 'merchandising' ? 'grid' : 'none', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}>
                <div className="admin-card">
                    <h3 className="stat-label flex items-center gap-2 mb-6" style={{ marginBottom: '24px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                        Platform Visibility
                    </h3>

                    <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', border: '1px solid var(--admin-border)', borderRadius: '12px', cursor: 'pointer', background: 'var(--admin-card-bg)', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                            <div style={{ marginTop: '2px' }}>
                                <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: '#12403C' }} checked={showInNewArrivals} onChange={e => setShowInNewArrivals(e.target.checked)} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--admin-text)', marginBottom: '4px' }}>Show in New Arrivals</div>
                                <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', margin: 0, lineHeight: 1.4 }}>Boost product visibility by pinning it to the Homepage New Arrivals section.</p>
                            </div>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', border: '1px solid var(--admin-border)', borderRadius: '12px', cursor: 'pointer', background: 'var(--admin-card-bg)', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                            <div style={{ marginTop: '2px' }}>
                                <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: '#12403C' }} checked={showInForYou} onChange={e => setShowInForYou(e.target.checked)} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--admin-text)', marginBottom: '4px' }}>Show in &quot;For You&quot;</div>
                                <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', margin: 0, lineHeight: 1.4 }}>Include this product in the personalized recommendation algorithm.</p>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="admin-card">
                    <h3 className="stat-label flex items-center gap-2 mb-6" style={{ marginBottom: '24px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
                        Cross-Selling Strategy
                    </h3>

                    <div className="admin-form-group">
                        <label className="stat-label" style={{ fontSize: '11px', marginBottom: '8px', display: 'block' }}>Manually Link Similar Products</label>
                        <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
                            Override the automated recommendation engine. Hand-pick products that pair well to increase the average order value.
                        </p>
                        
                        <ProductPicker 
                            value={similarProductIds}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            initialOptions={initialData?.similarProducts?.map((p: any) => ({ label: p.name, value: p.id, image: p.imageUrl || p.images?.[0]?.url })) || []}
                            onChange={(ids) => {
                                setSimilarProductIds(ids);
                                // The picker doesn't give us the objects, so we need to filter/manage them
                                // If a new ID is added, we might not have the object immediately for the list
                                // but we can show a placeholder or wait for a fetch. 
                                // However, usually the user just picked it, so they know what it is.
                                // For simplicity, we'll just keep the ones we have objects for.
                            }} 
                            isMulti={true}
                        />

                        {similarProductIds.length > 0 && (
                            <div style={{ marginTop: '24px' }}>
                                <label className="stat-label" style={{ fontSize: '11px', marginBottom: '12px', display: 'block', color: 'var(--admin-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Adjust Display Order
                                </label>
                                <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginBottom: '16px' }}>
                                    Drag the items below to set the exact order they appear in the &quot;Similar Products&quot; carousel.
                                </p>
                                
                                <Reorder.Group 
                                    axis="y" 
                                    values={similarProductIds} 
                                    onReorder={setSimilarProductIds}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '8px', listStyle: 'none', padding: 0 }}
                                >
                                    {similarProductIds.map((id) => {
                                        const p = similarProducts.find(sp => sp.id === id);
                                        return (
                                            <Reorder.Item 
                                                key={id} 
                                                value={id}
                                                style={{ 
                                                    background: 'white', 
                                                    border: '1px solid var(--admin-border)', 
                                                    borderRadius: '8px', 
                                                    padding: '10px 12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    cursor: 'grab'
                                                }}
                                                whileDrag={{ scale: 1.02, boxShadow: '0 8px 20px rgba(0,0,0,0.1)', border: '1px solid var(--admin-primary)' }}
                                            >
                                                <GripVertical size={16} style={{ color: '#9ca3af' }} />
                                                {p?.imageUrl || p?.images?.[0]?.url ? (
                                                    <div style={{ width: '32px', height: '32px', position: 'relative', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                                        <NextImage src={p.imageUrl || p.images[0].url} alt={p.name} fill sizes="32px" style={{ objectFit: 'cover' }} />
                                                    </div>
                                                ) : (
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '4px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                                    </div>
                                                )}
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text)' }}>{p?.name || `Product ID: ${id.slice(0,8)}...`}</div>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        setSimilarProductIds(prev => prev.filter(item => item !== id));
                                                    }}
                                                    style={{ padding: '4px', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </Reorder.Item>
                                        );
                                    })}
                                </Reorder.Group>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sourcing Tab */}
            <div style={{ display: activeTab === 'sourcing' ? 'block' : 'none', maxWidth: '1000px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    
                    {/* Panel 1: Inventory & Identifiers */}
                    <div className="admin-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#12403C" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--admin-text)' }}>Inventory & Identifiers</h3>
                                <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '2px' }}>Track stock, SKU, and physical locations</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '24px' }}>
                            <div className="admin-form-group" style={{ position: 'relative' }}>
                                <label className="stat-label" style={{ fontSize: '11px', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Stock Keeping Unit (SKU)</span>
                                    {isCheckingSku && <span style={{ color: 'var(--admin-primary)', fontSize: '10px' }}>Checking...</span>}
                                    {!isCheckingSku && skuError && <span style={{ color: '#ef4444', fontSize: '10px' }}>{skuError}</span>}
                                </label>
                                <input 
                                    className={`form-input ${skuError ? 'border-red-500 bg-red-50' : ''}`}
                                    value={sku} 
                                    onChange={e => setSku(e.target.value)} 
                                    required 
                                    placeholder="e.g., LGC-WTCH-001"
                                    style={{ fontFamily: 'monospace', textTransform: 'uppercase', borderColor: skuError ? '#fca5a5' : undefined }} 
                                />
                            </div>

                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px', fontWeight: 600 }}>Initial Stock Count</label>
                                <input className="form-input" type="number" placeholder="0" value={stock} onChange={e => setStock(e.target.value)} />
                            </div>

                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    Low Stock Alert Threshold
                                    <span title="System will flag the product when stock drops below this number" style={{ cursor: 'help', color: 'var(--admin-text-muted)' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                                    </span>
                                </label>
                                <input className="form-input" type="number" placeholder="5" value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} />
                            </div>

                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px', fontWeight: 600 }}>Target Warehouse</label>
                                <AdminDropdown 
                                    value={warehouseId} 
                                    onChange={setWarehouseId} 
                                    options={[{ value: '', label: 'Default Warehouse' }, ...warehouses.map(w => ({ value: w.id, label: w.name }))]} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Panel 2: Sourcing Details */}
                    <div className="admin-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#12403C" strokeWidth="2"><path d="M12 2s-8 2-8 2v6c0 5 4 10 8 11 4-1 8-6 8-11V4s-8-2-8-2z"></path></svg>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--admin-text)' }}>Sourcing & Procurement</h3>
                                <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '2px' }}>Where and when was this item acquired?</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '24px' }}>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px', fontWeight: 600 }}>Supplier Origin</label>
                                <SupplierSelect 
                                    value={supplierId} 
                                    initialOption={initialData?.supplier || null}
                                    onChange={setSupplierId} 
                                />
                            </div>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px', fontWeight: 600 }}>Purchase Date</label>
                                <input className="form-input" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Panel 3: Pricing Strategies & Margins */}
                    <div className="admin-card" style={{ borderTop: '4px solid var(--admin-primary)', background: '#fafafa' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#fff', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#12403C" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--admin-text)' }}>Pricing Strategy & Margin</h3>
                                <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '2px' }}>Configure costs and customer prices to compute profitability</p>
                            </div>
                        </div>

                        {/* Cost Split */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '24px', paddingBottom: '24px', borderBottom: '1px dashed #e5e7eb', marginBottom: '24px' }}>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px', fontWeight: 600 }}>Wholesale Price</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '13px' }}>EGP</span>
                                    <input className="form-input" style={{ paddingLeft: '40px' }} type="number" placeholder="0.00" value={supplierPrice} onChange={e => setSupplierPrice(e.target.value)} />
                                </div>
                            </div>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px', fontWeight: 600 }}>Additional Costs</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '13px' }}>EGP</span>
                                    <input className="form-input" style={{ paddingLeft: '40px' }} type="number" placeholder="0.00" value={additionalCosts} onChange={e => setAdditionalCosts(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Revenue Split */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '24px' }}>
                             <div className="admin-form-group">
                                 <label className="stat-label" style={{ fontSize: '11px', fontWeight: 600 }}>Selling Price (Original)</label>
                                 <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '13px' }}>EGP</span>
                                    <input className="form-input" style={{ paddingLeft: '40px' }} type="number" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} required />
                                 </div>
                            </div>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px', fontWeight: 600 }}>Discounted Sale Price</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '13px' }}>EGP</span>
                                    <input className="form-input" style={{ paddingLeft: '40px' }} type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="0.00" />
                                </div>
                                
                                {/* Live Discount Preview */}
                                {salePrice && originalPrice && parseFloat(salePrice) < parseFloat(originalPrice) && (
                                    <div className="mt-3 p-3 bg-[#FCF8F3] border border-[#12403C]/10 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-1 duration-300">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-extrabold text-[#12403C] uppercase tracking-widest">Storefront Preview</span>
                                            <span className="px-2 py-0.5 bg-[#12403C] text-white text-[10px] font-bold rounded shadow-sm">
                                                -{Math.round(((parseFloat(originalPrice) - parseFloat(salePrice)) / parseFloat(originalPrice)) * 100)}% OFF
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xl font-bold text-[#12403C]">
                                                {new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(parseFloat(salePrice))}
                                            </span>
                                            <span className="text-sm text-gray-400 line-through decoration-gray-400/60">
                                                {new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(parseFloat(originalPrice))}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-[#12403C] font-medium mt-1.5 flex items-center gap-1">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <path d="M20 6L9 17l-5-5" />
                                            </svg>
                                            Customer saves {new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(parseFloat(originalPrice) - parseFloat(salePrice))}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Margin Calculator widget */}
                        {(() => {
                            const cSP = parseFloat(supplierPrice || "0");
                            const cAC = parseFloat(additionalCosts || "0");
                            const totalCost = cSP + cAC;
                            const currentPrice = salePrice ? parseFloat(salePrice) : parseFloat(originalPrice || "0");
                            const profit = currentPrice - totalCost;
                            const margin = currentPrice > 0 ? (profit / currentPrice) * 100 : 0;
                            
                            return (totalCost > 0 || currentPrice > 0) ? (
                                <div className="mt-8 p-5 bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
                                    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">Profitability Summary</h4>
                                    
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium">Total Cost</p>
                                            <p className="text-lg font-bold text-gray-900">{totalCost.toLocaleString('en-EG', { style: 'currency', currency: 'EGP' })}</p>
                                        </div>
                                        <div className="h-8 w-px bg-gray-200"></div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium">Est. Revenue</p>
                                            <p className="text-lg font-bold text-[#12403C]">{currentPrice.toLocaleString('en-EG', { style: 'currency', currency: 'EGP' })}</p>
                                        </div>
                                        <div className="h-8 w-px bg-gray-200"></div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium">{profit >= 0 ? "Net Profit" : "Loss"}</p>
                                            <p className={`text-xl font-black ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                {profit >= 0 ? "+" : ""}{profit.toLocaleString('en-EG', { style: 'currency', currency: 'EGP' })}
                                            </p>
                                        </div>
                                        <div className="h-8 w-px bg-gray-200"></div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium">Margin</p>
                                            <p className={`text-lg font-bold ${margin >= 20 ? 'text-green-600' : margin >= 0 ? 'text-amber-500' : 'text-red-500'}`}>
                                                {margin.toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : null;
                        })()}

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
