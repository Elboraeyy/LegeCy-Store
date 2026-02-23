"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const META_PIXEL_ID = "1441171770973511";

export default function MetaPixel() {
    const pathname = usePathname();

    // Initialize pixel on mount
    useEffect(() => {
        // Skip if already loaded
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).fbq) return;

        /* eslint-disable @typescript-eslint/no-explicit-any */
        const n: any = function (...args: any[]) {
            if (n.callMethod) {
                n.callMethod(...args);
            } else {
                n.queue.push(args);
            }
        };
        n.push = n;
        n.loaded = !0;
        n.version = "2.0";
        n.queue = [] as any[];

        (window as any).fbq = n;
        if (!(window as any)._fbq) (window as any)._fbq = n;
        /* eslint-enable @typescript-eslint/no-explicit-any */

        const t = document.createElement("script");
        t.async = true;
        t.src = "https://connect.facebook.net/en_US/fbevents.js";
        const s = document.getElementsByTagName("script")[0];
        s?.parentNode?.insertBefore(t, s);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).fbq("init", META_PIXEL_ID);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).fbq("track", "PageView");
    }, []);

    // Track PageView on client-side route changes
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof window !== "undefined" && (window as any).fbq) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).fbq("track", "PageView");
        }
    }, [pathname]);

    return (
        <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
            />
        </noscript>
    );
}

/**
 * Helper to fire Meta Pixel events from anywhere in the app.
 * Usage: trackMetaEvent('AddToCart', { content_ids: ['123'], value: 100, currency: 'EGP' })
 */
export function trackMetaEvent(
    eventName: string,
    params?: Record<string, unknown>
) {
    if (typeof window !== "undefined") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fbq = (window as any).fbq;
        if (typeof fbq === "function") {
            if (params) {
                fbq("track", eventName, params);
            } else {
                fbq("track", eventName);
            }
        }
    }
}
