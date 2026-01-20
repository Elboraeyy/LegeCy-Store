import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | LegaCy',
  description: 'How LegaCy uses cookies to enhance your shopping experience',
};

export default function CookiePolicyPage() {
  return (
    <main className="policy-page">
      {/* Hero Section */}
      <section className="policy-hero">
        <div className="container">
          <div className="policy-hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10c0-.34-.017-.676-.05-1.008a7.994 7.994 0 01-3.95.008 4 4 0 01-5.95-5.95 7.994 7.994 0 01.008-3.95A10.042 10.042 0 0012 2z" />
            </svg>
          </div>
          <h1>Cookie Policy</h1>
          <p>How we use cookies to improve your shopping experience</p>
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
            
            {/* What Are Cookies */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2>What Are Cookies?</h2>
              </div>
              <p>
                Cookies are small text files stored on your device when you visit our store. 
                They help us remember your preferences, keep items in your cart, and provide 
                you with personalized product recommendations for watches, wallets, and accessories.
              </p>
            </div>

            {/* How We Use Cookies */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2>How We Use Cookies</h2>
              </div>
              
              <h3>Essential Cookies</h3>
              <p>
                Required for basic store functionality: keeping you logged in, maintaining your 
                shopping cart, and processing secure payments.
              </p>
              
              <h3>Preference Cookies</h3>
              <p>
                Remember your settings like preferred currency, recently viewed products, 
                and your wishlist selections.
              </p>
              
              <h3>Analytics Cookies</h3>
              <p>
                Help us understand which products are popular and how customers navigate our store, 
                so we can improve your shopping experience.
              </p>
              
              <h3>Marketing Cookies</h3>
              <p>
                Allow us to show you relevant ads for new arrivals, accessories, and exclusive 
                offers on platforms like Facebook and Instagram.
              </p>
            </div>

            {/* Managing Cookies */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h2>Managing Cookies</h2>
              </div>
              <p>You can control cookies through your browser settings:</p>
              <ul className="policy-list">
                <li>View and delete stored cookies</li>
                <li>Block cookies from specific websites</li>
                <li>Set preferences for different cookie types</li>
                <li>Clear cookies when closing the browser</li>
              </ul>
              <div className="policy-info-box">
                <h4>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Note
                </h4>
                <p>Disabling essential cookies may prevent you from adding items to cart, logging in, or completing purchases.</p>
              </div>
            </div>

            {/* Contact Box */}
            <div className="policy-contact-box">
              <h3>Questions About Cookies?</h3>
              <p>Our team is here to help</p>
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
