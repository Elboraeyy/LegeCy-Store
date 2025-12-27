"use client";

import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { StoreProvider } from "@/context/StoreContext";
import { ComparisonProvider } from "@/context/ComparisonContext";
import CartDrawer from "./CartDrawer";
import { Toaster } from "sonner";


export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreProvider>
        <Toaster 
          position="top-right" 
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
        <ClientLayoutContent>{children}</ClientLayoutContent>
    </StoreProvider>
  );
}

// Inner component to use hooks safely
import { usePathname } from "next/navigation";

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    if (isAdmin) {
        return (
            <ComparisonProvider>
                {children}
            </ComparisonProvider>
        );
    }

    return (
      <ComparisonProvider>
        <Navbar />
        <CartDrawer />
        {children}
        <Footer />
      </ComparisonProvider>
    );
}
