'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function RefundPolicyPage() {
  const { t, language } = useLanguage();
  const isRtl = language === 'ar';

  return (
    <main className={`policy-page ${isRtl ? 'rtl' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <section className="policy-hero">
        <div className="container">
          <div className="policy-hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
            </svg>
          </div>
          <h1>{t.policy_pages.refund.title}</h1>
          <p>{t.policy_pages.refund.subtitle}</p>
          <div className="last-updated">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {t.policy_pages.last_updated}
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
                <h2>{t.policy_pages.refund.return_window.title}</h2>
              </div>
              <p>{t.policy_pages.refund.return_window.content}</p>
            </div>

            {/* Non-Returnable Items */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <h2>{t.policy_pages.refund.non_returnable.title}</h2>
              </div>
              <p>{t.policy_pages.refund.non_returnable.content}</p>
              <ul className="policy-list">
                {t.policy_pages.refund.non_returnable.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
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
                <h2>{t.policy_pages.refund.how_to.title}</h2>
              </div>
              <p>{t.policy_pages.refund.how_to.content}</p>
              <ol className="policy-list numbered">
                {t.policy_pages.refund.how_to.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
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
                <h2>{t.policy_pages.refund.processing.title}</h2>
              </div>
              <p><strong>{language === 'ar' ? 'الدفع الأونلاين:' : 'Online Payments:'}</strong> {t.policy_pages.refund.processing.online.replace('Online Payments:', '').replace('الدفع الأونلاين:', '')}</p>
              <p><strong>{language === 'ar' ? 'الدفع عند الاستلام:' : 'Cash on Delivery:'}</strong> {t.policy_pages.refund.processing.cod.replace('Cash on Delivery:', '').replace('الدفع عند الاستلام:', '')}</p>
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
                <h2>{t.policy_pages.refund.product_returns.title}</h2>
              </div>
              <p>{t.policy_pages.refund.product_returns.content}</p>
            </div>

            {/* Damaged or Wrong Items */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2>{t.policy_pages.refund.damaged.title}</h2>
              </div>
              <p>{t.policy_pages.refund.damaged.content}</p>
              <div className="policy-info-box">
                <h4>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t.policy_pages.refund.damaged.important}
                </h4>
                <p>{t.policy_pages.refund.damaged.important_text}</p>
              </div>
            </div>

            {/* Contact Box */}
            <div className="policy-contact-box">
              <h3>{t.policy_pages.refund.contact.title}</h3>
              <p>{t.policy_pages.refund.contact.subtitle}</p>
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
