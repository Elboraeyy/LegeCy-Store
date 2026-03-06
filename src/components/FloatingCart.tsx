"use client";

import React, { useEffect, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { useLanguage } from "@/context/LanguageContext";
import { usePathname } from "next/navigation";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { previewSitewideDiscount } from "@/lib/services/discountService";
import { useIsClient } from "@/hooks/useIsClient";
import Link from "next/link";

export default function FloatingCart() {
  const { cart } = useStore();
  const { t, language } = useLanguage();
  const pathname = usePathname();
  const isClient = useIsClient();
  const [sitewideDiscount, setSitewideDiscount] = useState<number>(0);

  // Calculate items and subtotal
  const itemCount = cart.reduce((a, c) => a + c.qty, 0);
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  // Fetch discount preview
  useEffect(() => {
    async function loadDiscount() {
      if (cart.length === 0) {
        setSitewideDiscount(0);
        return;
      }
      try {
        const items = cart.map(item => ({ price: item.price, quantity: item.qty }));
        const result = await previewSitewideDiscount(items);
        setSitewideDiscount(result.amount);
      } catch {
        setSitewideDiscount(0);
      }
    }
    loadDiscount();
  }, [cart]);

  // Visibility logic
  const isExcludedPage =
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/pos");

  const isVisible = isClient && !isExcludedPage && itemCount > 0;

  const total = Math.max(0, subtotal - sitewideDiscount);

  const formatPrice = (p: number) => {
    return language === 'ar'
      ? `${p.toLocaleString('en-US')} ${t.common.currency}`
      : `${t.common.currency} ${p.toLocaleString('en-US')}`;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-4 right-4 z-[90] lg:hidden"
        >
          <Link
            href="/cart"
            className="w-full bg-[#12403C] text-[#FCF8F3] p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] flex items-center justify-between group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <ShoppingBag className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 bg-[#d4af37] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {itemCount}
                </span>
              </div>
              <div className="flex flex-col items-start translate-y-[1px]">
                <span className="text-[10px] uppercase tracking-wider opacity-70 font-bold">
                  {t.cart.your_cart}
                </span>
                <div className="flex items-center gap-2">
                  {sitewideDiscount > 0 && (
                    <span className="text-xs line-through opacity-60">
                      {formatPrice(subtotal)}
                    </span>
                  )}
                  <span className="text-sm font-bold">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest">
                {language === 'ar' ? 'عرض السلة' : 'VIEW CART'}
              </span>
              <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${language === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
