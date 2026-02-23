"use client";

import { useEffect } from "react";
import Link from "next/link";
import { setClarityTag } from "@/components/Clarity";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log exception to service if needed
    // In production, this should be sent to error tracking service
    if (process.env.NODE_ENV === 'development') {
      console.error('[Error Boundary]', {
        message: error.message,
        digest: error.digest,
        stack: error.stack,
      });
    }

    // Clarity: Track error for debugging
    setClarityTag('Last_Error_Seen', error.message);
  }, [error]);

  return (
    <main className="container" style={{ padding: "100px 0", textAlign: "center" }}>
      <h2 style={{ fontSize: "32px", marginBottom: "24px" }}>Something went wrong</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "40px" }}>
        We encountered an unexpected issue. Please try again or return to the home page.
      </p>
      <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
        <button onClick={() => reset()} className="btn btn-primary">
          Try Again
        </button>
        <Link href="/" className="btn btn-outline">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
