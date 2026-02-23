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
    validateStockAction,
    CartItemDTO
} from '@/lib/actions/cart';
import { toast } from 'sonner';
import { getCurrentUser } from "@/lib/actions/auth";
import { trackMetaEvent } from "@/components/MetaPixel";

// Flag used to signal cart should be cleared after payment success
export const CART_CLEARED_FLAG = 'cart_cleared_on_payment';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    specs?: any; // Product specifications for comparison page
}

// Cart Item extends DTO logic - Add 'img' for legacy UI compatibility
type CartItem = CartItemDTO & { img?: string; stock?: number }; // Ensure stock is optional but verified

type ProductId = string; 

interface StoreContextType {
  cart: CartItem[];
  fav: ProductId[];
    addToCart: (id: ProductId, variantId?: string, openDrawer?: boolean, qty?: number) => void;
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
    isLoggedIn: boolean;
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
            // CHECK FOR PAYMENT SUCCESS FLAG FIRST
            // If payment was just completed, DON'T load cart from storage
            const paymentJustCompleted = sessionStorage.getItem(CART_CLEARED_FLAG);
            if (paymentJustCompleted) {
                console.log("[Cart] Payment success flag detected - skipping cart load and clearing");
                sessionStorage.removeItem(CART_CLEARED_FLAG);
                // Set a flag for the UI to know we just finished an order (for "Back" button scenario)
                sessionStorage.setItem('last_order_success', 'true');

                localStorage.removeItem("cart");
                // Also clear DB cart
                clearDbCartAction().catch(() => {});
                if (mounted) {
                    setCart([]);
                    setIsLoading(false);
                }
                // Still fetch products
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
                    variants: p.variants || [],
                    defaultVariantId: p.defaultVariantId,
                    specs: p.specs || undefined
                }));
                if (mounted) setProducts(mapped);
                return; // Skip normal cart loading
            }

            // 0. CHECK SESSION STATUS EXPLICITLY
            const user = await getCurrentUser();
            const userLoggedIn = !!user;
            if (mounted) setIsLoggedIn(userLoggedIn);

            // 1. ALWAYS restore from localStorage first (for instant UX)
            const localStr = localStorage.getItem("cart");
            let localItems: CartItem[] = localStr ? JSON.parse(localStr) : [];
            console.log("[Cart] LocalStorage items on load:", localItems.length);

            // VALIDATE STOCK (Scenario D)
            if (localItems.length > 0) {
                try {
                    const validation = await validateStockAction(localItems.map(i => ({ id: i.id, variantId: i.variantId, qty: i.qty })));
                    let changed = false;
                    // Update localItems based on validation
                    localItems = localItems.filter(item => {
                        const v = validation.find(res => res.id === item.id && (res.variantId === item.variantId || (!res.variantId && !item.variantId)));
                        if (!v) return true; // Should not happen if passed correctly
                        if (!v.valid) {
                            if (v.available === 0) {
                                // Out of stock completely
                                changed = true;
                                return false;
                            } else {
                                // Reduced stock
                                if (item.qty > v.available) {
                                    item.qty = v.available;
                                    changed = true;
                                }
                                return true;
                            }
                        }
                        return true;
                    });

                    if (changed && mounted) {
                        showToast("Some items were removed or updated due to stock changes", "danger");
                        // Update storage immediately so subsequent logic uses valid cart
                        localStorage.setItem("cart", JSON.stringify(localItems));
                    }
                } catch (e) {
                    console.error("Stock validation failed", e);
                }
            }
            
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
                variants: p.variants || [],
                defaultVariantId: p.defaultVariantId,
                specs: p.specs || undefined
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
                    
                    // setIsLoggedIn(true); // Already set by getCurrentUser
                    
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
                            // setIsLoggedIn(true); // Already set
                            const finalRaw = await getCartAction();
                            currentCart = finalRaw.map(i => ({ ...i, img: i.imageUrl || undefined }));
                            if (mounted) setCart(currentCart);
                        } else {
                            // User is NOT logged in - KEEP localStorage cart
                            console.log("[Cart] User is guest - keeping localStorage cart");
                            if (userLoggedIn) {
                                // Weird state: Logged in but merge failed?
                                // Should imply session invalid or server error.
                                // But we rely on getCurrentUser as truth.
                            } else {
                                setIsLoggedIn(false);
                            }
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
                // DB failed - user is guest, keep localStorage cart (already set)
                if (!userLoggedIn && mounted) setIsLoggedIn(false);
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
      if (s) {
          try {
              let parsedFav = JSON.parse(s);
              // Filter out stale products if products are loaded
              if (products.length > 0) {
                  const activeProductIds = new Set(products.map(p => p.id));
                  const validFav = parsedFav.filter((id: string) => activeProductIds.has(id));

                  // Only update if there's a difference to avoid loop
                  if (validFav.length !== parsedFav.length) {
                      console.log("[Wishlist] Removed stale items", parsedFav.length - validFav.length);
                      parsedFav = validFav;
                      localStorage.setItem("fav", JSON.stringify(validFav));
                  }

                  setFav(parsedFav);
              } else {
                  // Products not loaded yet, just set invalid temporarily
                  setFav(parsedFav);
              }
          } catch (e) {
              console.error("Failed to parse wishlist", e);
              setFav([]);
          }
      }
  }, [products]); // Re-run when products load
  
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
    const addToCart = (id: string, variantId?: string, openDrawer: boolean = true, qty: number = 1) => {
        const product = products.find(p => p.id === id);
      const vId = variantId || product?.defaultVariantId || "";

        // Find variant stock
        const variant = product?.variants?.find(v => v.id === vId);
        const stock = variant?.stock ?? 0;

        // Check current qty in cart
        const currentItem = cart.find(i => i.id === id && (i.variantId || "") === vId);
        const currentQty = currentItem?.qty || 0;

        if (currentQty + qty > stock) {
            const availableToAdd = stock - currentQty;
            if (availableToAdd <= 0) {
                showToast("No more stock available", "danger");
                return;
            }
            // Add what's available
            qty = availableToAdd;
        }

      const tempItem: CartItem = {
          id, variantId: vId, qty: qty, 
           name: product?.name || 'Item', 
           price: product?.price || 0,
           imageUrl: product?.imageUrl || '',
           img: product?.img || product?.imageUrl || '',
          stock: stock 
      };

      setCart(prev => {
          const exists = prev.find(i => i.id === id && (i.variantId || "") === vId);
          if (exists) {
              return prev.map(i => i.id === id && (i.variantId || "") === vId ? { ...i, qty: Math.min(i.qty + qty, stock) } : i);
          }
          return [...prev, tempItem];
      });
      
        showToast(qty > 1 ? `Added ${qty} items to Cart` : "Added to Cart");
      if (openDrawer) openCart();

        // Meta Pixel: Track AddToCart event
        trackMetaEvent('AddToCart', {
            content_ids: [id],
            content_name: product?.name || 'Item',
            content_type: 'product',
            value: (product?.price || 0) * qty,
            currency: 'EGP',
        });

        // Server Sync
      if (isLoggedIn && vId) {
          addToCartAction(id, vId, qty).catch(err => {
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
          products, showToast, isLoading, isLoggedIn
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
