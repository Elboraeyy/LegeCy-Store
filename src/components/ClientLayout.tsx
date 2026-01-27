"use client";

import React, { useState, useEffect } from "react";
import { StoreProvider } from "@/context/StoreContext";
import { ComparisonProvider } from "@/context/ComparisonContext";
import CartDrawer from "./CartDrawer";
import SplashScreen from "./SplashScreen";
import { Toaster } from "sonner";


export default function ClientLayout({
  children,
  navbar,
  footer,
}: {
  children: React.ReactNode;
  navbar: React.ReactNode;
  footer: React.ReactNode;
}) {
  const { direction } = useLanguage();
  return (
    <StoreProvider>
        <Toaster 
        position="top-right"
        dir={direction} 
          richColors 
          toastOptions={{
            style: {
              fontFamily: 'var(--font-inter)',
            },
            classNames: {
              success: 'bg-emerald-50 border-emerald-200',
              error: 'bg-red-50 border-red-200',
            }
          }}
        />
        <ClientLayoutContent navbar={navbar} footer={footer}>{children}</ClientLayoutContent>
    </StoreProvider>
  );
}

// Inner component to use hooks safely
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

function ClientLayoutContent({ children, navbar, footer }: { children: React.ReactNode; navbar: React.ReactNode; footer: React.ReactNode }) {
    const pathname = usePathname();
  const { direction } = useLanguage();
    const isAdmin = pathname?.startsWith('/admin');
    const isPOS = pathname?.startsWith('/pos');
    const isHomepage = pathname === '/';
    const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup') || pathname?.startsWith('/forgot-password') || pathname?.startsWith('/reset-password');

    // Splash Screen State - Must be called unconditionally
    const [showSplash, setShowSplash] = useState(false);
    const [contentVisible, setContentVisible] = useState(!isHomepage);

    useEffect(() => {
        if (isHomepage) {
            const hasShown = sessionStorage.getItem("splash_shown");
            if (!hasShown) {
                // Content is already hidden by default state
                requestAnimationFrame(() => setShowSplash(true));
            } else {
                // Delay showing content slightly to ensure hydration matches and avoid sync update warning
                requestAnimationFrame(() => setContentVisible(true));
            }
        } else {
            // Ensure content is visible on other pages (if navigating back)
            if (!contentVisible) {
                setTimeout(() => setContentVisible(true), 0);
            }
        }
    }, [isHomepage, contentVisible]);

    const handleSplashFinish = () => {
        setShowSplash(false);
        setContentVisible(true);
        sessionStorage.setItem("splash_shown", "true");
    };

    // Admin, POS, and Auth pages don't show site navbar/footer
    if (isAdmin || isPOS || isAuthPage) {
        return (
            <ComparisonProvider>
                {children}
            </ComparisonProvider>
        );
    }

    return (
      <ComparisonProvider>
        {/* Show splash screen only on homepage */}
        {showSplash && <SplashScreen onFinish={handleSplashFinish} storeName="Legacy" />}
        
        <div 
          className="flex flex-col min-h-screen"
          style={{ 
            opacity: contentVisible ? 1 : 0, 
            transition: 'opacity 0.5s ease-in-out',
            visibility: contentVisible ? 'visible' : 'hidden'
          }}
        >
            {navbar}
            <CartDrawer />
            <main className="flex-grow">
              {children}
            </main>
            {footer}
        </div>
      </ComparisonProvider>
    );
}
