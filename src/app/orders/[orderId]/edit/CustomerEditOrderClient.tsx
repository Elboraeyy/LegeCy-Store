'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { updateOrderAction } from '@/lib/actions/order';
import { calculateShipping } from '@/lib/actions/shipping';
import { toast } from 'sonner';
import {
    Save,
    MapPin,
    User,
    ShoppingBag,
    Plus,
    Minus,
    Trash2,
    Search,
    Package,
    ArrowLeft
} from 'lucide-react';
import Image from 'next/image';
import { EGYPT_LOCATIONS } from '@/data/egypt-locations';

// Types
interface Product {
    id: string;
    name: string;
    category: { name: string } | null;
    variants: Array<{
        id: string;
        sku: string;
        name: string;
        price: number;
        warehouseStock: Array<{
            available: number;
            warehouse: { id: string; name: string; }
        }>;
    }>;
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

interface CustomerEditOrderClientProps {
    initialProducts: Product[];
    initialOrder: any; // Using simplified type for now
    currentUser: {
        name: string;
        email: string;
        phone: string;
    };
}

export default function CustomerEditOrderClient({ initialProducts, initialOrder, currentUser }: CustomerEditOrderClientProps) {
    const { language, t } = useLanguage();
    const router = useRouter();
    const isRtl = language === 'ar';
    const currency = 'EGP';

    // State - Customer Info
    const [firstName, setFirstName] = useState(initialOrder.firstName || currentUser.name.split(' ')[0] || '');
    const [lastName, setLastName] = useState(initialOrder.lastName || currentUser.name.split(' ').slice(1).join(' ') || '');
    const [customerEmail, setCustomerEmail] = useState(initialOrder.customerEmail || currentUser.email || '');
    const [customerPhone, setCustomerPhone] = useState(initialOrder.customerPhone || currentUser.phone || '');
    const [alternativePhone, setAlternativePhone] = useState(initialOrder.alternativePhone || '');

    // State - Shipping
    const [street, setStreet] = useState(initialOrder.shippingAddress || '');
    const [city, setCity] = useState(initialOrder.shippingCity || '');
    const [governorate, setGovernorate] = useState(initialOrder.shippingGovernorate || '');
    const [orderNotes, setOrderNotes] = useState(initialOrder.shippingNotes || '');
    const [shippingCost, setShippingCost] = useState<number>(initialOrder.shippingCost || 0);

    // State - Cart
    const [cart, setCart] = useState<CartItem[]>(() => {
        return initialOrder.items.map((item: any) => {
            // Try to find SKU from initialProducts
            let sku = 'N/A';
            if (item.productId) {
                const product = initialProducts.find(p => p.id === item.productId);
                if (product) {
                    if (item.variantId) {
                        const variant = product.variants.find(v => v.id === item.variantId);
                        if (variant) sku = variant.sku;
                    } else if (product.variants.length === 1) {
                        // Fallback for single variant products if variantId is missing but implied
                        sku = product.variants[0].sku;
                    }
                }
            }

            return {
                variantId: item.variantId || 'novar', // handle null variantId
                productId: item.productId,
                productName: item.name,
                sku: sku,
                quantity: item.quantity,
                price: item.price,
                imageUrl: null
            };
        });
    });

    // State - Meta
    const [loading, setLoading] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [showProductSearch, setShowProductSearch] = useState(false);

    // Derived
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + shippingCost;

    // Shipping Calculation Effect
    useEffect(() => {
        async function fetchShipping() {
            if (!governorate) {
                setShippingCost(0);
                return;
            }

            // If gov matches initial order, keep original cost (preserves custom rates/legacy)
            // Unless the user explicitly changed it back and forth, but this is a safe default for "Edit"
            if (governorate === initialOrder.shippingGovernorate && city === initialOrder.shippingCity) {
                setShippingCost(initialOrder.shippingCost || 0);
                return;
            }

            try {
                const result = await calculateShipping(governorate, subtotal, city);
                setShippingCost(result.shippingCost);
            } catch (error) {
                console.error("Failed to calculate shipping", error);
                // Fallback (simple logic if server action fails)
                const lowerGov = governorate.toLowerCase();
                let cost = 50;
                if (lowerGov.includes('cairo') || lowerGov.includes('giza')) {
                    cost = 40;
                } else if (lowerGov.includes('alexandria')) {
                    cost = 50;
                } else {
                    cost = 70;
                }
                setShippingCost(cost);
            }
        }
        fetchShipping();
    }, [governorate, city, subtotal, initialOrder.shippingGovernorate, initialOrder.shippingCity, initialOrder.shippingCost]);


    // Locations Logic
    const selectedGov = EGYPT_LOCATIONS.find(g => g.en === governorate);
    const displayedCities = selectedGov ? selectedGov.cities : [];

    // Handlers
    const handleQuantityChange = (variantId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.variantId === variantId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const handleRemoveItem = (variantId: string) => {
        setCart(prev => prev.filter(item => item.variantId !== variantId));
    };

    const handleAddProduct = (product: Product, variantId?: string) => {
        const variant = product.variants.find(v => v.id === variantId);
        if (!variant) return;

        setCart(prev => {
            const existing = prev.find(item => item.variantId === variant.id);
            if (existing) {
                return prev.map(item => item.variantId === variant.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
                );
            }
            return [...prev, {
                variantId: variant.id,
                productId: product.id,
                productName: product.name,
                sku: variant.sku,
                quantity: 1,
                price: variant.price, // Use base price
                imageUrl: null
            }];
        });
        setProductSearch('');
        setShowProductSearch(false);
    };

    const handleSubmit = async () => {
        if (!street || !city || !governorate || !customerPhone) {
            toast.error(isRtl ? 'يرجى ملء جميع البيانات المطلوبة' : 'Please fill all required fields');
            return;
        }
        if (cart.length === 0) {
            toast.error(isRtl ? 'السلة فارغة' : 'Cart is empty');
            return;
        }

        setLoading(true);
        try {
            const result = await updateOrderAction(initialOrder.id, {
                firstName,
                lastName,
                customerEmail,
                customerPhone,
                alternativePhone,
                shippingAddress: street,
                shippingCity: city,
                shippingGovernorate: governorate,
                shippingNotes: orderNotes,
                items: cart.map(item => ({
                    productId: item.productId,
                    variantId: item.variantId === 'novar' ? null : item.variantId,
                    name: item.productName,
                    price: item.price,
                    quantity: item.quantity
                })),
                shippingCost,
                discountAmount: initialOrder.discountAmount
            });

            if (result.success) {
                toast.success(isRtl ? 'تم تحديث الطلب بنجاح' : 'Order updated successfully');
                router.push(`/orders/${initialOrder.id}`);
                router.refresh();
            } else {
                toast.error(result.error || (isRtl ? 'فشل التحديث' : 'Update failed'));
            }
        } catch (error) {
            console.error(error);
            toast.error(isRtl ? 'حدث خطأ ما' : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    // Filter Products for Search
    const filteredProducts = initialProducts.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.variants.some(v => v.sku.toLowerCase().includes(productSearch.toLowerCase()))
    ).slice(0, 5);

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-white rounded-full transition-colors"
                        >
                            <ArrowLeft size={24} className={isRtl ? 'rotate-180' : ''} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {isRtl ? 'تعديل الطلب' : 'Edit Order'} #{initialOrder.orderNumber}
                            </h1>
                            <p className="text-sm text-gray-500">
                                {new Date(initialOrder.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-primary flex items-center gap-2 px-6 py-2 rounded-xl disabled:opacity-50"
                    >
                        {loading ? (
                            <span>{isRtl ? 'جاري الحفظ...' : 'Saving...'}</span>
                        ) : (
                            <>
                                <Save size={18} />
                                <span>{isRtl ? 'حفظ التعديلات' : 'Save Changes'}</span>
                            </>
                        )}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Items */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <ShoppingBag size={20} className="text-primary" />
                                    {isRtl ? 'المنتجات' : 'Items'}
                                </h2>
                                <button
                                    onClick={() => setShowProductSearch(!showProductSearch)}
                                    className="text-primary text-sm font-medium hover:underline"
                                >
                                    {isRtl ? '+ إضافة منتج' : '+ Add Item'}
                                </button>
                            </div>

                            {/* Product Search */}
                            {showProductSearch && (
                                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="relative mb-3">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder={isRtl ? 'بحث عن منتج...' : 'Search for product...'}
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {filteredProducts.map(product => (
                                            <div key={product.id} className="bg-white p-3 rounded-lg border hover:border-primary cursor-pointer transition-colors">
                                                <div className="font-medium text-gray-900">{product.name}</div>
                                                <div className="mt-2 space-y-1">
                                                    {product.variants.map(variant => (
                                                        <div
                                                            key={variant.id}
                                                            className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                                                            onClick={() => handleAddProduct(product, variant.id)}
                                                        >
                                                            <span>{variant.sku}</span>
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-bold">{variant.price} {currency}</span>
                                                                <span className={`text-xs px-2 py-0.5 rounded-full ${variant.warehouseStock.some(s => s.available > 0) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {variant.warehouseStock.some(s => s.available > 0) ? (isRtl ? 'متاح' : 'In Stock') : (isRtl ? 'نفذت' : 'Out of Stock')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Cart Items */}
                            <div className="space-y-4">
                                {cart.map((item) => (
                                    <div key={item.variantId} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border">
                                                {item.imageUrl ? (
                                                    <Image src={item.imageUrl} alt={item.productName} width={64} height={64} className="object-cover rounded-lg" />
                                                ) : (
                                                    <Package className="text-gray-300" size={32} />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{item.productName}</div>
                                                <div className="text-sm text-gray-500">{item.sku}</div>
                                                <div className="text-primary font-bold mt-1">
                                                    {item.price.toLocaleString()} {currency}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center bg-white rounded-lg border">
                                                <button
                                                    onClick={() => handleQuantityChange(item.variantId, -1)}
                                                    className="p-2 hover:bg-gray-100 text-gray-600 disabled:opacity-50"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                                <button
                                                    onClick={() => handleQuantityChange(item.variantId, 1)}
                                                    className="p-2 hover:bg-gray-100 text-gray-600"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveItem(item.variantId)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Totals - SAME AS BEFORE */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold mb-4">{isRtl ? 'ملخص الحساب' : 'Summary'}</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>{isRtl ? 'المجموع' : 'Subtotal'}</span>
                                    <span>{subtotal.toLocaleString()} {currency}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>{isRtl ? 'الشحن' : 'Shipping'}</span>
                                    <span>{shippingCost > 0 ? `${shippingCost.toLocaleString()} ${currency}` : (isRtl ? 'مجاني' : 'Free')}</span>
                                </div>
                                {initialOrder.discountAmount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>{isRtl ? 'خصم' : 'Discount'}</span>
                                        <span>- {initialOrder.discountAmount.toLocaleString()} {currency}</span>
                                    </div>
                                )}
                                <div className="border-t pt-3 flex justify-between font-bold text-lg text-gray-900">
                                    <span>{isRtl ? 'الإجمالي' : 'Total'}</span>
                                    <span>{(total - initialOrder.discountAmount).toLocaleString()} {currency}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Info */}
                    <div className="space-y-6">
                        {/* Customer Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <User size={20} className="text-primary" />
                                {isRtl ? 'بيانات العميل' : 'Customer Info'}
                            </h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{isRtl ? 'الاسم الأول' : 'First Name'}</label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{isRtl ? 'الاسم الأخير' : 'Last Name'}</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{isRtl ? 'رقم الهاتف' : 'Phone Number'}</label>
                                    <input
                                        type="tel"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{isRtl ? 'رقم الهاتف الاحتياطي' : 'Alternative Phone'}</label>
                                    <input
                                        type="tel"
                                        value={alternativePhone}
                                        onChange={(e) => setAlternativePhone(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder={isRtl ? 'اختياري' : 'Optional'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{isRtl ? 'البريد الإلكتروني' : 'Email'}</label>
                                    <input
                                        type="email"
                                        value={customerEmail}
                                        onChange={(e) => setCustomerEmail(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Shipping Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <MapPin size={20} className="text-primary" />
                                {isRtl ? 'عنوان الشحن' : 'Shipping Address'}
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{isRtl ? 'المحافظة' : 'Governorate'}</label>
                                    <select
                                        value={governorate}
                                        onChange={(e) => {
                                            setGovernorate(e.target.value);
                                            setCity(''); // Reset City
                                        }}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                                    >
                                        <option value="">{isRtl ? 'اختر المحافظة...' : 'Select Governorate...'}</option>
                                        {EGYPT_LOCATIONS.map(gov => (
                                            <option key={gov.en} value={gov.en}>
                                                {isRtl ? gov.ar : gov.en}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{isRtl ? 'المدينة' : 'City'}</label>
                                    <select
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                                        disabled={!governorate}
                                    >
                                        <option value="">{isRtl ? 'اختر المدينة...' : 'Select City...'}</option>
                                        {displayedCities.map(c => (
                                            <option key={c.en} value={c.en}>
                                                {isRtl ? c.ar : c.en}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{isRtl ? 'العنوان بالتفصيل' : 'Detailed Address'}</label>
                                    <textarea
                                        value={street}
                                        onChange={(e) => setStreet(e.target.value)}
                                        rows={2}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{isRtl ? 'ملاحظات' : 'Notes'}</label>
                                    <textarea
                                        value={orderNotes}
                                        onChange={(e) => setOrderNotes(e.target.value)}
                                        rows={2}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder={isRtl ? 'ملاحظات إضافية...' : 'Additional notes...'}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
