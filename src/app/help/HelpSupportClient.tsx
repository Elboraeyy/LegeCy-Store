"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/context/StoreContext";
import CustomSelect from "@/components/ui/CustomSelect";
import { useLanguage } from "@/context/LanguageContext";

export default function HelpSupportClient() {
  const { showToast } = useStore();
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("All");
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"faq" | "contact">("contact");
  const [subject, setSubject] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Get categories from dictionary
  const categories = [
    t.help.faq.categories.all,
    t.help.faq.categories.shipping,
    t.help.faq.categories.payment,
    t.help.faq.categories.returns,
    t.help.faq.categories.products,
    t.help.faq.categories.account,
  ];

  // Get FAQs from dictionary
  const faqData = t.help.faq.questions || [];

  // Sync category when language changes
  React.useEffect(() => {
    setActiveCategory(t.help.faq.categories.all);
  }, [language, t.help.faq.categories.all]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const filteredFAQs = activeCategory === t.help.faq.categories.all 
    ? faqData 
    : faqData.filter((item: any) => item.cat === activeCategory);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    if (subject) formData.append("subject", subject);

    try {
      const { submitContactForm } = await import("@/lib/actions/contact");
      const result = await submitContactForm(null, formData);

      if (result.success) {
        if (showToast) showToast(result.message, "success");
        form.reset();
        setSubject("");
        setSelectedFile(null);
      } else {
        if (showToast) showToast(result.message, "danger");
      }
    } catch {
      if (showToast) showToast(language === 'ar' ? "فشل إرسال الرسالة" : "Failed to send message", "danger");
    }
  };

  // Get subject options from dictionary
  const subjectOptions = Object.entries(t.help.contact.subjects).map(([value, label]) => ({
    value,
    label: label as string
  }));

  return (
    <main className="help-support-page" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <section className="help-hero">
        <div className="container">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {t.help.hero.title}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {t.help.hero.subtitle}
          </motion.p>

          {/* Main Tab Switcher */}
          <motion.div 
            className="help-main-tabs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <button 
              className={`help-main-tab ${activeTab === "faq" ? "active" : ""}`}
              onClick={() => setActiveTab("faq")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              {t.help.tabs.faq}
            </button>
            <button 
              className={`help-main-tab ${activeTab === "contact" ? "active" : ""}`}
              onClick={() => setActiveTab("contact")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {t.help.tabs.contact}
            </button>
          </motion.div>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {activeTab === "faq" ? (
          <motion.div
            key="faq"
            initial={{ opacity: 0, x: language === 'ar' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: language === 'ar' ? -20 : 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Category Tabs */}
            <section className="faq-categories container">
              <div className="faq-tabs">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`faq-tab ${activeCategory === category ? 'active' : ''}`}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </section>

            {/* FAQ Items */}
            <section className="faq-content container">
              <div className="faq-list">
                {filteredFAQs.map((item: any, index: number) => (
                  <motion.div 
                    key={index}
                    className="faq-item"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <button 
                      className={`faq-question ${openItems.includes(index) ? 'open' : ''}`}
                      onClick={() => toggleItem(index)}
                    >
                      <span>{item.q}</span>
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        className="faq-icon"
                      >
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </button>
                    <AnimatePresence>
                      {openItems.includes(index) && (
                        <motion.div
                          className="faq-answer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <p>{item.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Still need help CTA */}
            <section className="help-cta container">
              <div className="help-cta-box">
                <div className="help-cta-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <h3>{t.help.faq.cta.title}</h3>
                <p>{t.help.faq.cta.subtitle}</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveTab("contact")}
                >
                  {t.help.faq.cta.btn}
                </button>
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="contact"
              initial={{ opacity: 0, x: language === 'ar' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: language === 'ar' ? 20 : -20 }}
            transition={{ duration: 0.3 }}
          >
            <section className="contact-section container">
              <div className="contact-grid">
                {/* Contact Info Cards */}
                <div className="contact-info-section">
                  <motion.div 
                    className="contact-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="contact-card-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                      <h4>{t.help.contact.info.email.title}</h4>
                      <p>{t.help.contact.info.email.desc}</p>
                    <a href="mailto:info@legecy.store" className="contact-link">info@legecy.store</a>
                  </motion.div>

                  <motion.div 
                    className="contact-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="contact-card-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                    </div>
                      <h4>{t.help.contact.info.call.title}</h4>
                      <p>{t.help.contact.info.call.desc}</p>
                      <a href="tel:+201515205073" className="contact-link">+20 151 520 5073</a>
                  </motion.div>

                  <motion.div 
                    className="contact-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="contact-card-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    </div>
                      <h4>{t.help.contact.info.visit.title}</h4>
                      <p>{t.help.contact.info.visit.desc}</p>
                      <span className="contact-address">{language === 'ar' ? 'سمنود، الغربية، مصر' : 'Samanoud, Gharbia, Egypt'}</span>
                  </motion.div>
                </div>

                {/* Contact Form */}
                <motion.div 
                  className="contact-form-section"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="contact-form-header">
                      <h3>{t.help.contact.title}</h3>
                      <p>{t.help.contact.subtitle}</p>
                  </div>
                    <form id="contact-form" onSubmit={handleFormSubmit}>
                    <div className="form-row">
                      <div className="form-group">
                          <label htmlFor="name">{t.help.contact.form.name}</label>
                        <input
                          id="name"
                          type="text"
                          name="name"
                            placeholder={t.help.contact.form.name_placeholder}
                          required
                        />
                      </div>
                      <div className="form-group">
                          <label htmlFor="email">{t.help.contact.form.email}</label>
                        <input
                          id="email"
                          type="email"
                          name="email"
                            placeholder={t.help.contact.form.email_placeholder}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="subject">{t.help.contact.form.subject}</label>
                        <CustomSelect
                          name="subject"
                          value={subject}
                          onChange={setSubject}
                          placeholder={t.help.contact.form.subject_placeholder}
                          required
                          options={subjectOptions}
                        />
                        <input type="hidden" name="subject" value={subject} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="message">{t.help.contact.form.message}</label>
                      <textarea
                        id="message"
                        name="message"
                          placeholder={t.help.contact.form.message_placeholder}
                        rows={5}
                        required
                      ></textarea>
                    </div>

                      <div className="form-group">
                        <label htmlFor="attachment">{t.help.contact.form.attachment}</label>
                        <div className="file-upload-wrapper">
                          <input
                            type="file"
                            id="attachment"
                            name="attachment"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="file-input"
                            style={{ display: 'none' }}
                          />
                          <button
                            type="button"
                            className="file-upload-btn"
                            onClick={() => document.getElementById('attachment')?.click()}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                            </svg>
                            {selectedFile ? selectedFile.name : t.help.contact.form.upload_image}
                          </button>
                          {selectedFile && (
                            <button
                              type="button"
                              className="remove-file-btn"
                              onClick={() => {
                                setSelectedFile(null);
                                const input = document.getElementById('attachment') as HTMLInputElement;
                                if (input) input.value = '';
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    <button type="submit" className="btn btn-primary btn-block">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                        {t.help.contact.form.submit}
                    </button>
                  </form>
                </motion.div>
              </div>
            </section>

            {/* Quick FAQ Links */}
            <section className="quick-help container">
              <div className="quick-help-header">
                  <h3>{t.help.faq.quick.title}</h3>
                  <p>{t.help.faq.quick.subtitle}</p>
              </div>
              <div className="quick-help-grid">
                  {faqData.slice(0, 4).map((item: any, index: number) => (
                  <motion.div 
                    key={index}
                    className="quick-help-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    onClick={() => {
                      setActiveTab("faq");
                      setOpenItems([index]);
                    }}
                  >
                      <span className="quick-help-q">{language === 'ar' ? 'س:' : 'Q:'}</span>
                      <span>{item.q}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: language === 'ar' ? 'rotate(180deg)' : 'none' }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </motion.div>
                ))}
              </div>
              <div className="quick-help-more">
                <button 
                  className="btn btn-outline"
                  onClick={() => setActiveTab("faq")}
                >
                    {t.help.faq.quick.view_all}
                </button>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
