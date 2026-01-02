"use client";

import React, { useState } from "react";
import Link from "next/link";

interface PromoBannerProps {
  message?: string;
  linkText?: string;
  linkHref?: string;
  dismissible?: boolean;
}

export default function PromoBanner({
  message = "🎄 Holiday Special: FREE SHIPPING on orders over EGP 2,000! Use code: HOLIDAY25",
  linkText = "Shop Now",
  linkHref = "/shop",
  dismissible = true,
}: PromoBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="promo-banner">
      <div className="promo-content">
        <span className="promo-message">{message}</span>
        {linkText && linkHref && (
          <Link href={linkHref} className="promo-link">
            {linkText} →
          </Link>
        )}
      </div>
      {dismissible && (
        <button
          className="promo-close"
          onClick={() => setIsVisible(false)}
          aria-label="Close banner"
        >
          ×
        </button>
      )}

      <style jsx>{`
        .promo-banner {
          background: linear-gradient(135deg, #12403C, #2d5a4e);
          color: #fff;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          font-size: 14px;
          z-index: 1000;
        }

        .promo-content {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .promo-message {
          font-weight: 500;
        }

        .promo-link {
          color: #d4af37;
          text-decoration: none;
          font-weight: 600;
          transition: opacity 0.2s;
        }

        .promo-link:hover {
          opacity: 0.8;
        }

        .promo-close {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          font-size: 24px;
          cursor: pointer;
          padding: 4px 8px;
          line-height: 1;
          transition: color 0.2s;
        }

        .promo-close:hover {
          color: #fff;
        }

        @media (max-width: 768px) {
          .promo-banner {
            padding: 10px 48px 10px 16px;
            font-size: 13px;
          }

          .promo-content {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}
