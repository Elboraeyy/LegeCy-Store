'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createManualOrder } from '@/lib/actions/order';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

interface Product {
    id: string;
    name: string;
    category: { name: string } | null;
    variants: {
        id: string;
        sku: string;
        name: string;
        price: number; // Already converted from Decimal
        warehouseStock: {
            available: number;
            warehouse: { id: string; name: string };
        }[];
    }[];
}

interface Customer {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    addresses: {
        street: string;
        city: string;
        governorate: string;
        postalCode: string | null;
    }[];
}

interface CartItem {
    variantId: string;
    productName: string;
    variantName: string;
    sku: string;
    quantity: number;
    price: number;
}

interface CreateOrderClientProps {
    products: Product[];
    customers: Customer[];
}

export default function CreateOrderClient({ products, customers }: CreateOrderClientProps) {
    const { language } = useLanguage();
    const t = adminDictionary[language];
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    
    // Customer Section
    const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('new');
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    
    // Shipping Address
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [governorate, setGovernorate] = useState('');
    const [postalCode, setPostalCode] = useState('');
    
    // Cart
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const [quantity, setQuantity] = useState(1);
    
    // Notes
    const [orderNotes, setOrderNotes] = useState('');
    const [orderSource, setOrderSource] = useState('instagram');

    // Helpers
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
            style: 'currency',
            currency: 'EGP',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const selectedProduct = products.find(p => p.id === selectedProductId);
    const selectedVariant = selectedProduct?.variants.find(v => v.id === selectedVariantId);

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Add to cart
    const handleAddToCart = () => {
        if (!selectedVariant || !selectedProduct) return;

        const existingIndex = cart.findIndex(item => item.variantId === selectedVariantId);
        const price = selectedVariant.price;

        if (existingIndex >= 0) {
            const updated = [...cart];
            updated[existingIndex].quantity += quantity;
            setCart(updated);
        } else {
            setCart([...cart, {
                variantId: selectedVariant.id,
                productName: selectedProduct.name,
                variantName: selectedVariant.name,
                sku: selectedVariant.sku,
                quantity,
                price
            }]);
        }

        setSelectedProductId('');
        setSelectedVariantId('');
        setQuantity(1);
        toast.success(t.orders.create.added_to_cart);
    };

    // Remove from cart
    const handleRemoveFromCart = (variantId: string) => {
        setCart(cart.filter(item => item.variantId !== variantId));
    };

    // When existing customer selected
    const handleCustomerSelect = (customerId: string) => {
        setSelectedCustomerId(customerId);
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            setCustomerName(customer.name || '');
            setCustomerEmail(customer.email || '');
            setCustomerPhone(customer.phone || '');
            if (customer.addresses[0]) {
                setStreet(customer.addresses[0].street);
                setCity(customer.addresses[0].city);
                setGovernorate(customer.addresses[0].governorate);
                setPostalCode(customer.addresses[0].postalCode || '');
            }
        }
    };

    // Submit order
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
            // Combine address parts for storage (Order model only has shippingAddress + shippingCity)
            const fullAddress = `${street}, ${governorate}${postalCode ? ` ${postalCode}` : ''}`;
            
            const result = await createManualOrder({
                customer: customerMode === 'existing' && selectedCustomerId 
                    ? { existingId: selectedCustomerId }
                    : { name: customerName, email: customerEmail, phone: customerPhone },
                shippingAddress: { street: fullAddress, city },
                items: cart.map(item => ({ variantId: item.variantId, quantity: item.quantity })),
                notes: orderNotes,
                source: orderSource
            });

            if (result.success) {
                toast.success(t.orders.create.success);
                router.push(`/admin/orders/${result.orderId}`);
            } else {
                toast.error(result.error || t.common.error || 'Failed to create order');
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
        <div>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">{t.orders.create.title}</h1>
                    <p className="admin-subtitle">{t.orders.create.subtitle}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        onClick={() => router.back()} 
                        className="admin-btn admin-btn-outline"
                    >
                        ← {t.common.back || t.orders.details_page.back}
                    </button>
                </div>
            </div>

            {/* Main Content - Two Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
                {/* Left Column - Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Customer Section */}
                    <div className="admin-card">
                        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', marginBottom: '20px' }}>
                            👤 {t.orders.create.customer_info}
                        </h2>

                        {/* Customer Mode Toggle */}
                        <div className="admin-tabs" style={{ marginBottom: '20px' }}>
                            <button 
                                className={`admin-tab-item ${customerMode === 'new' ? 'active' : ''}`}
                                onClick={() => setCustomerMode('new')}
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

                        {customerMode === 'existing' && (
                            <div className="admin-form-group" style={{ marginBottom: '16px' }}>
                                <label>{t.orders.create.select_customer}</label>
                                <AdminDropdown
                                    options={[{ value: '', label: t.orders.create.choose_customer }, ...customers.map(c => ({ value: c.id, label: `${c.name || 'Unnamed'} - ${c.email || c.phone}` }))]}
                                    value={selectedCustomerId}
                                    onChange={handleCustomerSelect}
                                    placeholder={t.orders.create.choose_customer}
                                />
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="admin-form-group">
                                <label>{t.orders.create.name} *</label>
                                <input 
                                    type="text" 
                                    className="form-input"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder={t.orders.create.name}
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>{t.orders.create.phone} *</label>
                                <input 
                                    type="tel" 
                                    className="form-input"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    placeholder="01xxxxxxxxx"
                                />
                            </div>
                            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
                                <label>{t.orders.create.email}</label>
                                <input 
                                    type="email" 
                                    className="form-input"
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                    placeholder="email@example.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="admin-card">
                        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', marginBottom: '20px' }}>
                            📍 {t.orders.create.shipping_address}
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
                                <label>{t.orders.create.street} *</label>
                                <input 
                                    type="text" 
                                    className="form-input"
                                    value={street}
                                    onChange={(e) => setStreet(e.target.value)}
                                    placeholder={t.orders.create.street}
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>{t.orders.create.city} *</label>
                                <input 
                                    type="text" 
                                    className="form-input"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder={t.orders.create.city}
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>{t.orders.create.governorate} *</label>
                                <AdminDropdown
                                    options={[
                                        { value: '', label: t.orders.create.governorate + '...' },
                                        ...egyptGovernorates.map(gov => ({
                                            value: gov,
                                            label: (t as any).governorates?.[gov] || gov
                                        }))
                                    ]}
                                    value={governorate}
                                    onChange={setGovernorate}
                                    placeholder={t.orders.create.governorate + '...'}
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>{t.orders.create.postal_code}</label>
                                <input 
                                    type="text" 
                                    className="form-input"
                                    value={postalCode}
                                    onChange={(e) => setPostalCode(e.target.value)}
                                    placeholder={t.orders.create.optional}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Add Products */}
                    <div className="admin-card">
                        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', marginBottom: '20px' }}>
                            🛒 {t.orders.create.add_products}
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: language === 'ar' ? '2fr 2fr 1fr auto' : '2fr 2fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                            <div className="admin-form-group">
                                <label>{t.orders.create.product}</label>
                                <AdminDropdown
                                    options={[{ value: '', label: t.orders.create.select_product }, ...products.map(p => ({ value: p.id, label: `${p.name}${p.category ? ` (${p.category.name})` : ''}` }))]}
                                    value={selectedProductId}
                                    onChange={(val) => {
                                        setSelectedProductId(val);
                                        setSelectedVariantId('');
                                    }}
                                    placeholder={t.orders.create.select_product}
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>{t.orders.create.variant}</label>
                                <AdminDropdown
                                    options={[
                                        { value: '', label: t.orders.create.select_variant },
                                        ...(selectedProduct?.variants.map(v => {
                                            const stock = v.warehouseStock.reduce((sum, ws) => sum + ws.available, 0);
                                            return { value: v.id, label: `${v.name} - ${formatCurrency(v.price)} (${stock} ${t.orders.create.in_stock})` };
                                        }) || [])
                                    ]}
                                    value={selectedVariantId}
                                    onChange={setSelectedVariantId}
                                    placeholder={t.orders.create.select_variant}
                                    disabled={!selectedProduct}
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>{t.orders.create.qty}</label>
                                <input 
                                    type="number" 
                                    className="form-input"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    min={1}
                                    style={{ textAlign: 'center' }}
                                />
                            </div>
                            <button 
                                className="admin-btn admin-btn-primary"
                                onClick={handleAddToCart}
                                disabled={!selectedVariantId}
                                style={{ marginBottom: '8px' }}
                            >
                                {t.orders.create.add}
                            </button>
                        </div>
                    </div>

                    {/* Order Notes */}
                    <div className="admin-card">
                        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', marginBottom: '20px' }}>
                            📝 {t.orders.create.order_details}
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="admin-form-group">
                                <label>{t.orders.create.order_source}</label>
                                <AdminDropdown
                                    options={[
                                        { value: 'instagram', label: 'Instagram' },
                                        { value: 'facebook', label: 'Facebook' },
                                        { value: 'whatsapp', label: 'WhatsApp' },
                                        { value: 'phone', label: t.common.phone || 'Phone' },
                                        { value: 'in_store', label: 'In Store' },
                                        { value: 'other', label: 'Other' }
                                    ]}
                                    value={orderSource}
                                    onChange={setOrderSource}
                                />
                            </div>
                            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
                                <label>{t.orders.create.notes}</label>
                                <textarea 
                                    className="form-input"
                                    value={orderNotes}
                                    onChange={(e) => setOrderNotes(e.target.value)}
                                    placeholder={t.orders.create.instructions_placeholder}
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Cart Summary */}
                <div>
                    <div className="admin-card" style={{ position: 'sticky', top: '24px' }}>
                        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', marginBottom: '20px' }}>
                            🧾 {t.orders.create.order_summary}
                        </h2>

                        {cart.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                                {t.orders.create.no_items}
                            </div>
                        ) : (
                            <div>
                                {cart.map((item, index) => (
                                    <div 
                                        key={item.variantId}
                                        style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            padding: '12px 0',
                                            borderBottom: index < cart.length - 1 ? '1px solid var(--admin-border)' : 'none'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.productName}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                                                {item.variantName} • {item.sku}
                                            </div>
                                            <div style={{ fontSize: '13px', marginTop: '4px' }}>
                                                {item.quantity} × {formatCurrency(item.price)}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ fontWeight: 600 }}>
                                                {formatCurrency(item.price * item.quantity)}
                                            </div>
                                            <button 
                                                onClick={() => handleRemoveFromCart(item.variantId)}
                                                style={{ 
                                                    background: 'none', 
                                                    border: 'none', 
                                                    color: '#991b1b', 
                                                    cursor: 'pointer',
                                                    fontSize: '18px'
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Total */}
                                <div style={{ 
                                    marginTop: '20px', 
                                    paddingTop: '20px', 
                                    borderTop: '2px solid var(--admin-border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                        <span style={{ fontSize: '16px', fontWeight: 600 }}>{t.orders.details.total}</span>
                                    <span className="stat-value" style={{ fontSize: '28px' }}>
                                        {formatCurrency(cartTotal)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button 
                            className="admin-btn admin-btn-primary"
                            onClick={handleSubmit}
                            disabled={loading || cart.length === 0}
                            style={{ width: '100%', marginTop: '24px', padding: '16px' }}
                        >
                            {loading ? t.orders.create.creating : t.orders.create.create_order}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
