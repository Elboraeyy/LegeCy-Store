"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import { useStore } from "@/context/StoreContext";
import { useComparison } from "@/context/ComparisonContext";
import { Reveal } from "@/components/ui/Reveal";

interface RelatedProductsProps {
  products: Product[];
  currentProductId: string;
}

export default function RelatedProducts({ products, currentProductId }: RelatedProductsProps) {
  const { addToCart, toggleFav, isFav, products: storeProducts } = useStore();
  const { addToCompare, removeFromCompare, isInComparison } = useComparison();
  const router = useRouter();

  // Filter out current product and get related ones
  const relatedProducts = products
    .filter(p => String(p.id) !== String(currentProductId))
    .slice(0, 4);

  if (relatedProducts.length === 0) return null;

  const formatPrice = (price: number) => `EGP ${price.toLocaleString()}`;

  return (
    <section className="related-section">
      <Reveal>
        <h2 className="related-title">You May Also Like</h2>
      </Reveal>
      
      <div className="related-grid">
        {relatedProducts.map((product, idx) => {
          const fullProduct = storeProducts.find(p => String(p.id) === String(product.id));
          const variantId = fullProduct?.defaultVariantId || fullProduct?.variants?.[0]?.id;
          const isFavorite = isFav(String(product.id));

          return (
            <Reveal key={product.id} delay={idx * 0.1}>
              <div className="product-card premium">
                <Link href={`/product/${product.id}`} className="product-media">
                  {product.img ? (
                    <Image
                      src={product.img}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f5f5f5',
                      color: '#999'
                    }}>
                      No Image
                    </div>
                  )}
                </Link>
                <div className="product-body">
                  <Link href={`/product/${product.id}`}>
                    <h3 className="product-title">{product.name}</h3>
                  </Link>
                  <p className="product-price">{formatPrice(product.price)}</p>
                  <div className="product-actions">
                    <button
                      className="btn-icon"
                      onClick={() => variantId && addToCart(String(product.id), variantId)}
                      title="Add to Cart"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                      </svg>
                    </button>
                    <button
                      className={`btn-icon ${isInComparison(String(product.id)) ? 'active' : ''}`}
                      onClick={() => {
                          if (!isInComparison(String(product.id))) {
                              addToCompare({
                                  id: String(product.id),
                                  name: product.name,
                                  price: product.price,
                                  img: product.img || undefined,
                                  cat: product.category || undefined,
                                  description: product.description || undefined
                              });
                              router.push('/compare');
                          } else {
                              removeFromCompare(String(product.id));
                          }
                      }}
                      title="Compare"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 20V10M18 6V4M12 20V12M12 8V4M6 20V14M6 10V4"/>
                        <circle cx="18" cy="8" r="2"/>
                        <circle cx="12" cy="10" r="2"/>
                        <circle cx="6" cy="12" r="2"/>
                      </svg>
                    </button>
                    <button
                      className={`btn-icon ${isFavorite ? 'active' : ''}`}
                      onClick={() => toggleFav(String(product.id))}
                      title={isFavorite ? "Remove from Wishlist" : "Add to Wishlist"}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
