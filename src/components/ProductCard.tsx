"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import { useStore } from "@/context/StoreContext";
import AddToCompareButton from "./AddToCompareButton";
import { useIsClient } from "@/hooks/useIsClient";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const router = useRouter();
  const { addToCart, toggleFav, isFav } = useStore();
  const isClient = useIsClient();

  const formatPrice = (p: number) => `EGP ${p.toLocaleString()}`;
  
  // Handle both imageUrl (database) and img (legacy) fields
  const productImage = product.imageUrl || product.img || '/placeholder.jpg';
  const [imgSrc, setImgSrc] = React.useState(productImage);

  // Calculate badges
  const isOnSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const isOutOfStock = product.inStock === false;
  const isNew = product.isNew; // New logic based on createdAt

  // Calculate sale percentage
  const salePercent = isOnSale 
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100) 
    : 0;

  return (
    <div className="product-card premium fade-in">
      <div className="product-media" style={{ cursor: "pointer", position: "relative" }}>
        {/* Product Badges */}
        {(isOnSale || isOutOfStock) && (
          <div className="product-badge-container">
            {isOnSale && (
              <span className="product-badge product-badge-sale">
                -{salePercent}%
              </span>
            )}
            {isNew && !isOutOfStock && (
              <span className="product-badge product-badge-new">
                New
              </span>
            )}
            {isOutOfStock && (
              <span className="product-badge product-badge-out">
                Sold Out
              </span>
            )}
          </div>
        )}
        
        <Link href={`/product/${product.id}`} style={{ display: "block", width: "100%", height: "100%" }}>
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            className="object-cover"
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImgSrc('/placeholder.jpg')}
          />
        </Link>
      </div>
      <div className="product-body">
        <h3
          className="product-title"
          style={{ cursor: "pointer" }}
          onClick={() => router.push(`/product/${product.id}`)}
        >
          {product.name}
        </h3>
        <div className="product-price-wrapper">
          <p className="product-price">{formatPrice(product.price)}</p>
          {isOnSale && (
            <p className="product-compare-price">{formatPrice(product.compareAtPrice!)}</p>
          )}
        </div>
        <div className="product-actions">
          <Link
            href={`/product/${product.id}`}
            className="btn-icon"
            title="View Details"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </Link>
          <button
            className="btn-icon"
            title="Add to Cart"
            onClick={() => addToCart(String(product.id))}
            disabled={isOutOfStock}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </button>
          <button
            className="btn-icon"
            title="Favorite"
            onClick={() => toggleFav(String(product.id))}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={isClient && isFav(String(product.id)) ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <AddToCompareButton product={product} />
        </div>
      </div>
    </div>
  );
}
