"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Force scroll to top instantly to avoid smooth scroll lag on page change if desired,
    // or keep smooth if preferred. Usually for page transitions, instant is better.
    // We'll use window.scrollTo behavior: 'auto' (instant) to ensure it starts at the top.
    
    // Small timeout to ensure it runs after any automatic scroll restoration attempts
    const timeoutId = setTimeout(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "instant",
        });
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
}
