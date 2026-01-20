import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy | LegaCy',
  description: 'Return and refund policy for LegaCy - Premium Men\'s Accessories',
};

export default function RefundPolicyPage() {
  return (
    <main className="policy-page">
      {/* Hero Section */}
      <section className="policy-hero">
        <div className="container">
          <div className="policy-hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
            </svg>
          </div>
          <h1>Refund Policy</h1>
          <p>Your satisfaction is our priority</p>
          <div className="last-updated">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            Last Updated: January 4, 2026
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="policy-content">
        <div className="container">
          <div className="policy-card">
            
            {/* Return Window */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2>Return Window</h2>
              </div>
              <p>
                You may request a return within <strong>14 days</strong> of receiving your order. 
                All items must be unused, unworn, and in their original packaging with tags attached. 
                This applies to watches, wallets, sunglasses, and all accessories.
              </p>
            </div>

            {/* Non-Returnable Items */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <h2>Non-Returnable Items</h2>
              </div>
              <p>For hygiene and safety reasons, the following items cannot be returned:</p>
              <ul className="policy-list">
                <li>Opened perfumes and fragrances</li>
                <li>Used grooming products and skincare items</li>
                <li>Personalized or engraved items (custom watches, monogrammed wallets)</li>
                <li>Items marked as &quot;Final Sale&quot; or purchased during clearance</li>
                <li>Products with removed or damaged tags</li>
              </ul>
            </div>

            {/* How to Return */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h2>How to Return</h2>
              </div>
              <p>Follow these simple steps to initiate a return:</p>
              <ol className="policy-list numbered">
                <li>Log into your account and go to Order History</li>
                <li>Select the order and click &quot;Request Return&quot;</li>
                <li>Choose the item(s) and reason for return</li>
                <li>Upload photos showing the item&apos;s condition</li>
                <li>Wait for approval email with return instructions</li>
              </ol>
            </div>

            {/* Refund Processing */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2>Refund Processing</h2>
              </div>
              <p>
                <strong>Online Payments:</strong> Refunded to your original payment method within 5-10 business days 
                after we receive and inspect the returned item.
              </p>
              <p>
                <strong>Cash on Delivery:</strong> Refund via bank transfer. Please provide your bank account details 
                when initiating the return.
              </p>
            </div>

            {/* Product-Specific Policy */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <h2>Product Returns</h2>
              </div>
              <p>
                All products must be returned with their original box, warranty card, manual, and any accessories.
                Protective stickers and seals must not be removed. Items with signs of use
                may be subject to a restocking fee.
              </p>
            </div>

            {/* Damaged or Wrong Items */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2>Damaged or Wrong Items</h2>
              </div>
              <p>
                Received a damaged or wrong item? Contact us within <strong>48 hours</strong> of delivery 
                with photos. We&apos;ll arrange a replacement or full refund at no cost to you, including shipping.
              </p>
              <div className="policy-info-box">
                <h4>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Important
                </h4>
                <p>Always inspect your package at delivery. If the outer packaging appears damaged, document it with photos before opening.</p>
              </div>
            </div>

            {/* Contact Box */}
            <div className="policy-contact-box">
              <h3>Need Help With a Return?</h3>
              <p>Our customer service team is ready to assist you</p>
              <a href="mailto:info@legecy.store" className="contact-email">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                info@legecy.store
              </a>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
