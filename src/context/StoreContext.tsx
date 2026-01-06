"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { fetchShopProducts } from "@/lib/actions/shop";
import { 
    getCartAction, 
    mergeGuestCartAction, 
    addToCartAction, 
    removeFromCartAction, 
    updateQtyAction, 
    clearCartAction as clearDbCartAction,
    CartItemDTO
} from '@/lib/actions/cart';
import { toast } from 'sonner';

// Unified Product type for cart compatibility
export interface Product {
  id: string; // Enforce String/UUID for consistency
  name: string;
  price: number;
  cat?: string;
  img?: string;
  imageUrl?: string | null;
  brand?: string | null;
  strap?: string;
  description?: string | null;
  variants?: { id: string; sku: string; price: number; stock: number }[];
  defaultVariantId?: string | null; // For cart operations
}

// Cart Item extends DTO logic - Add 'img' for legacy UI compatibility
type CartItem = CartItemDTO & { img?: string };

type ProductId = string; 

interface StoreContextType {
  cart: CartItem[];
  fav: ProductId[];
  addToCart: (id: ProductId, variantId?: string) => void;
  removeFromCart: (id: ProductId, variantId?: string) => void;
  decFromCart: (id: ProductId, variantId?: string) => void;
  toggleFav: (id: ProductId) => void;
  isFav: (id: ProductId) => boolean;
  clearCart: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  products: Product[];
  showToast: (msg: string, type?: "success" | "danger") => void;
  isLoading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [fav, setFav] = useState<ProductId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const hasInitialized = useRef(false);

  // Initial Load: Products & Session Logic
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    let mounted = true;

