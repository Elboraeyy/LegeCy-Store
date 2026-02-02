"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function DataDeletionClient() {
    const { t, language } = useLanguage();
    const isRTL = language === 'ar';
    const d = t.policies.data_deletion;
    const common = t.policies.common;

    return (
        <main className="policy-page" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Hero Section */}
            <section className="policy-hero">
                <div className="container">
                    <div className="policy-hero-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <h1>{d.title}</h1>
                    <p>{d.subtitle}</p>
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

                        {/* Introduction */}
                        <div className="policy-section">
                            <div className="policy-section-header">
                                <div className="policy-section-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2>{isRTL ? 'بياناتك، تحكمك' : 'Your Data, Your Control'}</h2>
                            </div>
                            <p>{d.intro}</p>
                        </div>

                        {/* Facebook App Removal */}
                        <div className="policy-section">
                            <div className="policy-section-header">
                                <div className="policy-section-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                                    </svg>
                                </div>
                                <h2>{d.facebook.title}</h2>
                            </div>
                            <p>{d.facebook.content}</p>
                        </div>

                        {/* Complete Account Deletion */}
                        <div className="policy-section">
                            <div className="policy-section-header">
                                <div className="policy-section-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <h2>{d.account.title}</h2>
                            </div>
                            <p>{d.account.content}</p>
                            <div className="policy-info-box">
                                <h4>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {isRTL ? 'راسلنا' : 'Email Us'}
                                </h4>
                                <span className="highlight-email">info@legecy.store</span>
                            </div>
                        </div>

                        {/* What Gets Deleted */}
                        <div className="policy-section">
                            <div className="policy-section-header">
                                <div className="policy-section-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </div>
                                <h2>{d.what_deleted.title}</h2>
                            </div>
                            <p>{d.what_deleted.content}</p>
                        </div>

                        {/* Timeline */}
                        <div className="policy-section">
                            <div className="policy-section-header">
                                <div className="policy-section-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2>{d.processing.title}</h2>
                            </div>
                            <p>{d.processing.content}</p>
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
