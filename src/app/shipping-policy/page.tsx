import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Policy | LegaCy',
  description: 'Shipping options and delivery times for LegaCy - Premium Men\'s Accessories',
};

export default function ShippingPolicyPage() {
  return (
    <main className="policy-page">
      {/* Hero Section */}
      <section className="policy-hero">
        <div className="container">
          <div className="policy-hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h1>Shipping Policy</h1>
          <p>Fast and secure delivery across Egypt</p>
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
            
            {/* Delivery Areas */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2>Delivery Areas</h2>
              </div>
              <p>
                We deliver to all governorates across Egypt. Whether you&apos;re in Cairo, Alexandria, 
                the Delta, or Upper Egypt, your premium watches and accessories will reach you safely.
              </p>
            </div>

            {/* Delivery Times */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2>Delivery Times</h2>
              </div>
              <p>Estimated delivery times based on your location:</p>
              <table className="policy-table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Estimated Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Cairo &amp; Giza</td>
                    <td>1-3 business days</td>
                  </tr>
                  <tr>
                    <td>Alexandria &amp; Delta</td>
                    <td>2-4 business days</td>
                  </tr>
                  <tr>
                    <td>Upper Egypt</td>
                    <td>3-5 business days</td>
                  </tr>
                  <tr>
                    <td>Remote Areas</td>
                    <td>5-7 business days</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Premium Packaging */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h2>Premium Packaging</h2>
              </div>
              <p>
                Every order is carefully packaged to ensure your watches, wallets, and accessories 
                arrive in perfect condition. Our packaging includes:
              </p>
              <ul className="policy-list">
                <li>Protective boxes for watches with cushioning</li>
                <li>Dust bags for leather goods</li>
                <li>Sealed packaging for perfumes</li>
                <li>Discreet outer packaging for privacy</li>
              </ul>
            </div>

            {/* Shipping Costs */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2>Shipping Costs</h2>
              </div>
              <p>
                Shipping is calculated at checkout based on your location and order total.
              </p>
              <div className="policy-info-box">
                <h4>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Free Shipping
                </h4>
                <p>Enjoy <strong>FREE shipping</strong> on all orders above <strong>500 EGP</strong> within Cairo and Giza!</p>
              </div>
            </div>

            {/* Order Tracking */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    <path d="M9 14l2 2 4-4" />
                  </svg>
                </div>
                <h2>Order Tracking</h2>
              </div>
              <p>
                Once your order ships, you&apos;ll receive an SMS and email with tracking information. 
                Track your watch, wallet, or accessories in real-time through your account dashboard 
                or the courier&apos;s website.
              </p>
            </div>

            {/* Cash on Delivery */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2>Cash on Delivery</h2>
              </div>
              <p>
                Pay when you receive your order. You can inspect the package before paying. 
                Please have the exact amount ready as couriers may not carry change.
              </p>
            </div>

            {/* Contact Box */}
            <div className="policy-contact-box">
              <h3>Questions About Your Delivery?</h3>
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
