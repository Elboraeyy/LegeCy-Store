"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { POSProvider, usePOS } from '../context/POSContext';
import '../pos.css';

// ==========================================
// Types
// ==========================================

interface Product {
    id: string;
    name: string;
    sku: string;
    barcode?: string;
    imageUrl?: string;
    price: number;
    stock: number;
    category?: string;
    variantId?: string;
}

interface Category {
    id: string;
    name: string;
    slug: string;
}

interface HeldOrder {
    id: string;
    name: string;
    items: CartItem[];
    customer: Customer | null;
    discount: { type: 'percentage' | 'fixed'; value: number } | null;
    createdAt: Date;
}

interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
}

interface CartItem {
    id: string;
    productId: string;
    variantId?: string;
    name: string;
    sku: string;
    imageUrl?: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    totalPrice: number;
}

interface Transaction {
    id: string;
    transactionNo: string;
    items: CartItem[];
    customer: Customer | null;
    subtotal: number;
    discount: number;
    total: number;
    received: number;
    change: number;
    method: string;
    date: Date;
}

// ==========================================
// Product Card
// ==========================================

function ProductCard({ product, onAdd, isRecent }: { product: Product; onAdd: (product: Product) => void; isRecent?: boolean }) {
    const [adding, setAdding] = useState(false);

    const handleClick = () => {
        if (product.stock <= 0) return;
        setAdding(true);
        onAdd(product);
        setTimeout(() => setAdding(false), 300);
    };

    return (
        <div 
            className={`pos-product-card ${adding ? 'adding' : ''} ${product.stock <= 0 ? 'out-of-stock' : ''}`}
            onClick={handleClick}
        >
            {isRecent && <span className="pos-product-recent">🔥</span>}
            <div className="pos-product-image relative h-full w-full">
                {product.imageUrl ? (
                    <Image src={product.imageUrl} alt={product.name} fill style={{ objectFit: 'cover' }} />
                ) : (
                    <span className="placeholder">📦</span>
                )}
            </div>
            <div className="pos-product-info">
                <div className="pos-product-name">{product.name}</div>
                <div className="pos-product-price-row">
                    <span className="pos-product-price">{product.price.toFixed(2)}</span>
                    <span className={`pos-product-stock ${product.stock <= 0 ? 'out' : product.stock <= 5 ? 'low' : ''}`}>
                        {product.stock <= 0 ? '✗' : product.stock <= 5 ? `${product.stock}` : '✓'}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// Cart Row
// ==========================================

function CartRow({ item, onUpdateQty, onRemove, isLast }: { 
    item: CartItem;
    onUpdateQty: (id: string, qty: number) => void;
    onRemove: (id: string) => void;
    isLast: boolean;
}) {
    return (
        <div className={`pos-smart-cart-row ${isLast ? 'last-added' : ''}`}>
            <div className="pos-cart-row-main">
                <span className="pos-cart-qty-badge">{item.quantity}x</span>
                <div className="pos-cart-row-info">
                    <span className="name">{item.name}</span>
                    <span className="price">{item.unitPrice.toFixed(2)} each</span>
                </div>
                <span className="pos-cart-row-total">{item.totalPrice.toFixed(2)}</span>
            </div>
            <div className="pos-cart-row-actions">
                <button onClick={() => onUpdateQty(item.id, item.quantity - 1)} className="minus">−</button>
                <button onClick={() => onUpdateQty(item.id, item.quantity + 1)} className="plus">+</button>
                <button onClick={() => onRemove(item.id)} className="remove">🗑</button>
            </div>
        </div>
    );
}

// ==========================================
// Customer Modal
// ==========================================

function CustomerModal({ 
    isOpen, 
    onClose, 
    onSelect 
}: { 
    isOpen: boolean; 
    onClose: () => void;
    onSelect: (customer: Customer | null) => void;
}) {
    const [search, setSearch] = useState('');
    const [customers] = useState<Customer[]>([
        { id: 'c1', name: 'Mohamed Ahmed', email: 'mohamed@email.com', phone: '0123456789' },
        { id: 'c2', name: 'Sara Ali', email: 'sara@email.com', phone: '0111222333' },
        { id: 'c3', name: 'Ahmed Hassan', email: 'ahmed@email.com', phone: '0100111222' },
    ]);
    const [showNew, setShowNew] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });

    const filtered = customers.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
    );

    const handleAddNew = () => {
        if (!newCustomer.name.trim()) return;
        const customer: Customer = {
            id: `new-${Date.now()}`,
            name: newCustomer.name,
            phone: newCustomer.phone,
            email: newCustomer.email
        };
        onSelect(customer);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="pos-modal-overlay" onClick={onClose}>
            <div className="pos-modal pos-customer-modal" onClick={e => e.stopPropagation()}>
                <div className="pos-modal-header">
                    <h3>👤 {showNew ? 'Add New Customer' : 'Select Customer'}</h3>
                    <button className="pos-modal-close" onClick={onClose}>✕</button>
                </div>
                
                {!showNew ? (
                    <>
                        <div className="pos-modal-search">
                            <input
                                type="text"
                                placeholder="Search by name, phone, or email..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="pos-customer-list">
                            <div className="pos-customer-item walk-in" onClick={() => { onSelect(null); onClose(); }}>
                                <span className="icon">🚶</span>
                                <span className="name">Walk-in Customer</span>
                            </div>
                            {filtered.map(c => (
                                <div key={c.id} className="pos-customer-item" onClick={() => { onSelect(c); onClose(); }}>
                                    <span className="icon">👤</span>
                                    <div className="info">
                                        <span className="name">{c.name}</span>
                                        <span className="details">{c.phone} • {c.email}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pos-modal-footer">
                            <button className="pos-add-customer-btn" onClick={() => setShowNew(true)}>
                                + Add New Customer
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="pos-new-customer-form">
                        <div className="pos-form-group">
                            <label>Name *</label>
                            <input
                                type="text"
                                value={newCustomer.name}
                                onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                placeholder="Customer name"
                                autoFocus
                            />
                        </div>
                        <div className="pos-form-group">
                            <label>Phone</label>
                            <input
                                type="tel"
                                value={newCustomer.phone}
                                onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                placeholder="Phone number"
                            />
                        </div>
                        <div className="pos-form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={newCustomer.email}
                                onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                placeholder="Email address"
                            />
                        </div>
                        <div className="pos-modal-footer">
                            <button className="pos-btn-secondary" onClick={() => setShowNew(false)}>Back</button>
                            <button className="pos-btn-primary" onClick={handleAddNew} disabled={!newCustomer.name.trim()}>
                                Add & Select
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ==========================================
// Discount Modal
// ==========================================

function DiscountModal({ 
    isOpen, 
    onClose, 
    subtotal,
    onApply 
}: { 
    isOpen: boolean; 
    onClose: () => void;
    subtotal: number;
    onApply: (type: 'percentage' | 'fixed', value: number, reason: string) => void;
}) {
    const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
    const [value, setValue] = useState('');
    const [reason, setReason] = useState('');

    const numValue = parseFloat(value) || 0;
    const discountAmount = type === 'percentage' ? (subtotal * numValue / 100) : numValue;
    const isValid = numValue > 0 && discountAmount <= subtotal;

    const quickDiscounts = [5, 10, 15, 20, 25, 50];

    if (!isOpen) return null;

    return (
        <div className="pos-modal-overlay" onClick={onClose}>
            <div className="pos-modal pos-discount-modal" onClick={e => e.stopPropagation()}>
                <div className="pos-modal-header">
                    <h3>🏷️ Apply Discount</h3>
                    <button className="pos-modal-close" onClick={onClose}>✕</button>
                </div>
                
                <div className="pos-modal-body">
                    <div className="pos-discount-type-toggle">
                        <button 
                            className={type === 'percentage' ? 'active' : ''}
                            onClick={() => setType('percentage')}
                        >
                            % Percentage
                        </button>
                        <button 
                            className={type === 'fixed' ? 'active' : ''}
                            onClick={() => setType('fixed')}
                        >
                            EGP Fixed
                        </button>
                    </div>

                    {type === 'percentage' && (
                        <div className="pos-quick-discounts">
                            {quickDiscounts.map(d => (
                                <button 
                                    key={d} 
                                    className={numValue === d ? 'active' : ''}
                                    onClick={() => setValue(d.toString())}
                                >
                                    {d}%
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="pos-form-group">
                        <label>Discount Value</label>
                        <div className="pos-input-with-suffix">
                            <input
                                type="number"
                                value={value}
                                onChange={e => setValue(e.target.value)}
                                placeholder="0"
                                autoFocus
                            />
                            <span className="suffix">{type === 'percentage' ? '%' : 'EGP'}</span>
                        </div>
                    </div>

                    {numValue > 0 && (
                        <div className="pos-discount-preview">
                            <span>Discount Amount:</span>
                            <span className="amount">-{discountAmount.toFixed(2)} EGP</span>
                        </div>
                    )}

                    <div className="pos-form-group">
                        <label>Reason (optional)</label>
                        <input
                            type="text"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="e.g., Loyalty discount"
                        />
                    </div>
                </div>

                <div className="pos-modal-footer">
                    <button className="pos-btn-secondary" onClick={onClose}>Cancel</button>
                    <button 
                        className="pos-btn-primary" 
                        onClick={() => { onApply(type, numValue, reason); onClose(); }}
                        disabled={!isValid}
                    >
                        Apply Discount
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// Held Orders Modal
// ==========================================

function HeldOrdersModal({ 
    isOpen, 
    onClose, 
    orders,
    onRecall,
    onDelete
}: { 
    isOpen: boolean; 
    onClose: () => void;
    orders: HeldOrder[];
    onRecall: (order: HeldOrder) => void;
    onDelete: (id: string) => void;
}) {
    if (!isOpen) return null;

    return (
        <div className="pos-modal-overlay" onClick={onClose}>
            <div className="pos-modal pos-held-modal" onClick={e => e.stopPropagation()}>
                <div className="pos-modal-header">
                    <h3>⏸️ Held Orders ({orders.length})</h3>
                    <button className="pos-modal-close" onClick={onClose}>✕</button>
                </div>
                
                <div className="pos-held-list">
                    {orders.length === 0 ? (
                        <div className="pos-empty-state">
                            <span>📋</span>
                            <p>No held orders</p>
                        </div>
                    ) : (
                        orders.map(order => (
                            <div key={order.id} className="pos-held-item">
                                <div className="pos-held-info">
                                    <span className="name">{order.name}</span>
                                    <span className="meta">
                                        {order.items.length} items • 
                                        {order.items.reduce((sum, i) => sum + i.totalPrice, 0).toFixed(2)} EGP
                                    </span>
                                    <span className="time">
                                        {new Date(order.createdAt).toLocaleTimeString()}
                                    </span>
                                </div>
                                <div className="pos-held-actions">
                                    <button className="recall" onClick={() => { onRecall(order); onClose(); }}>
                                        ↩️ Recall
                                    </button>
                                    <button className="delete" onClick={() => onDelete(order.id)}>
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// ==========================================
// Payment Modal
// ==========================================

function PaymentModal({ 
    isOpen, 
    onClose, 
    total, 
    onComplete 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    total: number;
    onComplete: (method: string, received: number) => void;
}) {
    const [method, setMethod] = useState<'CASH' | 'CARD' | 'MOBILE'>('CASH');
    const [received, setReceived] = useState('');
    const [processing, setProcessing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const receivedAmount = parseFloat(received) || 0;
    const changeDue = receivedAmount - total;

    useEffect(() => {
        if (isOpen && method === 'CASH') {
            inputRef.current?.focus();
        }
    }, [isOpen, method]);

    const quickAmounts = [
        total,
        Math.ceil(total / 10) * 10,
        Math.ceil(total / 50) * 50,
        Math.ceil(total / 100) * 100,
        500,
        1000
    ].filter((v, i, a) => a.indexOf(v) === i && v >= total).slice(0, 6);

    const handleComplete = useCallback(async () => {
        if (method === 'CASH' && receivedAmount < total) return;
        setProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 400));
        onComplete(method, method === 'CASH' ? receivedAmount : total);
        setProcessing(false);
        setReceived('');
    }, [method, receivedAmount, total, onComplete]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && (method !== 'CASH' || receivedAmount >= total)) {
                handleComplete();
            }
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, method, receivedAmount, total, onClose, handleComplete]);

    if (!isOpen) return null;

    return (
        <div className="pos-modal-overlay" onClick={onClose}>
            <div className="pos-smart-payment-modal" onClick={e => e.stopPropagation()}>
                <div className="pos-payment-total-big">
                    <span className="label">Total Due</span>
                    <span className="amount">{total.toFixed(2)} EGP</span>
                </div>

                <div className="pos-payment-method-buttons">
                    {[
                        { key: 'CASH', icon: '💵', label: 'Cash' },
                        { key: 'CARD', icon: '💳', label: 'Card' },
                        { key: 'MOBILE', icon: '📱', label: 'Mobile' }
                    ].map(m => (
                        <button 
                            key={m.key}
                            className={`pos-method-btn ${method === m.key ? 'active' : ''}`}
                            onClick={() => setMethod(m.key as typeof method)}
                        >
                            <span className="icon">{m.icon}</span>
                            <span className="label">{m.label}</span>
                        </button>
                    ))}
                </div>

                {method === 'CASH' && (
                    <div className="pos-cash-section">
                        <div className="pos-quick-amounts">
                            {quickAmounts.map(amt => (
                                <button
                                    key={amt}
                                    className={`pos-quick-amount ${amt === total ? 'exact' : ''}`}
                                    onClick={() => setReceived(amt.toString())}
                                >
                                    {amt === total ? '✓ Exact' : amt}
                                </button>
                            ))}
                        </div>

                        <div className="pos-received-input">
                            <label>Amount Received</label>
                            <input
                                ref={inputRef}
                                type="number"
                                value={received}
                                onChange={(e) => setReceived(e.target.value)}
                                placeholder={total.toFixed(2)}
                                className={receivedAmount >= total ? 'valid' : ''}
                            />
                        </div>

                        {receivedAmount >= total && (
                            <div className="pos-change-big">
                                <span className="label">Change</span>
                                <span className="amount">{changeDue.toFixed(2)} EGP</span>
                            </div>
                        )}
                    </div>
                )}

                {method !== 'CASH' && (
                    <div className="pos-card-section">
                        <div className="pos-card-ready">
                            <span className="icon">{method === 'CARD' ? '💳' : '📱'}</span>
                            <span className="text">Ready for {method === 'CARD' ? 'card' : 'mobile'} payment</span>
                            <span className="hint">Press Enter to complete</span>
                        </div>
                    </div>
                )}

                <div className="pos-payment-actions-row">
                    <button className="pos-cancel-btn" onClick={onClose}>Cancel</button>
                    <button 
                        className="pos-complete-btn"
                        onClick={handleComplete}
                        disabled={processing || (method === 'CASH' && receivedAmount < total)}
                    >
                        {processing ? '⏳ Processing...' : '✓ Complete Sale'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// Success Modal with Receipt
// ==========================================

function SuccessModal({
    isOpen,
    transaction,
    onNewSale,
    onPrint
}: {
    isOpen: boolean;
    transaction: Transaction | null;
    onNewSale: () => void;
    onPrint: () => void;
}) {
    const btnRef = useRef<HTMLButtonElement>(null);
    
    useEffect(() => {
        if (isOpen) btnRef.current?.focus();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Enter') onNewSale();
            if (e.key === 'p' || e.key === 'P') onPrint();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onNewSale, onPrint]);

    if (!isOpen || !transaction) return null;

    return (
        <div className="pos-modal-overlay">
            <div className="pos-success-modal">
                <div className="pos-success-icon">✅</div>
                <div className="pos-success-title">Sale Complete!</div>
                <div className="pos-success-txn">#{transaction.transactionNo.split('-').pop()}</div>
                <div className="pos-success-amount">{transaction.total.toFixed(2)} EGP</div>
                {transaction.change > 0 && (
                    <div className="pos-success-change">
                        Change: <strong>{transaction.change.toFixed(2)} EGP</strong>
                    </div>
                )}
                <div className="pos-success-method">
                    Paid by {transaction.method === 'CASH' ? '💵 Cash' : transaction.method === 'CARD' ? '💳 Card' : '📱 Mobile'}
                </div>
                <div className="pos-success-actions">
                    <button ref={btnRef} className="pos-new-sale-btn" onClick={onNewSale}>
                        🛒 New Sale
                    </button>
                    <button className="pos-print-btn" onClick={onPrint}>
                        🖨️ Print
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// Reports Panel
// ==========================================

function ReportsPanel({ 
    transactions, 
    salesCount, 
    salesToday 
}: { 
    transactions: Transaction[];
    salesCount: number;
    salesToday: number;
}) {
    const cashTotal = transactions.filter(t => t.method === 'CASH').reduce((sum, t) => sum + t.total, 0);
    const cardTotal = transactions.filter(t => t.method === 'CARD').reduce((sum, t) => sum + t.total, 0);
    const mobileTotal = transactions.filter(t => t.method === 'MOBILE').reduce((sum, t) => sum + t.total, 0);
    const avgTransaction = salesCount > 0 ? salesToday / salesCount : 0;

    return (
        <div className="pos-reports-panel">
            <h2>📊 Session Report</h2>
            
            <div className="pos-report-stats">
                <div className="stat-card">
                    <span className="value">{salesCount}</span>
                    <span className="label">Transactions</span>
                </div>
                <div className="stat-card highlight">
                    <span className="value">{salesToday.toFixed(2)}</span>
                    <span className="label">Total Revenue (EGP)</span>
                </div>
                <div className="stat-card">
                    <span className="value">{avgTransaction.toFixed(2)}</span>
                    <span className="label">Avg. Transaction (EGP)</span>
                </div>
            </div>

            <div className="pos-report-breakdown">
                <h3>Payment Breakdown</h3>
                <div className="breakdown-row">
                    <span>💵 Cash</span>
                    <span>{cashTotal.toFixed(2)} EGP</span>
                </div>
                <div className="breakdown-row">
                    <span>💳 Card</span>
                    <span>{cardTotal.toFixed(2)} EGP</span>
                </div>
                <div className="breakdown-row">
                    <span>📱 Mobile</span>
                    <span>{mobileTotal.toFixed(2)} EGP</span>
                </div>
            </div>

            <div className="pos-report-transactions">
                <h3>Recent Transactions</h3>
                {transactions.length === 0 ? (
                    <p className="empty">No transactions yet</p>
                ) : (
                    <div className="transaction-list">
                        {transactions.slice(0, 10).map(t => (
                            <div key={t.id} className="transaction-row">
                                <span className="txn-no">#{t.transactionNo.split('-').pop()}</span>
                                <span className="txn-items">{t.items.length} items</span>
                                <span className="txn-total">{t.total.toFixed(2)}</span>
                                <span className="txn-time">{new Date(t.date).toLocaleTimeString()}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ==========================================
// Returns Panel
// ==========================================

function ReturnsPanel({ transactions, onReturn }: { transactions: Transaction[]; onReturn: (txn: Transaction) => void }) {
    const [search, setSearch] = useState('');
    
    const filtered = transactions.filter(t => 
        t.transactionNo.toLowerCase().includes(search.toLowerCase()) ||
        t.customer?.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="pos-returns-panel">
            <h2>↩️ Returns & Exchanges</h2>
            
            <div className="pos-search-box">
                <input
                    type="text"
                    placeholder="Search by transaction # or customer..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {filtered.length === 0 ? (
                <div className="pos-empty-state">
                    <span>📋</span>
                    <p>No transactions found</p>
                </div>
            ) : (
                <div className="pos-transaction-list">
                    {filtered.map(t => (
                        <div key={t.id} className="pos-transaction-card">
                            <div className="txn-header">
                                <span className="txn-no">#{t.transactionNo}</span>
                                <span className="txn-date">{new Date(t.date).toLocaleString()}</span>
                            </div>
                            <div className="txn-items">
                                {t.items.map((item, i) => (
                                    <div key={i} className="txn-item">
                                        <span>{item.quantity}x {item.name}</span>
                                        <span>{item.totalPrice.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="txn-footer">
                                <span className="txn-total">Total: {t.total.toFixed(2)} EGP</span>
                                <button className="return-btn" onClick={() => onReturn(t)}>
                                    Process Return
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ==========================================
// Sidebar Navigation
// ==========================================

function NavItem({ icon, label, active, onClick, badge }: { 
    icon: string; label: string; active?: boolean; onClick?: () => void; badge?: number;
}) {
    return (
        <button className={`pos-nav-item ${active ? 'active' : ''}`} onClick={onClick}>
            <span className="pos-nav-icon">{icon}</span>
            <span className="pos-nav-label">{label}</span>
            {badge !== undefined && badge > 0 && <span className="pos-nav-badge">{badge}</span>}
        </button>
    );
}

// ==========================================
// Main Terminal Content
// ==========================================

function TerminalContent() {
    const router = useRouter();
    const { 
        session, setSession,
        cart, addToCart, updateQuantity, removeFromCart, clearCart,
        customer, setCustomer,
        discount, setDiscount,
        subtotal, discountAmount, total, itemCount
    } = usePOS();

    // View state
    const [activeView, setActiveView] = useState<'sale' | 'held' | 'returns' | 'reports'>('sale');
    
    // Product state
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [recentProducts, setRecentProducts] = useState<string[]>([]);

    // Modal state
    const [showPayment, setShowPayment] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showCustomer, setShowCustomer] = useState(false);
    const [showDiscount, setShowDiscount] = useState(false);
    const [showHeld, setShowHeld] = useState(false);

    // Transaction state
    const [salesCount, setSalesCount] = useState(0);
    const [salesToday, setSalesToday] = useState(0);
    const [lastAddedId, setLastAddedId] = useState<string | null>(null);
    const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);

    const searchInputRef = useRef<HTMLInputElement>(null);

    // Load session
    useEffect(() => {
        const saved = localStorage.getItem('pos_session');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSession({ ...parsed, startedAt: new Date(parsed.startedAt) });
            } catch {
                router.push('/pos');
            }
        } else {
            router.push('/pos');
        }

        // Load held orders
        const heldSaved = localStorage.getItem('pos_held_orders');
        if (heldSaved) {
            try {
                setHeldOrders(JSON.parse(heldSaved));
            } catch { /* ignore */ }
        }

        // Load transactions
        const txnSaved = localStorage.getItem('pos_transactions');
        if (txnSaved) {
            try {
                const txns = JSON.parse(txnSaved);
                setTransactions(txns);
                setSalesCount(txns.length);
                setSalesToday(txns.reduce((sum: number, t: Transaction) => sum + t.total, 0));
            } catch { /* ignore */ }
        }
    }, [setSession, router]);

    // Fetch products
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const prodRes = await fetch('/api/pos/products');
                if (prodRes.ok) {
                    const data = await prodRes.json();
                    if (data.products?.length > 0) setProducts(data.products);
                }
                const catRes = await fetch('/api/categories');
                if (catRes.ok) {
                    const data = await catRes.json();
                    if (data.categories?.length > 0) setCategories(data.categories);
                }
            } catch {
                // Demo data
                setProducts([
                    { id: '1', name: 'Classic Watch', sku: 'WCH-001', price: 1500, stock: 10, category: 'Watches', barcode: '1234567890' },
                    { id: '2', name: 'Leather Wallet', sku: 'WLT-001', price: 450, stock: 25, category: 'Accessories', barcode: '2345678901' },
                    { id: '3', name: 'Silver Ring', sku: 'RNG-001', price: 300, stock: 15, category: 'Jewelry', barcode: '3456789012' },
                    { id: '4', name: 'Gold Necklace', sku: 'NCK-001', price: 2500, stock: 5, category: 'Jewelry', barcode: '4567890123' },
                    { id: '5', name: 'Belt Classic', sku: 'BLT-001', price: 350, stock: 20, category: 'Accessories', barcode: '5678901234' },
                    { id: '6', name: 'Cufflinks Set', sku: 'CFL-001', price: 200, stock: 30, category: 'Accessories', barcode: '6789012345' },
                    { id: '7', name: 'Diamond Earrings', sku: 'EAR-001', price: 5000, stock: 3, category: 'Jewelry', barcode: '7890123456' },
                    { id: '8', name: 'Smart Watch Pro', sku: 'WCH-002', price: 3500, stock: 8, category: 'Watches', barcode: '8901234567' },
                ]);
                setCategories([
                    { id: '1', name: 'Watches', slug: 'watches' },
                    { id: '2', name: 'Jewelry', slug: 'jewelry' },
                    { id: '3', name: 'Accessories', slug: 'accessories' }
                ]);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);


    // Barcode scanning simulation
    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchQuery.length > 5) {
            const product = products.find(p => p.barcode === searchQuery || p.sku.toLowerCase() === searchQuery.toLowerCase());
            if (product && product.stock > 0) {
                handleAddProduct(product);
                setSearchQuery('');
            }
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        const matchesSearch = searchQuery === '' || 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.barcode?.includes(searchQuery);
        return matchesCategory && matchesSearch;
    });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        const aRecent = recentProducts.indexOf(a.id);
        const bRecent = recentProducts.indexOf(b.id);
        if (aRecent >= 0 && bRecent < 0) return -1;
        if (bRecent >= 0 && aRecent < 0) return 1;
        return 0;
    });

    const handleAddProduct = useCallback((product: Product) => {
        addToCart({
            productId: product.id,
            variantId: product.variantId,
            name: product.name,
            sku: product.sku,
            imageUrl: product.imageUrl,
            quantity: 1,
            unitPrice: product.price,
            discountAmount: 0
        });
        setLastAddedId(product.id);
        setRecentProducts(prev => [product.id, ...prev.filter(id => id !== product.id)].slice(0, 5));
        setTimeout(() => setLastAddedId(null), 500);
    }, [addToCart]);

    const holdCurrentOrder = useCallback(() => {
        if (cart.length === 0) return;
        const orderName = customer?.name || `Order #${heldOrders.length + 1}`;
        const newOrder: HeldOrder = {
            id: `held-${Date.now()}`,
            name: orderName,
            items: [...cart],
            customer,
            discount,
            createdAt: new Date()
        };
        const updated = [...heldOrders, newOrder];
        setHeldOrders(updated);
        localStorage.setItem('pos_held_orders', JSON.stringify(updated));
        clearCart();
        setCustomer(null);
        setDiscount(null);
    }, [cart, customer, discount, heldOrders, clearCart, setCustomer, setDiscount]);

    const recallOrder = useCallback((order: HeldOrder) => {
        // If cart has items, hold them first
        if (cart.length > 0) {
            holdCurrentOrder();
        }
        // Restore held order
        order.items.forEach(item => {
            addToCart({
                productId: item.productId,
                variantId: item.variantId,
                name: item.name,
                sku: item.sku,
                imageUrl: item.imageUrl,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discountAmount: item.discountAmount
            });
        });
        if (order.customer) setCustomer(order.customer);
        if (order.discount) setDiscount(order.discount);
        // Remove from held
        const updated = heldOrders.filter(o => o.id !== order.id);
        setHeldOrders(updated);
        localStorage.setItem('pos_held_orders', JSON.stringify(updated));
    }, [cart, heldOrders, addToCart, setCustomer, setDiscount, holdCurrentOrder]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' && target.className !== 'pos-smart-search') return;

            if (e.key === 'F3' || e.key === '/') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            if (e.key === 'F10' && cart.length > 0) {
                e.preventDefault();
                setShowPayment(true);
            }
            if (e.key === 'F8') {
                e.preventDefault();
                if (cart.length > 0) holdCurrentOrder();
            }
            if (e.key === 'Escape') {
                setShowPayment(false);
                setShowSuccess(false);
                setShowCustomer(false);
                setShowDiscount(false);
                setShowHeld(false);
                setSearchQuery('');
            }
            if (e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.altKey) {
                const catIndex = parseInt(e.key) - 1;
                if (catIndex === 0) setSelectedCategory('all');
                else if (categories[catIndex - 1]) setSelectedCategory(categories[catIndex - 1].name);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart.length, categories, holdCurrentOrder]);

    const deleteHeldOrder = (id: string) => {
        const updated = heldOrders.filter(o => o.id !== id);
        setHeldOrders(updated);
        localStorage.setItem('pos_held_orders', JSON.stringify(updated));
    };

    const handlePaymentComplete = useCallback((method: string, received: number) => {
        const txn: Transaction = {
            id: `txn-${Date.now()}`,
            transactionNo: `TXN-${Date.now()}`,
            items: [...cart],
            customer,
            subtotal,
            discount: discountAmount,
            total,
            received,
            change: Math.max(0, received - total),
            method,
            date: new Date()
        };
        
        const updatedTxns = [txn, ...transactions];
        setTransactions(updatedTxns);
        localStorage.setItem('pos_transactions', JSON.stringify(updatedTxns));
        
        setLastTransaction(txn);
        setShowPayment(false);
        setShowSuccess(true);
        setSalesCount(prev => prev + 1);
        setSalesToday(prev => prev + total);
        clearCart();
        setCustomer(null);
        setDiscount(null);
    }, [cart, customer, subtotal, discountAmount, total, transactions, clearCart, setCustomer, setDiscount]);

    const handleNewSale = () => {
        setShowSuccess(false);
        setActiveView('sale');
        setTimeout(() => searchInputRef.current?.focus(), 100);
    };

    const handleApplyDiscount = (type: 'percentage' | 'fixed', value: number) => {
        setDiscount({ type, value });
    };

    const handleReturn = (txn: Transaction) => {
        // Simple return: add items back as negative sale
        alert(`Return processed for Transaction #${txn.transactionNo}\nRefund amount: ${txn.total.toFixed(2)} EGP`);
    };

    const handleEndSession = () => {
        if (cart.length > 0) {
            if (!confirm('You have items in cart. End session anyway?')) return;
        }
        if (confirm('End this session?')) {
            localStorage.removeItem('pos_session');
            router.push('/pos');
        }
    };

    const getSessionDuration = () => {
        if (!session) return '';
        const diff = Date.now() - new Date(session.startedAt).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!session) {
        return (
            <div className="pos-terminal-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div className="pos-spinner" />
            </div>
        );
    }

    return (
        <div className="pos-terminal-shell">
            {/* Sidebar */}
            <aside className="pos-smart-sidebar">
                <div className="pos-sidebar-brand">
                    <span className="logo">L</span>
                    <span className="text">LEGACY</span>
                </div>

                <div className="pos-sidebar-profile">
                    <div className="avatar">{session.cashierName?.charAt(0) || 'C'}</div>
                    <div className="info">
                        <span className="name">{session.cashierName}</span>
                        <span className="session">{getSessionDuration()}</span>
                    </div>
                </div>

                <nav className="pos-sidebar-nav">
                    <NavItem icon="🛒" label="New Sale" active={activeView === 'sale'} onClick={() => setActiveView('sale')} badge={itemCount} />
                    <NavItem icon="⏸️" label="Held Orders" active={activeView === 'held'} onClick={() => setShowHeld(true)} badge={heldOrders.length} />
                    <NavItem icon="↩️" label="Returns" active={activeView === 'returns'} onClick={() => setActiveView('returns')} />
                    <NavItem icon="📊" label="Reports" active={activeView === 'reports'} onClick={() => setActiveView('reports')} />
                </nav>

                <div className="pos-sidebar-footer">
                    <div className="terminal-info">
                        <span className="dot"></span>
                        {session.terminalName}
                    </div>
                    <button className="end-btn" onClick={handleEndSession}>
                        ⏻ End Session
                    </button>
                </div>
            </aside>

            {/* Main Area */}
            <main className="pos-smart-main">
                {activeView === 'sale' && (
                    <>
                        <header className="pos-smart-header">
                            <div className="pos-search-wrapper">
                                <span className="icon">🔍</span>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search products or scan barcode... (F3)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    className="pos-smart-search"
                                />
                                {searchQuery && (
                                    <button className="clear" onClick={() => setSearchQuery('')}>✕</button>
                                )}
                            </div>
                            <div className="pos-header-clock">
                                <span className="time">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="date">{currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                        </header>

                        <div className="pos-stats-mini">
                            <div className="stat">
                                <span className="value">{salesCount}</span>
                                <span className="label">Sales</span>
                            </div>
                            <div className="stat">
                                <span className="value">{salesToday.toFixed(0)}</span>
                                <span className="label">Revenue</span>
                            </div>
                        </div>

                        <div className="pos-category-row">
                            <button 
                                className={`pos-cat-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                                onClick={() => setSelectedCategory('all')}
                            >
                                All <span className="shortcut">1</span>
                            </button>
                            {categories.map((cat, idx) => (
                                <button
                                    key={cat.id}
                                    className={`pos-cat-btn ${selectedCategory === cat.name ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(cat.name)}
                                >
                                    {cat.name} <span className="shortcut">{idx + 2}</span>
                                </button>
                            ))}
                        </div>

                        <div className="pos-products-area">
                            {loading ? (
                                <div className="pos-loading"><div className="pos-spinner" /></div>
                            ) : sortedProducts.length === 0 ? (
                                <div className="pos-no-products">
                                    <span>📦</span>
                                    <p>No products found</p>
                                </div>
                            ) : (
                                <div className="pos-smart-products-grid">
                                    {sortedProducts.map(product => (
                                        <ProductCard 
                                            key={product.id} 
                                            product={product} 
                                            onAdd={handleAddProduct}
                                            isRecent={recentProducts.includes(product.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeView === 'returns' && (
                    <ReturnsPanel transactions={transactions} onReturn={handleReturn} />
                )}

                {activeView === 'reports' && (
                    <ReportsPanel transactions={transactions} salesCount={salesCount} salesToday={salesToday} />
                )}
            </main>

            {/* Cart Sidebar */}
            {activeView === 'sale' && (
                <aside className="pos-smart-cart">
                    <div className="pos-cart-header">
                        <h3>🛒 Cart</h3>
                        {cart.length > 0 && (
                            <button className="clear-btn" onClick={() => confirm('Clear cart?') && clearCart()}>Clear</button>
                        )}
                    </div>

                    {/* Customer */}
                    <div className="pos-cart-customer-row" onClick={() => setShowCustomer(true)}>
                        <span className="icon">👤</span>
                        <span className="name">{customer ? customer.name : 'Walk-in Customer'}</span>
                        <span className="action">{customer ? 'Change' : '+ Add'}</span>
                    </div>

                    {cart.length === 0 ? (
                        <div className="pos-cart-empty">
                            <span>🛒</span>
                            <p>Add products</p>
                            <small>Click items or scan barcode</small>
                        </div>
                    ) : (
                        <div className="pos-cart-items">
                            {cart.map((item) => (
                                <CartRow
                                    key={item.id}
                                    item={item}
                                    onUpdateQty={updateQuantity}
                                    onRemove={removeFromCart}
                                    isLast={item.productId === lastAddedId}
                                />
                            ))}
                        </div>
                    )}

                    {/* Summary & Actions */}
                    <div className="pos-cart-footer">
                        {cart.length > 0 && (
                            <>
                                <div className="pos-cart-summary-row">
                                    <span>Subtotal</span>
                                    <span>{subtotal.toFixed(2)}</span>
                                </div>
                                {discount && (
                                    <div className="pos-cart-summary-row discount" onClick={() => setShowDiscount(true)}>
                                        <span>Discount ({discount.type === 'percentage' ? `${discount.value}%` : 'Fixed'})</span>
                                        <span>-{discountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="pos-cart-total-row">
                                    <span className="items">{itemCount} items</span>
                                    <span className="total">{total.toFixed(2)} EGP</span>
                                </div>
                            </>
                        )}

                        <div className="pos-cart-action-buttons">
                            <button 
                                className="pos-action-btn hold"
                                disabled={cart.length === 0}
                                onClick={holdCurrentOrder}
                            >
                                ⏸️ Hold (F8)
                            </button>
                            <button 
                                className="pos-action-btn discount"
                                disabled={cart.length === 0}
                                onClick={() => setShowDiscount(true)}
                            >
                                🏷️ Discount
                            </button>
                        </div>

                        <button 
                            className="pos-pay-now-btn"
                            disabled={cart.length === 0}
                            onClick={() => setShowPayment(true)}
                        >
                            <span className="icon">💳</span>
                            <span className="text">{cart.length > 0 ? `Pay ${total.toFixed(2)} EGP` : 'Add items'}</span>
                            <span className="shortcut">F10</span>
                        </button>
                    </div>
                </aside>
            )}

            {/* Modals */}
            <PaymentModal
                isOpen={showPayment}
                onClose={() => setShowPayment(false)}
                total={total}
                onComplete={handlePaymentComplete}
            />

            <SuccessModal
                isOpen={showSuccess}
                transaction={lastTransaction}
                onNewSale={handleNewSale}
                onPrint={() => { window.print(); handleNewSale(); }}
            />

            <CustomerModal
                isOpen={showCustomer}
                onClose={() => setShowCustomer(false)}
                onSelect={setCustomer}
            />

            <DiscountModal
                isOpen={showDiscount}
                onClose={() => setShowDiscount(false)}
                subtotal={subtotal}
                onApply={handleApplyDiscount}
            />

            <HeldOrdersModal
                isOpen={showHeld}
                onClose={() => setShowHeld(false)}
                orders={heldOrders}
                onRecall={recallOrder}
                onDelete={deleteHeldOrder}
            />
        </div>
    );
}

export default function POSTerminalPage() {
    return (
        <POSProvider>
            <TerminalContent />
        </POSProvider>
    );
}
