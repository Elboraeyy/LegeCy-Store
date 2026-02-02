"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function CookiesClient() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const c = t.policies.cookies;
  const common = t.policies.common;

  return (
    <main className="policy-page" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <section className="policy-hero">
        <div className="container">
          <div className="policy-hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10c0-.34-.017-.676-.05-1.008a7.994 7.994 0 01-3.95.008 4 4 0 01-5.95-5.95 7.994 7.994 0 01.008-3.95A10.042 10.042 0 0012 2z" />
            </svg>
          </div>
          <h1>{c.title}</h1>
          <p>{c.subtitle}</p>
          <div className="last-updated">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {common.last_updated.replace('{date}', isRTL ? '٤ يناير ٢٠٢٦' : 'January 4, 2026')}
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
                <h2>{c.sections.what.title}</h2>
              </div>
              <p>{c.sections.what.content}</p>
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
                <h2>{c.sections.how.title}</h2>
              </div>
              <p>{c.sections.how.content}</p>
            </div>

            {/* Managing Cookies */}
            <div className="policy-section">
              <div className="policy-section-header">
                <div className="policy-section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h2>{c.sections.manage.title}</h2>
              </div>
              <p>{c.sections.manage.content}</p>
            </div>

            {/* Contact Box */}
            <div className="policy-contact-box">
              <h3>{common.contact_title}</h3>
              <p>{common.contact_desc}</p>
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
