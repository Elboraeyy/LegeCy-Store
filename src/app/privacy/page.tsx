import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | LegaCy',
  description: 'How LegaCy collects, uses, and protects your personal data',
};

export default function PrivacyPage() {
  return (
    <main className="policy-page">
      {/* Hero Section */}
      <section className="policy-hero">
        <div className="container">
          <div className="policy-hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1>Privacy Policy</h1>
          <p>Your privacy matters to us. Learn how we protect your data</p>
          <div className="last-updated">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            Effective Date: January 1, 2026
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="policy-content">
        <div className="container">
          <div className="policy-card">
            
            {/* Introduction */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2>1. Introduction</h2>
              </div>
              <p>
                Welcome to <strong>LegaCy</strong>, Egypt&apos;s premier destination for men&apos;s watches, 
                leather wallets, perfumes, sunglasses, grooming products, and premium accessories. 
                We respect your privacy and are committed to protecting your personal data. This privacy 
                policy explains how we handle your information when you shop with us.
              </p>
            </div>

            {/* Data We Collect */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <h2>2. Data We Collect</h2>
              </div>
              <p>When you shop at LegaCy, we may collect the following information:</p>
              <ul className="policy-list">
                <li><strong>Identity Data:</strong> Your name, username, and profile information</li>
                <li><strong>Contact Data:</strong> Email address, phone number, and delivery address</li>
                <li><strong>Transaction Data:</strong> Order details, payment information, and purchase history</li>
                <li><strong>Technical Data:</strong> IP address, browser type, and device information</li>
                <li><strong>Preference Data:</strong> Your favorite brands, styles, and product preferences</li>
              </ul>
            </div>

            {/* How We Use Your Data */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h2>3. How We Use Your Data</h2>
              </div>
              <p>We use your information to provide you with the best shopping experience:</p>
              <ul className="policy-list">
                <li>Process and deliver your orders for watches, wallets, and accessories</li>
                <li>Send order confirmations and delivery updates</li>
                <li>Notify you about new arrivals and exclusive offers</li>
                <li>Recommend products based on your preferences</li>
                <li>Improve our website and customer service</li>
                <li>Prevent fraud and ensure secure transactions</li>
              </ul>
            </div>

            {/* Social Login */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                  </svg>
                </div>
                <h2>4. Social Login</h2>
              </div>
              <p>
                If you sign in using Facebook or Google, we receive your name, email, and profile picture 
                to create your account. This makes shopping faster and more convenient.
              </p>
              <div className="policy-info-box">
                <h4>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Your Control
                </h4>
                <p>We never post on your social media without permission. You can disconnect your social account anytime from your settings.</p>
              </div>
            </div>

            {/* Data Security */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2>5. Data Security</h2>
              </div>
              <p>
                Your data security is our priority. We use industry-standard encryption for all transactions. 
                Payment processing is handled securely through Paymob. We never store your full card details 
                on our servers.
              </p>
            </div>

            {/* Your Rights */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h2>6. Your Rights</h2>
              </div>
              <p>You have full control over your data. You can:</p>
              <ul className="policy-list">
                <li>Access and view your personal data anytime</li>
                <li>Update or correct your information</li>
                <li>Request deletion of your account</li>
                <li>Opt out of marketing communications</li>
                <li>Download a copy of your data</li>
              </ul>
            </div>

            {/* Contact Box */}
            <div className="policy-contact-box">
              <h3>Questions About Your Privacy?</h3>
              <p>Contact our team for any concerns</p>
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
