"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/context/StoreContext";
import CustomSelect from "@/components/ui/CustomSelect";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // Shipping & Delivery
  {
    category: "Shipping & Delivery",
    question: "What is the delivery time?",
    answer: "We deliver orders within 2-5 business days in Cairo and Giza, and 5-7 business days for other governorates. You will receive a tracking number as soon as your order leaves our warehouse."
  },
  {
    category: "Shipping & Delivery",
    question: "Is shipping free?",
    answer: "Yes! Shipping is free on all orders within Egypt. There are no hidden or additional fees."
  },
  {
    category: "Shipping & Delivery",
    question: "Can I track my shipment?",
    answer: "Absolutely! After your order is shipped, you will receive an email with the tracking number and a link to track your shipment."
  },
  // Payment
  {
    category: "Payment",
    question: "What payment methods are available?",
    answer: "We accept Cash on Delivery (COD), bank cards (Visa/Mastercard), and mobile wallets (Vodafone Cash, Orange Cash, Etisalat Cash)."
  },
  {
    category: "Payment",
    question: "Is payment secure?",
    answer: "Yes, we use the latest encryption technologies and the certified Paymob gateway to ensure the security of all your financial transactions."
  },
  {
    category: "Payment",
    question: "Can I pay in installments?",
    answer: "Currently, we do not offer installment payment, but we are working on adding this feature soon."
  },
  // Returns & Exchange
  {
    category: "Returns & Exchange",
    question: "What is the return policy?",
    answer: "You can return the product within 14 days of receipt, provided it is in its original condition with all accessories and packaging."
  },
  {
    category: "Returns & Exchange",
    question: "How do I request a return or exchange?",
    answer: "You can contact us through the 'My Orders' page in your account, or contact customer service and we will arrange the return process."
  },
  {
    category: "Returns & Exchange",
    question: "When will I receive the refund?",
    answer: "After receiving and inspecting the product, the refund will be processed within 5-7 business days to the original payment method."
  },
  // Products
  {
    category: "Products",
    question: "Are the products authentic?",
    answer: "Yes! All our watches are 100% authentic and imported from authorized dealers. We provide a certificate of authenticity with every watch."
  },
  {
    category: "Products",
    question: "What is the warranty period?",
    answer: "We offer a one-year warranty on all watches against manufacturing defects. The warranty does not cover misuse or breakage."
  },
  {
    category: "Products",
    question: "Can I try the watch before purchasing?",
    answer: "You can inspect the watch upon delivery before payment (in case of Cash on Delivery). If it doesn't suit you, you can refuse the delivery."
  },
  // Account & Orders
  {
    category: "Account & Orders",
    question: "How do I create an account?",
    answer: "Click on 'Sign Up' at the top of the page, enter your details and create a password. You can also sign up with your Google account."
  },
  {
    category: "Account & Orders",
    question: "I forgot my password, what should I do?",
    answer: "Click on 'Forgot Password' on the login page, enter your email and you will receive a message to reset your password."
  },
  {
    category: "Account & Orders",
    question: "How do I track my order status?",
    answer: "Log in to your account, go to 'My Orders' and you will find all your orders with the status of each order."
  },
];

const categories = ["All", "Shipping & Delivery", "Payment", "Returns & Exchange", "Products", "Account & Orders"];

export default function HelpSupportClient() {
  const { showToast } = useStore();
  const [activeCategory, setActiveCategory] = useState("All");
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"faq" | "contact">("faq");
  const [subject, setSubject] = useState("");

  const filteredFAQs = activeCategory === "All" 
    ? faqData 
    : faqData.filter(item => item.category === activeCategory);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    
    if (showToast) {
      showToast("Message sent successfully! We'll get back to you soon.", "success");
    }
    form.reset();
    setSubject("");
  };

  return (
    <main className="help-support-page">
      {/* Hero Section */}
      <section className="help-hero">
        <div className="container">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Help & Support
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Find answers to common questions or get in touch with our team
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
              FAQ
            </button>
            <button 
              className={`help-main-tab ${activeTab === "contact" ? "active" : ""}`}
              onClick={() => setActiveTab("contact")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Contact Us
            </button>
          </motion.div>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {activeTab === "faq" ? (
          <motion.div
            key="faq"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
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
                {filteredFAQs.map((item, index) => (
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
                      <span>{item.question}</span>
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
                          <p>{item.answer}</p>
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
                <h3>Still have questions?</h3>
                <p>Our support team is ready to help you with any inquiries</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveTab("contact")}
                >
                  Contact Support
                </button>
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="contact"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
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
                    <h4>Email Us</h4>
                    <p>Drop us a line anytime</p>
                    <a href="mailto:support@legacy.store" className="contact-link">support@legacy.store</a>
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
                    <h4>Call Us</h4>
                    <p>Mon-Sat, 10am - 10pm</p>
                    <a href="tel:+201279342177" className="contact-link">+20 127 934 2177</a>
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
                    <h4>Visit Us</h4>
                    <p>Our showroom location</p>
                    <span className="contact-address">Cairo, Egypt</span>
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
                    <h3>Send us a Message</h3>
                    <p>We typically respond within 24 hours</p>
                  </div>
                  <form id="contact-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="name">Your Name</label>
                        <input
                          id="name"
                          type="text"
                          name="name"
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                          id="email"
                          type="email"
                          name="email"
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="subject">Subject</label>
                      <CustomSelect
                        name="subject"
                        value={subject}
                        onChange={setSubject}
                        placeholder="Select a topic"
                        required
                        options={[
                          { value: "order", label: "Order Inquiry" },
                          { value: "product", label: "Product Question" },
                          { value: "return", label: "Returns & Refunds" },
                          { value: "shipping", label: "Shipping Issue" },
                          { value: "other", label: "Other" },
                        ]}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="message">Message</label>
                      <textarea
                        id="message"
                        name="message"
                        placeholder="How can we help you today?"
                        rows={5}
                        required
                      ></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary btn-block">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                      Send Message
                    </button>
                  </form>
                </motion.div>
              </div>
            </section>

            {/* Quick FAQ Links */}
            <section className="quick-help container">
              <div className="quick-help-header">
                <h3>Quick Answers</h3>
                <p>Check these common questions before reaching out</p>
              </div>
              <div className="quick-help-grid">
                {faqData.slice(0, 4).map((item, index) => (
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
                    <span className="quick-help-q">Q:</span>
                    <span>{item.question}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  View All FAQs
                </button>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
