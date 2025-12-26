"use client";

import React, { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { fetchShopProducts, ShopProduct } from "@/lib/actions/shop";
import Image from "next/image";

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
  excludeProductIds?: (string | number)[];
}

export default function ProductSelectionModal({ isOpen, onClose, onSelect, excludeProductIds = [] }: ProductSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    
    let mounted = true;
    
    (async () => {
      const data = await fetchShopProducts();
      if (mounted) {
        setProducts(data);
        setLoading(false);
      }
    })();
    
    return () => { mounted = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredProducts = products.filter(p => {
    const excludeIds = excludeProductIds.map(id => String(id));
    if (excludeIds.includes(String(p.id))) return false;
    if (!searchTerm) return true;
    return p.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      backdropFilter: "blur(4px)"
    }}>
      <div className="modal-content" style={{
        background: "var(--surface)",
        width: "90%",
        maxWidth: "600px",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column",
        maxHeight: "80vh"
      }}>
        <div style={{ padding: "20px", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "center", gap: "12px" }}>
           <div className="search-container" style={{ flex: 1, margin: 0 }}>
             <input 
               type="text" 
               placeholder="Search watches..." 
               className="search-input"
               autoFocus
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
             <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
             </svg>
           </div>
           <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px" }}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
               <path d="M18 6L6 18M6 6l12 12"/>
             </svg>
           </button>
        </div>

        <div style={{ overflowY: "auto", padding: "20px" }}>
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading products...</div>
            ) : filteredProducts.length === 0 ? (
                <div className="empty-state">No watches found</div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "16px" }}>
                   {filteredProducts.map(product => (
                       <div 
                         key={product.id} 
                         onClick={() => onSelect({
                           id: product.id,
                           name: product.name,
                           price: product.price,
                           imageUrl: product.imageUrl,
                           img: product.imageUrl || '/placeholder.jpg',
                           category: product.category
                         })}
                         style={{ 
                           border: "1px solid var(--border-light)", 
                           borderRadius: "8px", 
                           overflow: "hidden", 
                           cursor: "pointer",
                           transition: "border-color 0.2s"
                         }}
                         className="hover-border-accent"
                       >
                          <div style={{ position: "relative", aspectRatio: "3/4", background: "var(--surface-light)" }}>
                             {product.imageUrl ? (
                               <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="150px" />
                             ) : (
                               <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No Image</div>
                             )}
                          </div>
                          <div style={{ padding: "10px" }}>
                             <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>{product.category || 'Watch'}</div>
                             <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</div>
                             <div style={{ fontSize: "13px", color: "var(--primary)" }}>EGP {product.price.toLocaleString()}</div>
                          </div>
                       </div>
                   ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
