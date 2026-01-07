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
          <p>Fast delivery from Samanoud to all of Egypt</p>
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
            
            {/* Our Location */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2>Our Location</h2>
              </div>
              <p>
                LegaCy ships from our headquarters in <strong>Samanoud, Gharbia Governorate</strong>. 
                All orders are carefully prepared and shipped directly to your doorstep across Egypt.
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
              <p>Estimated delivery times based on distance from Samanoud:</p>
              <table className="policy-table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Estimated Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Gharbia &amp; Dakahlia</td>
                    <td>1-2 business days</td>
                  </tr>
                  <tr>
                    <td>Sharqia, Kafr El-Sheikh &amp; Monufia</td>
                    <td>2-3 business days</td>
                  </tr>
                  <tr>
                    <td>Cairo, Giza &amp; Alexandria</td>
                    <td>2-4 business days</td>
                  </tr>
                  <tr>
                    <td>Other Delta Governorates</td>
                    <td>3-4 business days</td>
                  </tr>
                  <tr>
                    <td>Upper Egypt (Beni Suef to Assiut)</td>
                    <td>4-5 business days</td>
                  </tr>
                  <tr>
                    <td>Upper Egypt (Sohag to Aswan)</td>
                    <td>5-7 business days</td>
                  </tr>
                  <tr>
                    <td>Red Sea, Sinai &amp; Remote Areas</td>
                    <td>6-8 business days</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Free Shipping */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h2>Free Shipping</h2>
              </div>
              <div className="policy-info-box">
                <h4>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Gharbia &amp; Dakahlia Special
                </h4>
                <p>Enjoy <strong>FREE shipping</strong> on all orders above <strong>1,500 EGP</strong> to Gharbia and Dakahlia governorates!</p>
              </div>
              <p>
                For other governorates, shipping fees are calculated at checkout based on your location 
                and order weight.
              </p>
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
                Every order is carefully packaged at our Samanoud facility to ensure your watches, 
                wallets, and accessories arrive in perfect condition:
              </p>
              <ul className="policy-list">
                <li>Protective boxes for watches with cushioning</li>
                <li>Dust bags for leather goods</li>
                <li>Sealed packaging for perfumes</li>
                <li>Discreet outer packaging for privacy</li>
              </ul>
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
                Once your order ships from Samanoud, you&apos;ll receive an SMS and email with tracking 
                information. Track your package in real-time through your account or the courier&apos;s website.
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
              <p>Our team in Samanoud is here to help</p>
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
