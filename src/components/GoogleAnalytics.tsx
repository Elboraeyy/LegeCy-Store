"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

export default function GoogleAnalytics() {
    const pathname = usePathname();

    // Track page views on route change
    useEffect(() => {
        if (typeof window !== "undefined" && pathname) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const gtag = (window as any).gtag;
            if (typeof gtag === "function") {
                gtag("config", GA_MEASUREMENT_ID, {
                    page_path: pathname,
                });
            }
        }
    }, [pathname]);

    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${GA_MEASUREMENT_ID}');
                `}
            </Script>
        </>
    );
}

/**
 * Helper to fire GA4 events from anywhere.
 * Usage: trackGAEvent('add_to_cart', { currency: 'EGP', value: 100, items: [...] })
 */
export function trackGAEvent(
    eventName: string,
    params?: Record<string, unknown>
) {
    if (typeof window !== "undefined") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gtag = (window as any).gtag;
        if (typeof gtag === "function") {
            gtag("event", eventName, params || {});
        }
    }
}

/**
 * Track Auth events (login, sign_up)
 */
export function trackGAAuth(method: 'email' | 'google', type: 'login' | 'sign_up') {
    trackGAEvent(type, { method });
}

/**
 * Track Lead events (WhatsApp, Phone)
 */
export function trackGALead(type: 'WhatsApp' | 'Phone', contact_info?: string) {
    trackGAEvent('generate_lead', {
        lead_type: type,
        contact_info: contact_info || 'Unknown'
    });
}
