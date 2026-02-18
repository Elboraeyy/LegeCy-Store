'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createManualOrder, searchCustomersAction, updateOrderAction } from '@/lib/actions/order';
import { calculateShipping } from '@/lib/actions/shipping';
import { searchAdminProducts } from '@/lib/actions/product-search-actions';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';
import { OrderStatus, Order } from '@/types/order';

import { EGYPT_LOCATIONS } from '@/data/egypt-locations';

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
        totalPrice: number | { toNumber: () => number };
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
    initialOrder?: Order | null; // New Prop for Edit Mode
}

export default function CreateOrderClient({ initialProducts, initialCustomers, initialOrder }: CreateOrderClientProps) {
    const { language } = useLanguage();
    const t = adminDictionary[language];
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const isEditMode = !!initialOrder;
    
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
    const [alternativePhone, setAlternativePhone] = useState('');

    const [shippingAddress, setShippingAddress] = useState(''); // Use single field for edit compatibility or split
    // Mapping: initialOrder.shippingAddress -> street
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [governorate, setGovernorate] = useState('');

    const [cart, setCart] = useState<CartItem[]>([]);
    const [orderNotes, setOrderNotes] = useState('');
    const [orderSource, setOrderSource] = useState('instagram');
    const [orderStatus, setOrderStatus] = useState<OrderStatus>(OrderStatus.Pending);

    // Coupon & Shipping
    // Shipping
    const [shippingCost, setShippingCost] = useState(0);

    // Manual Discount
    const [manualDiscountType, setManualDiscountType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
    const [manualDiscountValue, setManualDiscountValue] = useState<number>(0);

    // Payment Method
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'paymob' | 'instapay' | 'wallet'>('cod');

    // Product Selection State
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    // Initialize from initialOrder if present
    useEffect(() => {
        if (initialOrder) {
            // Customer Info
            if (initialOrder.user) {
                setCustomerMode('existing');
                // We don't have the full customer object passed in initialOrder.user usually (just name/email), 
                // but we might want to fetch it or just use the order details.
                // For simplicity, let's pre-fill the "new" form fields or set as existing if we can match ID?
                // initialOrder doesn't have userId directly in the Type? Check type.
                // Type Order has: user?: { name, email } but no ID? 
                // schema has userId. Type might be mapped. 
                // Let's rely on the textual fields from the order mostly.
            }

            setCustomerName(initialOrder.firstName || initialOrder.user?.name || '');
            setCustomerEmail(initialOrder.customerEmail || initialOrder.user?.email || '');
            setCustomerPhone(initialOrder.customerPhone || '');
            setAlternativePhone(initialOrder.alternativePhone || '');

            // Address
            setStreet(initialOrder.shippingAddress || '');
            setCity(initialOrder.shippingCity || '');
            setGovernorate(initialOrder.shippingGovernorate || '');

            // Cart
            const mappedItems: CartItem[] = initialOrder.items.map(item => ({
                variantId: item.variantId || 'novar', // logic needs care if null
                productId: item.productId,
                productName: item.name,
                sku: 'N/A', // We might not have SKU in OrderItem, need to fetch? 
                // Actually OrderItem in CreateOrderClient expects SKU.
                // The item.name usually contains SKU in brackets from create logic: `${variant.product.name} (${variant.sku})`
                // Let's try to extract or just leave N/A.
                quantity: item.quantity,
                price: item.price,
                imageUrl: null // We don't have image URL in OrderItem usually unless we fetch product
            }));
            setCart(mappedItems);

            setOrderNotes(initialOrder.shippingNotes || '');
            setOrderSource(initialOrder.orderSource || 'manual');
            setOrderStatus(initialOrder.status);
            setPaymentMethod(initialOrder.paymentMethod as any || 'cod');

            // Costs - Assuming we can set them directly
            setShippingCost(initialOrder.shippingCost || 0); // Need to check if Order type has shippingCost.
            // Order type in src/types/order.ts DOES NOT have shippingCost?
            // Let me check the type definition I saw earlier.
            // src/types/order.ts:
            // export interface Order { ... shippingCost (not listed?) ... }
            // Wait, looking at file view earlier:
            // Order interface has `totalPrice`, `items`... 
            // I need to check if schema has it. Schema has `shippingCost Decimal?`.
            // Type might need update or I missed it.
            // CreateOrderClient uses `shippingCost` state.
            // Looking at `CreateOrderClient` original code:
            // `const [shippingCost, setShippingCost] = useState(0);`

            // If I map initialOrder, I need to know where shippingCost is.
            // I'll assume it's on the object passed from backend (even if not in type strict).
            // Cast it: (initialOrder as any).shippingCost

            const cost = (initialOrder as any).shippingCost || 0;
            setShippingCost(Number(cost));

            const discount = (initialOrder as any).discountAmount || 0;
            setManualDiscountValue(Number(discount));
            // Assuming fixed for loaded orders to simplify
            setManualDiscountType('FIXED');

        }
    }, [initialOrder]);

    // Debounced Search Effects
    useEffect(() => {
        if (customerQuery.length < 2) {
            if (customerQuery === '') setCustomers(initialCustomers);
            return;
        }
        const timer = setTimeout(async () => {
            setIsSearchingCustomers(true);
            const results = await searchCustomersAction(customerQuery);
            setCustomers(results as unknown as Customer[]);
            setIsSearchingCustomers(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [customerQuery, initialCustomers]);

    useEffect(() => {
        setCurrentPage(1); // Reset page on search
        if (productQuery.length < 2) {
            if (productQuery === '') setProducts(initialProducts);
            return;
        }
        const timer = setTimeout(async () => {
            setIsSearchingProducts(true);
            const results = await searchAdminProducts(productQuery);
            setProducts(results as unknown as Product[]);
            setIsSearchingProducts(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [productQuery, initialProducts]);

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
            style: 'currency',
            currency: 'EGP',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Shipping Rules (Only calc if not editing or explicitly changed governorate? 
    // Actually if editing, we preserve existing shipping cost unless governorate changes.)
    // Only run this effect if governorate changes AFTER initial load.
    // Making it simple: if governorate matches initialOrder's, keep initial cost.
    useEffect(() => {
        async function fetchShipping() {
            if (!governorate) {
                setShippingCost(0);
                return;
            }

            // If editing and gov hasn't changed from original, don't overwrite manual shipping cost
            if (isEditMode && initialOrder && governorate === initialOrder.shippingGovernorate) {
                // keep existing set by initial effect
                return;
            }

            try {
                const result = await calculateShipping(governorate, subtotal, city);
                setShippingCost(result.shippingCost);
            } catch (error) {
                console.error("Failed to calculate shipping", error);
                const lowerGov = governorate.toLowerCase();
                let cost = 80;
                if (lowerGov.includes('cairo') || lowerGov.includes('giza')) {
                    cost = 50;
                } else if (lowerGov.includes('alexandria')) {
                    cost = 65;
                }
                setShippingCost(cost);
            }
        }
        fetchShipping();
    }, [governorate, city, subtotal, isEditMode, initialOrder]);

    const manualDiscountAmount = manualDiscountType === 'PERCENTAGE'
        ? (subtotal * manualDiscountValue) / 100
        : manualDiscountValue;

    const totalDiscount = manualDiscountAmount;
    const finalTotal = Math.max(0, subtotal - totalDiscount + shippingCost);

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
        const quantityToAdd = quantities[variant.id] || 1;

        if (quantityToAdd <= 0) {
            toast.error("Quantity must be at least 1");
            return;
        }

        const existing = cart.find(i => i.variantId === variant.id);
        const currentQtyInCart = existing ? existing.quantity : 0;
        const totalQty = currentQtyInCart + quantityToAdd;

        // For Edit Mode: Need to consider that some stock might already be reserved by THIS order.
        // If we increased quantity, we check stock.
        // Doing strict stock check on frontend for edit is tricky without knowing previous quantity.
        // Let's allow adding, server will validate.
        // But for UX, try to check.

        if (totalQty > stock && !isEditMode) {
        // Strict check for new orders
            toast.error(`${t.orders.create.error_stock || 'Insufficient stock'}: ${stock} items available`);
            return;
        }

        if (existing) {
            setCart(cart.map(i => i.variantId === variant.id ? { ...i, quantity: totalQty } : i));
        } else {
            setCart([...cart, {
                variantId: variant.id,
                productId: product.id,
                productName: product.name,
                sku: variant.sku,
                quantity: quantityToAdd,
                price: Number(variant.price),
                imageUrl: product.imageUrl
            }]);
        }

        // Reset quantity input
        setQuantities(prev => ({ ...prev, [variant.id]: 1 }));
        toast.success(t.orders.create.added_to_cart);
    };

    const handleRemoveFromCart = (variantId: string) => {
        setCart(cart.filter(item => item.variantId !== variantId));
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
            if (isEditMode && initialOrder) {
                // Update Existing Order
                const result = await updateOrderAction(initialOrder.id, {
                    firstName: customerName.split(' ')[0],
                    lastName: customerName.split(' ').slice(1).join(' '),
                    customerPhone,
                    alternativePhone,
                    customerEmail,
                    shippingAddress: street,
                    shippingCity: city,
                    shippingGovernorate: governorate,
                    shippingNotes: orderNotes,
                    items: cart.map(item => ({
                        productId: item.productId,
                        variantId: item.variantId,
                        name: item.productName,
                        price: item.price,
                        quantity: item.quantity
                    })),
                    shippingCost,
                    discountAmount: totalDiscount,
                });

                if (result.success) {
                    // Check for Status Change
                    if (orderStatus !== initialOrder.status) {
                        const { updateOrderStatusAction } = await import('@/lib/actions/order');
                        await updateOrderStatusAction(initialOrder.id, orderStatus, 'Changed via Edit Order Page');
                    }

                    toast.success("Order updated successfully");
                    router.push(`/admin/orders/${initialOrder.id}`);
                    router.refresh();
                } else {
                    toast.error(result.error || t.common.error);
                }
            } else {
            // Create New Order
                const result = await createManualOrder({
                    customer: customerMode === 'existing' && selectedCustomer
                        ? { existingId: selectedCustomer.id }
                        : { name: customerName, email: customerEmail, phone: customerPhone, alternativePhone },
                    shippingAddress: { street, city, governorate },
                    items: cart.map(item => ({ variantId: item.variantId, quantity: item.quantity })),
                    notes: orderNotes,
                    source: orderSource,
                    discountAmount: Number(totalDiscount),
                    shippingCost: shippingCost,
                    paymentMethod,
                    status: orderStatus
                });

                if (result.success) {
                    toast.success(t.orders.create.success);
                    router.push(`/admin/orders/${result.orderId}`);
                } else {
                    toast.error(result.error || t.common.error);
                }
            }
        } catch {
            toast.error(t.common.error);
        } finally {
            setLoading(false);
        }
    };

    const selectedGov = EGYPT_LOCATIONS.find(g => g.en === governorate);
    const citiesOptions = selectedGov ? selectedGov.cities.map(c => ({
        value: c.en,
        label: language === 'ar' ? c.ar : c.en
    })) : [];

    return (
        <div style={{ paddingBottom: '100px' }}>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">{isEditMode ? 'Edit Order' : t.orders.create.title}</h1>
                    <p className="admin-subtitle">
                        {isEditMode ? `Editing Order #${initialOrder?.orderNumber}` : t.orders.create.subtitle}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => router.back()} className="admin-btn admin-btn-outline">
                        ← {t.common.back}
                    </button>
                    {!isEditMode && (
                        <button
                            onClick={() => {
                                setOrderStatus(OrderStatus.Draft);
                                handleSubmit();
                            }}
                            className="admin-btn admin-btn-outline"
                        >
                            💾 {t.orders.create.save_draft || 'Save Draft'}
                        </button>
                    )}
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
                            {!isEditMode && (
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
                            )}
                        </div>

                        {customerMode === 'existing' && !isEditMode && (
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

                        {selectedCustomer && selectedCustomer.orders && selectedCustomer.orders.length > 0 && !isEditMode && (
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
                            {products.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map(p => (
                                <div key={p.id} style={{
                                    border: '1px solid var(--admin-border)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    display: 'flex',
                                    gap: '16px',
                                    backgroundColor: 'var(--admin-bg-surface)'
                                }}>
                                    {/* Product Image */}
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        backgroundColor: '#f3f4f6',
                                        flexShrink: 0
                                    }}>
                                        {p.imageUrl ? (
                                            <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '20px' }}>📦</div>
                                        )}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '15px' }}>{p.name}</div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {p.variants.map(v => {
                                                const stock = v.warehouseStock.reduce((sum, i) => sum + i.available, 0);
                                                const currentQty = quantities[v.id] || 1;
                                                const isOutOfStock = stock <= 0;

                                                return (
                                                    <div key={v.id} style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '8px',
                                                        backgroundColor: 'var(--admin-bg-secondary)',
                                                        borderRadius: '6px',
                                                        opacity: isOutOfStock ? 0.6 : 1
                                                    }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ fontSize: '13px', fontWeight: 500 }}>{v.sku}</span>
                                                            <span style={{ fontSize: '11px', color: isOutOfStock ? '#ef4444' : '#166534' }}>
                                                                {isOutOfStock ? 'Out of Stock' : `${stock} in stock`}
                                                            </span>
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <span style={{ fontWeight: 600, fontSize: '13px' }}>{formatCurrency(Number(v.price))}</span>

                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                                                                <button 
                                                                    disabled={isOutOfStock || currentQty <= 1}
                                                                    onClick={() => setQuantities({ ...quantities, [v.id]: Math.max(1, currentQty - 1) })}
                                                                    className="admin-btn-outline"
                                                                    style={{ padding: '4px 8px', borderRadius: '4px 0 0 4px', borderRight: 'none', height: '32px' }}
                                                                >
                                                                    -
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    max={stock}
                                                                    value={currentQty}
                                                                    onChange={(e) => {
                                                                        const val = parseInt(e.target.value) || 0;
                                                                        if (val >= 0 && val <= stock) {
                                                                            setQuantities({ ...quantities, [v.id]: val });
                                                                        }
                                                                    }}
                                                                    style={{ 
                                                                        width: '40px',
                                                                        textAlign: 'center',
                                                                        border: '1px solid var(--admin-border)',
                                                                        height: '32px',
                                                                        fontSize: '13px'
                                                                    }}
                                                                />
                                                                <button
                                                                    disabled={isOutOfStock || currentQty >= stock}
                                                                    onClick={() => setQuantities({ ...quantities, [v.id]: Math.min(stock, currentQty + 1) })}
                                                                    className="admin-btn-outline"
                                                                    style={{ padding: '4px 8px', borderRadius: '0 4px 4px 0', borderLeft: 'none', height: '32px' }}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>

                                                            <button
                                                                onClick={() => handleAddToCart(p, v)}
                                                                disabled={isOutOfStock}
                                                                className="admin-btn admin-btn-primary"
                                                                style={{ padding: '6px 12px', fontSize: '12px', height: '32px' }}
                                                            >
                                                                {t.orders.create.add}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {products.length > ITEMS_PER_PAGE && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '20px' }}>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="admin-btn admin-btn-outline"
                                    style={{ padding: '8px 16px' }}
                                >
                                    ← {t.common.back || 'Previous'}
                                </button>
                                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                                    Page {currentPage} of {Math.ceil(products.length / ITEMS_PER_PAGE)}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(products.length / ITEMS_PER_PAGE), prev + 1))}
                                    disabled={currentPage >= Math.ceil(products.length / ITEMS_PER_PAGE)}
                                    className="admin-btn admin-btn-outline"
                                    style={{ padding: '8px 16px' }}
                                >
                                    {t.common.next || 'Next'} →
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Shipping & Meta */}
                    <div className="admin-card">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="admin-form-group">
                                <label>{t.orders.create.governorate} *</label>
                                <AdminDropdown
                                    options={[
                                        { value: '', label: t.orders.create.optional || 'Select Governorate...' },
                                        ...EGYPT_LOCATIONS.map(gov => ({
                                            value: gov.en,
                                            label: language === 'ar' ? gov.ar : gov.en
                                        }))
                                    ]}
                                    value={governorate}
                                    onChange={(val) => {
                                        setGovernorate(val);
                                        setCity(''); // Reset city when governorate changes
                                    }}
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>{t.orders.create.city} *</label>
                                <AdminDropdown
                                    options={[
                                        { value: '', label: t.orders.create.optional || 'Select City...' },
                                        ...citiesOptions
                                    ]}
                                    value={city}
                                    onChange={setCity}
                                    disabled={!governorate}
                                />
                            </div>
                            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
                                <label>📍 {t.orders.create.street} *</label>
                                <textarea
                                    className="form-input"
                                    value={street}
                                    onChange={(e) => setStreet(e.target.value)}
                                    rows={3}
                                    placeholder={t.orders.create.shipping_address}
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
                                <div key={item.variantId} style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--admin-border)' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#f3f4f6', flexShrink: 0 }}>
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>📦</div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{item.productName}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>{item.sku} × {item.quantity}</div>
                                    </div>
                                    <div style={{ fontWeight: 600 }}>{formatCurrency(item.price * item.quantity)}</div>
                                    <button onClick={() => handleRemoveFromCart(item.variantId)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}>✕</button>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{t.orders.create.subtotal || 'Subtotal'}</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>

                            {/* Manual Discount UI */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: 'var(--admin-bg-secondary)', borderRadius: '8px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600 }}>Manual Discount</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--admin-border)' }}>
                                        <button
                                            type="button"
                                            onClick={() => setManualDiscountType('FIXED')}
                                            style={{
                                                padding: '4px 12px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                backgroundColor: manualDiscountType === 'FIXED' ? '#12403C' : 'transparent',
                                                color: manualDiscountType === 'FIXED' ? 'white' : 'var(--admin-text)',
                                                border: 'none',
                                                transition: 'all 0.2s',
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            className={manualDiscountType !== 'FIXED' ? "hover-bg" : ""}
                                        >
                                            EGP
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setManualDiscountType('PERCENTAGE')}
                                            style={{
                                                padding: '4px 12px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                backgroundColor: manualDiscountType === 'PERCENTAGE' ? '#12403C' : 'transparent',
                                                color: manualDiscountType === 'PERCENTAGE' ? 'white' : 'var(--admin-text)',
                                                border: 'none',
                                                borderLeft: '1px solid var(--admin-border)',
                                                transition: 'all 0.2s',
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            className={manualDiscountType !== 'PERCENTAGE' ? "hover-bg" : ""}
                                        >
                                            %
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        className="form-input"
                                        style={{ height: '32px', padding: '4px 8px' }}
                                        value={manualDiscountValue}
                                        onChange={(e) => setManualDiscountValue(Number(e.target.value))}
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534' }}>
                                <span>{t.orders.create.discount || 'Total Discount'}</span>
                                <span>-{formatCurrency(totalDiscount)}</span>
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

                        {/* Payment Method Section */}
                        <div style={{ marginTop: '24px' }}>
                            <div className="admin-form-group">
                                <label>💳 {t.orders.create.payment_method || 'Payment Method'}</label>
                                <AdminDropdown
                                    options={[
                                        { value: 'cod', label: 'Cash on Delivery (COD)' },
                                        { value: 'instapay', label: 'InstaPay' },
                                        { value: 'wallet', label: 'E-Wallet' },
                                        { value: 'paymob', label: 'Credit Card (Link)' }
                                    ]}
                                    value={paymentMethod}
                                    onChange={(val) => setPaymentMethod(val as any)}
                                />
                            </div>
                        </div>

                        <button 
                            className="admin-btn admin-btn-primary" 
                            style={{ width: '100%', marginTop: '32px', padding: '16px' }}
                            disabled={loading || cart.length === 0}
                            onClick={handleSubmit}
                        >
                            {loading ? (isEditMode ? 'Updating Order...' : t.orders.create.creating) : (isEditMode ? 'Update Order' : t.orders.create.create_order)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