    const init = async () => {
        try {
            // 1. ALWAYS restore from localStorage first (for instant UX)
            const localStr = localStorage.getItem("cart");
            const localItems: CartItem[] = localStr ? JSON.parse(localStr) : [];
            console.log("[Cart] LocalStorage items on load:", localItems.length);
            
            // Keep reference to local items
            let currentCart = localItems;
            if (localItems.length > 0 && mounted) {
                setCart(localItems);
            }

            // 2. Fetch Products for Shop
            const dbProducts = await fetchShopProducts();
            const mapped: Product[] = dbProducts.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                cat: p.category || undefined,
                img: p.imageUrl || undefined,
                imageUrl: p.imageUrl,
                brand: p.brand,
                description: null,
                variants: [],
                defaultVariantId: p.defaultVariantId
            }));
            
            if (mounted) setProducts(mapped);
            
            // 3. Try to get DB cart (only works if logged in)
            try {
                const rawDbItems = await getCartAction();
                console.log("[Cart] DB items:", rawDbItems.length);
                
                // If we got DB items, user is logged in
                if (rawDbItems.length > 0) {
                    const dbItems: CartItem[] = rawDbItems.map(i => ({
                        ...i,
                        img: i.imageUrl || undefined
                    }));
                    
                    setIsLoggedIn(true);
                    
                    // Merge local items into DB if any exist
                    if (localItems.length > 0) {
                        console.log("[Cart] Merging local items into DB...");
                        await mergeGuestCartAction(localItems.map(i => ({
                            id: i.id, 
                            variantId: i.variantId, 
                            qty: i.qty 
                        })));
                        localStorage.removeItem("cart");
                        
                        // Refetch merged cart
                        const finalRaw = await getCartAction();
                        currentCart = finalRaw.map(i => ({ ...i, img: i.imageUrl || undefined }));
                        if (mounted) setCart(currentCart);
                    } else {
                        // No local items, just use DB cart
                        currentCart = dbItems;
                        if (mounted) setCart(dbItems);
                    }
                } else {
                    // DB cart is empty - check if user is logged in by trying merge
                    if (localItems.length > 0) {
                        const mergeResult = await mergeGuestCartAction(localItems.map(i => ({
                            id: i.id, 
                            variantId: i.variantId, 
                            qty: i.qty 
                        })));
                        
                        if (mergeResult.success) {
                            console.log("[Cart] Merge succeeded - user is logged in");
                            localStorage.removeItem("cart");
                            setIsLoggedIn(true);
                            const finalRaw = await getCartAction();
                            currentCart = finalRaw.map(i => ({ ...i, img: i.imageUrl || undefined }));
                            if (mounted) setCart(currentCart);
                        } else {
                            // User is NOT logged in - KEEP localStorage cart
                            console.log("[Cart] User is guest - keeping localStorage cart");
                            setIsLoggedIn(false);
                            // Cart is already set from localStorage, don't change it!
                        }
                    } else {
                        // No local items, no DB items - empty cart
                        console.log("[Cart] Both DB and Local are empty");
                        setIsLoggedIn(false);
                    }
                }
            } catch (dbError) {
                console.error("[Cart] DB fetch failed, keeping localStorage:", dbError);
                // DB failed - user is guest, keep localStorage cart (already set)
                setIsLoggedIn(false);
            }
            
        } catch (error) {
            console.error("[Cart] Init error:", error);
        } finally {
            if (mounted) setIsLoading(false);
        }
    };

    init();
    return () => { mounted = false; };
  }, []);

  // Flag to prevent saving during init
  const canSaveToStorage = useRef(false);
  
  // Enable saving only after loading completes
  useEffect(() => {
      if (!isLoading) {
          // Small delay to ensure all state is settled
          const timer = setTimeout(() => {
              canSaveToStorage.current = true;
          }, 100);
          return () => clearTimeout(timer);
      }
  }, [isLoading]);

  // --- Local Persistence (Only for Guest) ---
  useEffect(() => {
      // Only save if: not logged in, init complete, and saving is enabled
      if (!isLoggedIn && !isLoading && canSaveToStorage.current) {
          console.log("[Cart] Saving to localStorage:", cart.length, "items");
          localStorage.setItem("cart", JSON.stringify(cart));
      }
  }, [cart, isLoggedIn, isLoading]);
  
  // --- Favorite Persistence ---
  useEffect(() => {
      // Simplified: Just load from Local for now as per legacy
      const s = localStorage.getItem("fav");
      if (s) setFav(JSON.parse(s));
  }, []);
  
  useEffect(() => {
       localStorage.setItem("fav", JSON.stringify(fav));
  }, [fav]);


  // --- Actions ---

  const showToast = (msg: string, type: "success" | "danger" = "success") => {
      if (type === "success") {
          toast.success(msg);
      } else {
          toast.error(msg);
      }
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // Add Item
  const addToCart = (id: string, variantId?: string) => {
      const product = products.find(p => p.id === id);
      // Use provided variantId, or fallback to product's defaultVariantId
      const vId = variantId || product?.defaultVariantId || "";
      const tempItem: CartItem = {
           id, variantId: vId, qty: 1, 
           name: product?.name || 'Item', 
           price: product?.price || 0,
           imageUrl: product?.imageUrl || '',
           img: product?.img || product?.imageUrl || '',
           stock: 99 // Placeholder
      };

      setCart(prev => {
          const exists = prev.find(i => i.id === id && (i.variantId || "") === vId);
          if (exists) {
              return prev.map(i => i.id === id && (i.variantId || "") === vId ? { ...i, qty: Math.min(i.qty + 1, 99) } : i);
          }
          return [...prev, tempItem];
      });
      
      showToast("Added to Cart");
      openCart();

      // Server Sync (only if valid variantId exists)
      if (isLoggedIn && vId) {
          addToCartAction(id, vId, 1).catch(err => {
              console.error("Add failed", err);
          });
      }
  };

  const decFromCart = (id: string, variantId?: string) => {
       const product = products.find(p => p.id === id);
       const vId = variantId || product?.defaultVariantId || "";
       setCart(prev => {
           const exists = prev.find(i => i.id === id && (i.variantId || "") === vId);
           if (!exists) return prev;
           if (exists.qty > 1) {
               return prev.map(i => i.id === id && (i.variantId || "") === vId ? { ...i, qty: i.qty - 1 } : i);
           }
           return prev.filter(i => !(i.id === id && (i.variantId || "") === vId));
       });
       
       if (isLoggedIn) {
           const item = cart.find(i => i.id === id && (i.variantId || "") === vId);
           if (item && item.qty > 1) {
               updateQtyAction(id, vId, item.qty - 1);
           } else {
               removeFromCartAction(id, vId);
           }
       }
  };
  
  const removeFromCart = (id: string, variantId?: string) => {
      const product = products.find(p => p.id === id);
      const vId = variantId || product?.defaultVariantId || "";
      setCart(prev => prev.filter(i => !(i.id === id && (i.variantId || "") === vId)));
      showToast("Removed", "danger");
      
      if (isLoggedIn) {
          removeFromCartAction(id, vId);
      }
  };

  const clearCart = () => {
      setCart([]);
      // Always clear both storage types to ensure complete cleanup
      // This fixes race condition when returning from payment gateway
      localStorage.removeItem("cart");
      // Always try to clear DB cart - server action handles auth check
      clearDbCartAction().catch(() => {
          // Silently ignore - user might not be logged in
      });
  };
  
  const toggleFav = (id: ProductId) => {
    if (fav.includes(id)) {
      setFav(prev => prev.filter(fid => fid !== id));
      showToast("Removed from Favorites");
    } else {
      setFav(prev => [...prev, id]);
      showToast("Added to Favorites");
    }
  };

  const isFav = (id: ProductId) => fav.includes(id);

  return (
    <StoreContext.Provider value={{
      cart, fav, addToCart, removeFromCart, decFromCart,
      toggleFav, isFav, clearCart, isCartOpen, openCart, closeCart,
      products, showToast, isLoading
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
