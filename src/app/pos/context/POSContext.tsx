"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Types
export interface CartItem {
    id: string;
    productId: string;
    variantId?: string;
    name: string;
    sku: string;
    barcode?: string;
    imageUrl?: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    totalPrice: number;
}

export interface Customer {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    points?: number;
}

export interface Discount {
    type: 'percentage' | 'fixed';
    value: number;
}

export interface POSSession {
    id: string;
    sessionNo: string;
    cashierId: string;
    cashierName: string;
    terminalId: string;
    terminalName: string;
    startedAt: Date;
    openingBalance: number;
    status: 'OPEN' | 'PAUSED' | 'CLOSED';
}

interface POSContextType {
    // Session
    session: POSSession | null;
    setSession: (session: POSSession | null) => void;
    
    // Cart
    cart: CartItem[];
    addToCart: (item: Omit<CartItem, 'id' | 'totalPrice'>) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    removeFromCart: (itemId: string) => void;
    clearCart: () => void;
    
    // Customer
    customer: Customer | null;
    setCustomer: (customer: Customer | null) => void;
    
    // Discount - New simpler interface
    discount: Discount | null;
    setDiscount: (discount: Discount | null) => void;
    
    // Calculated totals
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
    itemCount: number;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export function POSProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<POSSession | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [discount, setDiscount] = useState<Discount | null>(null);
    
    // Add item to cart
    const addToCart = useCallback((item: Omit<CartItem, 'id' | 'totalPrice'>) => {
        setCart(currentCart => {
            // Check if item already exists (same product + variant)
            const existingIndex = currentCart.findIndex(
                i => i.productId === item.productId && i.variantId === item.variantId
            );
            
            if (existingIndex >= 0) {
                // Update quantity
                const updated = [...currentCart];
                const existing = updated[existingIndex];
                const newQty = existing.quantity + item.quantity;
                updated[existingIndex] = {
                    ...existing,
                    quantity: newQty,
                    totalPrice: (existing.unitPrice * newQty) - existing.discountAmount
                };
                return updated;
            }
            
            // Add new item
            const newItem: CartItem = {
                ...item,
                id: crypto.randomUUID(),
                totalPrice: (item.unitPrice * item.quantity) - item.discountAmount
            };
            return [...currentCart, newItem];
        });
    }, []);
    
    // Update item quantity
    const updateQuantity = useCallback((itemId: string, quantity: number) => {
        if (quantity <= 0) {
            setCart(currentCart => currentCart.filter(i => i.id !== itemId));
            return;
        }
        
        setCart(currentCart => currentCart.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    quantity,
                    totalPrice: (item.unitPrice * quantity) - item.discountAmount
                };
            }
            return item;
        }));
    }, []);
    
    // Remove item from cart
    const removeFromCart = useCallback((itemId: string) => {
        setCart(currentCart => currentCart.filter(i => i.id !== itemId));
    }, []);
    
    // Clear cart (but keep session)
    const clearCart = useCallback(() => {
        setCart([]);
    }, []);
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    
    const discountAmount = discount
        ? discount.type === 'percentage'
            ? (subtotal * discount.value / 100)
            : discount.value
        : 0;
    
    const taxAmount = 0; // Can be configured based on tax settings
    const total = Math.max(0, subtotal - discountAmount + taxAmount);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const value: POSContextType = {
        session,
        setSession,
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        customer,
        setCustomer,
        discount,
        setDiscount,
        subtotal,
        discountAmount,
        taxAmount,
        total,
        itemCount
    };
    
    return (
        <POSContext.Provider value={value}>
            {children}
        </POSContext.Provider>
    );
}

export function usePOS() {
    const context = useContext(POSContext);
    if (!context) {
        throw new Error('usePOS must be used within a POSProvider');
    }
    return context;
}
