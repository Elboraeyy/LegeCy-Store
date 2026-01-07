import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | LegaCy',
  description: 'Terms and conditions for using LegaCy - Premium Men\'s Accessories Store',
};

export default function TermsOfServicePage() {
  return (
    <main className="policy-page">
      {/* Hero Section */}
      <section className="policy-hero">
        <div className="container">
          <div className="policy-hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1>Terms of Service</h1>
          <p>Please read these terms carefully before shopping with us</p>
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
            
            {/* Section 1 */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2>1. Acceptance of Terms</h2>
              </div>
              <p>
                By accessing or using LegaCy (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), Egypt&apos;s premium destination for 
                men&apos;s watches, wallets, and luxury accessories, you agree to be bound by these Terms of Service. 
                If you do not agree to all terms, please do not use our services.
              </p>
            </div>

            {/* Section 2 */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2>2. Account Registration</h2>
              </div>
              <p>
                You may browse our collection of premium watches, leather wallets, perfumes, sunglasses, 
                and grooming products without registering. However, placing an order requires creating an account. 
                You are responsible for maintaining account security and all activities under your account.
              </p>
            </div>

            {/* Section 3 */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2>3. Products and Pricing</h2>
              </div>
              <p>
                All prices are displayed in Egyptian Pounds (EGP) and include applicable taxes unless stated otherwise. 
                We reserve the right to modify prices at any time. All orders are subject to product availability. 
                Product images are for illustration purposes; actual items may vary slightly.
              </p>
            </div>

            {/* Section 4 */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h2>4. Payment</h2>
              </div>
              <p>
                We accept Cash on Delivery (COD) and secure online payments via Paymob (Visa, Mastercard, and mobile wallets). 
                For online payments, your order will be processed after successful payment confirmation.
              </p>
            </div>

            {/* Section 5 */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h2>5. Shipping</h2>
              </div>
              <p>
                All products are carefully packaged to ensure safe delivery. Delivery times are estimates and may vary 
                based on your location. We are not liable for delays beyond our control. Risk of loss transfers to you 
                upon delivery. For full details, see our <a href="/shipping-policy">Shipping Policy</a>.
              </p>
            </div>

            {/* Section 6 */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                  </svg>
                </div>
                <h2>6. Returns and Refunds</h2>
              </div>
              <p>
                We want you to be completely satisfied with your purchase. Please review our 
                <a href="/refund-policy"> Refund Policy</a> for details on returns. Returns must be 
                initiated within 14 days of delivery. Products must be unused and in original packaging.
              </p>
            </div>

            {/* Section 7 */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2>7. Product Authenticity</h2>
              </div>
              <p>
                All watches, accessories, and products sold at LegaCy are 100% authentic. 
                We source directly from authorized distributors and trusted suppliers. 
                Each item comes with authenticity guarantee where applicable.
              </p>
            </div>

            {/* Section 8 */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2>8. Limitation of Liability</h2>
              </div>
              <p>
                To the maximum extent permitted by law, LegaCy shall not be liable for indirect, 
                incidental, or consequential damages arising from use of our services or products.
              </p>
            </div>

            {/* Section 9 */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <h2>9. Governing Law</h2>
              </div>
              <p>
                These terms are governed by the laws of the Arab Republic of Egypt. Any disputes shall 
                be resolved in the courts of Cairo.
              </p>
            </div>

            {/* Contact Box */}
            <div className="policy-contact-box">
              <h3>Questions About These Terms?</h3>
              <p>Our team is here to help clarify any concerns</p>
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
