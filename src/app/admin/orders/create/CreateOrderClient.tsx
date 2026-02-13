'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createManualOrder, searchCustomersAction, validateCouponAction } from '@/lib/actions/order';
import { searchAdminProducts } from '@/lib/actions/product-search-actions';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';
import { OrderStatus } from '@/types/order';

interface Variant {
    id: string;
    sku: string;
    price: number;
    warehouseStock: {
        available: number;
        warehouse: { id: string; name: string };
    }[];
}

interface Product {
    id: string;
    name: string;
    imageUrl?: string | null;
    variants: Variant[];
}

interface Customer {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    orders?: {
        id: string;
        createdAt: Date | string;
        totalPrice: any;
        status: string;
    }[];
}

interface CartItem {
    variantId: string;
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    price: number;
    imageUrl?: string | null;
}

interface CreateOrderClientProps {
    initialProducts: Product[];
    initialCustomers: Customer[];
}

export default function CreateOrderClient({ initialProducts, initialCustomers }: CreateOrderClientProps) {
    const { language } = useLanguage();
    const t = adminDictionary[language];
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    
    // Search States
    const [customerQuery, setCustomerQuery] = useState('');
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
    const [productQuery, setProductQuery] = useState('');
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
    const [isSearchingProducts, setIsSearchingProducts] = useState(false);

    // Order State
    const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('new');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [governorate, setGovernorate] = useState('');

    const [cart, setCart] = useState<CartItem[]>([]);
    const [orderNotes, setOrderNotes] = useState('');
    const [orderSource, setOrderSource] = useState('instagram');
    const [orderStatus, setOrderStatus] = useState<OrderStatus>(OrderStatus.Pending);

    // Coupon & Shipping
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [shippingCost, setShippingCost] = useState(0);

    // Debounced Search Effects
    useEffect(() => {
        if (customerQuery.length < 2) {
            if (customerQuery === '') setCustomers(initialCustomers);
            return;
        }
        const timer = setTimeout(async () => {
            setIsSearchingCustomers(true);
            const results = await searchCustomersAction(customerQuery);
            setCustomers(results as any);
            setIsSearchingCustomers(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [customerQuery, initialCustomers]);

    useEffect(() => {
        if (productQuery.length < 2) {
            if (productQuery === '') setProducts(initialProducts);
            return;
        }
        const timer = setTimeout(async () => {
            setIsSearchingProducts(true);
            const results = await searchAdminProducts(productQuery);
            setProducts(results as any);
            setIsSearchingProducts(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [productQuery, initialProducts]);

    // Shipping Rules (Example - in production this would come from settings)
    useEffect(() => {
        const rates: Record<string, number> = {
            'Cairo': 50,
            'Giza': 50,
            'Alexandria': 65,
            'Delta': 75,
            'Upper Egypt': 100
        };
        // Simplified mapping for demo
        const regionCost = rates[governorate] || (governorate ? 80 : 0);
        setShippingCost(regionCost);
    }, [governorate]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
            style: 'currency',
            currency: 'EGP',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = appliedCoupon ? (appliedCoupon.discountType === 'PERCENTAGE'
        ? (subtotal * appliedCoupon.discountValue) / 100
        : appliedCoupon.discountValue) : 0;
    const finalTotal = subtotal - discountAmount + shippingCost;

    // Handlers
    const handleCustomerSelect = (customerId: string) => {
        const cust = customers.find(c => c.id === customerId);
        if (cust) {
            setSelectedCustomer(cust);
            setCustomerName(cust.name || '');
            setCustomerEmail(cust.email || '');
            setCustomerPhone(cust.phone || '');
            setCustomerMode('existing');
        }
    };

    const handleAddToCart = (product: Product, variant: Variant) => {
        const stock = variant.warehouseStock.reduce((sum, i) => sum + i.available, 0);
        const existing = cart.find(i => i.variantId === variant.id);
        const currentQty = existing ? existing.quantity : 0;

        if (currentQty + 1 > stock) {
            toast.error(`${t.orders.create.error_stock || 'Insufficient stock'}: ${stock} items available`);
            return;
        }

        if (existing) {
            setCart(cart.map(i => i.variantId === variant.id ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setCart([...cart, {
                variantId: variant.id,
                productId: product.id,
                productName: product.name,
                sku: variant.sku,
                quantity: 1,
                price: Number(variant.price),
                imageUrl: product.imageUrl
            }]);
        }
        toast.success(t.orders.create.added_to_cart);
    };

    const handleRemoveFromCart = (variantId: string) => {
        setCart(cart.filter(item => item.variantId !== variantId));
    };

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setIsValidatingCoupon(true);
        try {
            const result = await validateCouponAction(couponCode, subtotal);
            if (result.isValid) {
                setAppliedCoupon(result.coupon || null);
                toast.success(result.message || 'Coupon applied!');
            } else {
                setAppliedCoupon(null);
                toast.error(('error' in result ? result.error : result.message) || 'Invalid coupon');
            }
        } catch (err) {
            toast.error('Failed to validate coupon');
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const handleSubmit = async () => {
        if (cart.length === 0) {
            toast.error(t.orders.create.error_items);
            return;
        }
        if (!customerName || !customerPhone) {
            toast.error(t.orders.create.error_customer);
            return;
        }
        if (!street || !city || !governorate) {
            toast.error(t.orders.create.error_address);
            return;
        }

        setLoading(true);
        try {
            const result = await createManualOrder({
                customer: customerMode === 'existing' && selectedCustomer
                    ? { existingId: selectedCustomer.id }
                    : { name: customerName, email: customerEmail, phone: customerPhone },
                shippingAddress: { street, city, governorate },
                items: cart.map(item => ({ variantId: item.variantId, quantity: item.quantity })),
                notes: orderNotes,
                source: orderSource,
                couponCode: appliedCoupon?.code,
                status: orderStatus
            });

            if (result.success) {
                toast.success(t.orders.create.success);
                router.push(`/admin/orders/${result.orderId}`);
            } else {
                toast.error(result.error || t.common.error);
            }
        } catch {
            toast.error(t.common.error);
        } finally {
            setLoading(false);
        }
    };

    const egyptGovernorates = [
        'Cairo', 'Giza', 'Alexandria', 'Dakahlia', 'Red Sea', 'Beheira', 
        'Fayoum', 'Gharbiya', 'Ismailia', 'Menofia', 'Minya', 'Qaliubiya',
        'New Valley', 'Suez', 'Aswan', 'Assiut', 'Beni Suef', 'Port Said',
        'Damietta', 'Sharkia', 'South Sinai', 'Kafr el-Sheikh', 'Matrouh',
        'Luxor', 'Qena', 'North Sinai', 'Sohag'
    ];

    return (
        <div style={{ paddingBottom: '100px' }}>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">{t.orders.create.title}</h1>
                    <p className="admin-subtitle">{t.orders.create.subtitle}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => router.back()} className="admin-btn admin-btn-outline">
                        ← {t.common.back}
                    </button>
                    <button 
                        onClick={() => {
                            setOrderStatus(OrderStatus.Draft);
                            handleSubmit();
                        }}
                        className="admin-btn admin-btn-outline"
                    >
                        💾 {t.orders.create.save_draft || 'Save Draft'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '32px' }}>
                {/* Left Side: Forms */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Customer Selection */}
                    <div className="admin-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px' }}>
                                👤 {t.orders.create.customer_info}
                            </h2>
                            <div className="admin-tabs" style={{ margin: 0 }}>
                                <button
                                    className={`admin-tab-item ${customerMode === 'new' ? 'active' : ''}`}
                                    onClick={() => { setCustomerMode('new'); setSelectedCustomer(null); }}
                                >
                                    {t.orders.create.new_customer}
                                </button>
                                <button
                                    className={`admin-tab-item ${customerMode === 'existing' ? 'active' : ''}`}
                                    onClick={() => setCustomerMode('existing')}
                                >
                                    {t.orders.create.existing_customer}
                                </button>
                            </div>
                        </div>

                        {customerMode === 'existing' && (
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={t.orders.create.search_customers || "Search by name, phone, email..."}
                                        value={customerQuery}
                                        onChange={(e) => setCustomerQuery(e.target.value)}
                                    />
                                    {isSearchingCustomers && <div className="loader-mini" style={{ position: 'absolute', right: '12px', top: '10px' }} />}
                                </div>
                                <div style={{
                                    marginTop: '8px',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    border: '1px solid var(--admin-border)',
                                    borderRadius: '8px'
                                }}>
                                    {customers.map(c => (
                                        <div
                                            key={c.id}
                                            onClick={() => handleCustomerSelect(c.id)}
                                            style={{
                                                padding: '10px 15px',
                                                cursor: 'pointer',
                                                backgroundColor: selectedCustomer?.id === c.id ? 'var(--admin-bg-secondary)' : 'transparent',
                                                borderBottom: '1px solid var(--admin-border)'
                                            }}
                                            className="hover-bg"
                                        >
                                            <div style={{ fontWeight: 600 }}>{c.name || 'Unnamed'}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{c.phone} • {c.email}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="admin-form-group">
                                <label>{t.orders.create.name} *</label>
                                <input type="text" className="form-input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                            </div>
                            <div className="admin-form-group">
                                <label>{t.orders.create.phone} *</label>
                                <input type="tel" className="form-input" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                            </div>
                            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
                                <label>{t.orders.create.email}</label>
                                <input type="email" className="form-input" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                            </div>
                        </div>

                        {selectedCustomer && selectedCustomer.orders && selectedCustomer.orders.length > 0 && (
                            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'var(--admin-bg-secondary)', borderRadius: '8px' }}>
                                <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--admin-text-muted)' }}>
                                    🕒 {t.orders.create.recent_orders || 'Recent Orders'}
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {selectedCustomer.orders.map(o => (
                                        <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                            <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                                            <span style={{ fontWeight: 600 }}>{formatCurrency(Number(o.totalPrice))}</span>
                                            <span className={`status-pill status-${o.status}`}>{o.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Product Selection */}
                    <div className="admin-card">
                        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', marginBottom: '20px' }}>
                            📦 {t.orders.create.add_products}
                        </h2>

                        <div style={{ position: 'relative', marginBottom: '16px' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder={t.orders.create.search_products || "Search by product name or SKU..."}
                                value={productQuery}
                                onChange={(e) => setProductQuery(e.target.value)}
                            />
                            {isSearchingProducts && <div className="loader-mini" style={{ position: 'absolute', right: '12px', top: '10px' }} />}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {products.map(p => (
                                <div key={p.id} style={{ border: '1px solid var(--admin-border)', borderRadius: '8px', padding: '12px' }}>
                                    <div style={{ fontWeight: 600, marginBottom: '8px' }}>{p.name}</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                                        {p.variants.map(v => {
                                            const stock = v.warehouseStock.reduce((sum, i) => sum + i.available, 0);
                                            return (
                                                <button
                                                    key={v.id}
                                                    onClick={() => handleAddToCart(p, v)}
                                                    disabled={stock === 0}
                                                    className="admin-btn admin-btn-outline"
                                                    style={{
                                                        justifyContent: 'space-between',
                                                        padding: '8px 12px',
                                                        fontSize: '12px',
                                                        opacity: stock === 0 ? 0.5 : 1
                                                    }}
                                                >
                                                    <span>{v.sku}</span>
                                                    <span style={{ fontWeight: 600 }}>{formatCurrency(Number(v.price))} ({stock})</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shipping & Meta */}
                    <div className="admin-card">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
                                <label>📍 {t.orders.create.street} *</label>
                                <input type="text" className="form-input" value={street} onChange={(e) => setStreet(e.target.value)} />
                            </div>
                            <div className="admin-form-group">
                                <label>{t.orders.create.city} *</label>
                                <input type="text" className="form-input" value={city} onChange={(e) => setCity(e.target.value)} />
                            </div>
                            <div className="admin-form-group">
                                <label>{t.orders.create.governorate} *</label>
                                <AdminDropdown
                                    options={[
                                        { value: '', label: 'Select Governorate...' },
                                        ...egyptGovernorates.map(gov => ({ value: gov, label: (t.governorates as any)?.[gov] || gov }))
                                    ]}
                                    value={governorate}
                                    onChange={setGovernorate}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="admin-form-group">
                                <label>📢 {t.orders.create.order_source}</label>
                                <AdminDropdown
                                    options={[
                                        { value: 'instagram', label: 'Instagram' },
                                        { value: 'facebook', label: 'Facebook' },
                                        { value: 'whatsapp', label: 'WhatsApp' },
                                        { value: 'phone', label: 'Phone' },
                                        { value: 'pos', label: 'POS' }
                                    ]}
                                    value={orderSource}
                                    onChange={setOrderSource}
                                />
                            </div>
                            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
                                <label>📝 {t.orders.create.notes}</label>
                                <textarea 
                                    className="form-input" 
                                    rows={3} 
                                    value={orderNotes} 
                                    onChange={(e) => setOrderNotes(e.target.value)}
                                    placeholder={t.orders.create.instructions_placeholder}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="admin-card" style={{ position: 'sticky', top: '24px' }}>
                        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', marginBottom: '20px' }}>
                            🧾 {t.orders.create.order_summary}
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                            {cart.length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: 'var(--admin-text-muted)' }}>{t.orders.create.no_items}</div>}
                            {cart.map(item => (
                                <div key={item.variantId} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{item.productName}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>{item.sku} × {item.quantity}</div>
                                    </div>
                                    <div style={{ fontWeight: 600 }}>{formatCurrency(item.price * item.quantity)}</div>
                                    <button onClick={() => handleRemoveFromCart(item.variantId)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{t.orders.create.subtotal || 'Subtotal'}</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534' }}>
                                <span>{t.orders.create.discount || 'Discount'}</span>
                                <span>-{formatCurrency(discountAmount)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{t.orders.create.shipping || 'Shipping'}</span>
                                <span>{formatCurrency(shippingCost)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid var(--admin-border)', fontWeight: 700, fontSize: '18px' }}>
                                <span>{t.orders.details.total}</span>
                                <span>{formatCurrency(finalTotal)}</span>
                            </div>
                        </div>

                        {/* Coupon Section */}
                        <div style={{ marginTop: '24px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>🎟️ {t.orders.create.coupon_code || 'Coupon Code'}</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    placeholder="PROMO20..."
                                />
                                <button 
                                    className="admin-btn admin-btn-outline"
                                    onClick={handleApplyCoupon}
                                    disabled={isValidatingCoupon || !couponCode}
                                >
                                    {isValidatingCoupon ? '...' : t.orders.create.apply || 'Apply'}
                                </button>
                            </div>
                        </div>

                        <button 
                            className="admin-btn admin-btn-primary" 
                            style={{ width: '100%', marginTop: '32px', padding: '16px' }}
                            disabled={loading || cart.length === 0}
                            onClick={handleSubmit}
                        >
                            {loading ? t.orders.create.creating : t.orders.create.create_order}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
