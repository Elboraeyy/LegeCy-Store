"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useStore } from "@/context/StoreContext";
import { Reveal } from "@/components/ui/Reveal";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUpSlow, staggerContainerSlow, fadeIn } from "@/lib/motion";
import { useIsClient } from "@/hooks/useIsClient";
import CartRecommendations from "@/components/cart/CartRecommendations";
import {
  Trash2,
  Minus,
  Plus,
  Gift,
  MessageSquare,
  ShieldCheck,
  Truck,
  CreditCard,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";

interface CartClientProps {
  freeShippingThreshold: number;
  isFreeShippingEnabled: boolean;
}

export default function CartClient({
  freeShippingThreshold = 2000,
  isFreeShippingEnabled = true
}: CartClientProps) {
  const { cart, addToCart, decFromCart, removeFromCart } = useStore();
  const isClient = useIsClient();

  // Dynamic Free Shipping Threshold passed from server
  const FREE_SHIPPING_THRESHOLD = freeShippingThreshold;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const formatPrice = (p: number) => `EGP ${p.toLocaleString()}`;



  if (!isClient) return null;

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-[#FCF8F3] pb-20">
        <div className="container px-4">
          <Reveal width="100%">
            <div className="bg-gradient-to-br from-[#12403C] to-[#0E3330] text-center py-16 md:py-20 bg-white rounded-2xl md:rounded-3xl border border-[rgba(18,64,60,0.05)] shadow-sm max-w-2xl mx-auto relative overflow-hidden">
              <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.5">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </div>
                <h2 className="text-3xl font-heading text-[#FCF8F3] mb-4">Your bag is empty</h2>
                <p className="text-[#FCF8F3]/70 mb-8 max-w-md mx-auto px-4">
                  Looks like you haven't added any luxury timepieces to your collection yet.
                </p>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-[#FCF8F3] text-[#12403C] font-bold tracking-widest uppercase text-sm rounded-full hover:bg-[#d4af37] hover:text-white transition-all transform hover:-translate-y-1 shadow-lg"
                >
                  Start Shopping <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </Reveal>

          {/* Recommendations even if empty */}
          <CartRecommendations />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FCF8F3] pb-20">
      {/* Hero Section - Full Width */}
      <div className="bg-gradient-to-br from-[#12403C] to-[#0E3330] text-center py-12 md:py-16 mb-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="container mx-auto px-4 relative z-10">
          <Reveal>
            <h1 className="text-4xl md:text-5xl font-heading text-[#FCF8F3] mb-3 tracking-wide">Shopping Bag</h1>
            <p className="text-[#FCF8F3]/70 text-sm md:text-base">{cart.length} items in your bag</p>
          </Reveal>
        </div>
      </div>

      <div className="container px-4">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">


          {/* Left Column: Cart Items & Options */}
          <div className="flex-1">
            {/* Free Shipping Progress */}
            {/* Free Shipping Progress */}
            {isFreeShippingEnabled && (
              <Reveal delay={0.1}>
                <div className="bg-white p-6 rounded-xl border border-[rgba(18,64,60,0.08)] mb-8 shadow-sm relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <Truck className="w-5 h-5 text-[#d4af37]" />
                    <span className="font-medium text-[#12403C]">
                      {remainingForFreeShipping > 0
                        ? <span>Add <span className="text-[#d4af37] font-bold">{formatPrice(remainingForFreeShipping)}</span> for Free Express Shipping</span>
                        : <span className="text-green-600 font-bold">You've unlocked Free Express Shipping!</span>
                      }
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden relative z-10">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#12403C] to-[#d4af37]"
                      initial={{ width: 0 }}
                      animate={{ width: `${shippingProgress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.1)_0%,transparent_70%)] pointer-events-none" />
                </div>
              </Reveal>
            )}

            {/* Cart Items List */}
            <div className="space-y-6 mb-12">
              <AnimatePresence>
                  {cart.map((item, index) => (
                    <motion.div
                      key={`${item.id}-${index}`}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.3 }}
                      className="group bg-white p-4 sm:p-6 rounded-xl border border-[rgba(18,64,60,0.08)] hover:border-[#d4af37]/30 transition-all shadow-sm hover:shadow-md flex gap-4 sm:gap-6"
                    >
                      {/* Product Image */}
                      <Link href={`/product/${item.id}`} className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                        <Image
                          src={item.img || '/globe.svg'}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </Link>

                      {/* Product Info */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <Link href={`/product/${item.id}`} className="text-[#12403C] hover:text-[#d4af37] transition-colors">
                              <h3 className="font-heading font-bold text-lg sm:text-xl leading-tight mb-1">{item.name}</h3>
                            </Link>
                            <p className="text-gray-500 text-sm mb-2">{formatPrice(item.price)}</p>
                            {item.variantId && (
                              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded inline-block">
                                One Size
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="flex justify-between items-end mt-4">
                          {/* Qty Control */}
                          <div className="flex items-center gap-3 bg-[#FCF8F3] rounded-full p-1 border border-[#12403C]/10">
                            <button
                              onClick={() => decFromCart(item.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-[#12403C] hover:scale-105 active:scale-95 transition-all shadow-sm"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center font-bold text-[#12403C] text-sm">{item.qty}</span>
                            <button 
                              onClick={() => addToCart(item.id, undefined, false)}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-[#12403C] hover:scale-105 active:scale-95 transition-all shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <p className="font-bold text-[#12403C] text-lg">
                            {formatPrice(item.price * item.qty)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>

            {/* Additional Options */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {/* Gift Option */}



            </div>

            {/* Cross-Sell Recommendations */}
            <CartRecommendations />
          </div>

          {/* Right Column: Summary (Sticky) */}
          <div className="lg:w-[380px] flex-shrink-0">
            <div className="sticky top-24">
              <Reveal delay={0.2} width="100%">
                <div className="bg-white rounded-2xl border border-[rgba(18,64,60,0.08)] shadow-[0_10px_40px_rgba(0,0,0,0.05)] overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-heading font-bold text-xl text-[#12403C]">Order Summary</h3>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-[#12403C]">{formatPrice(subtotal)}</span>
                    </div>



                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      {remainingForFreeShipping === 0 ? (
                        <span className="font-bold text-green-600">Free</span>
                      ) : (
                        <span className="text-gray-400 text-xs">Calculated at checkout</span>
                      )}
                    </div>

                    <div className="my-4 pt-4 border-t border-dashed border-gray-200 flex justify-between items-baseline">
                      <span className="font-bold text-lg text-[#12403C]">Total</span>
                      <div className="text-right">
                        <span className="block font-heading font-bold text-2xl text-[#12403C]">{formatPrice(total)}</span>
                        <span className="text-xs text-gray-400">Including Taxes</span>
                      </div>
                    </div>

                    <Link
                      href="/checkout"
                      className="group relative block w-full py-[14px] px-[24px] text-[13px] font-semibold tracking-[0.8px] uppercase bg-gradient-to-br from-[#12403C] to-[#1a5450] text-white border-none rounded-full cursor-pointer transition-all duration-300 hover:shadow-[0_8px_24px_rgba(18,64,60,0.2)] hover:-translate-y-[2px] overflow-hidden text-center"
                    >
                      <span className="relative z-10">Proceed to Checkout</span>
                      <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-500 group-hover:left-[100%]"></div>
                    </Link>

                    {/* Trust Badges */}
                    <div className="pt-6 mt-2 flex justify-center items-start gap-6 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <ShieldCheck className="w-5 h-5 text-[#d4af37]" />
                        <span className="text-[10px] text-gray-500 font-medium">Secure Checkout</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        <Truck className="w-5 h-5 text-[#d4af37]" />
                        <span className="text-[10px] text-gray-500 font-medium">Fast Shipping</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        <CreditCard className="w-5 h-5 text-[#d4af37]" />
                        <span className="text-[10px] text-gray-500 font-medium">Flexible Payment</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.4} width="100%">
                <p className="text-center text-xs text-gray-400 mt-6">
                  Need help? <Link href="/help" className="text-[#12403C] underline hover:text-[#d4af37]">Contact Support</Link>
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
