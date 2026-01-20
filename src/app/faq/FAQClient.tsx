"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    answer: "We ship from Samanoud, Gharbia. Orders to Gharbia & Dakahlia arrive in 1-2 business days. Cairo, Giza & Alexandria take 2-4 days. Other areas take 3-7 days depending on distance. You will receive a tracking number as soon as your order ships."
  },
  {
    category: "Shipping & Delivery",
    question: "Is shipping free?",
    answer: "Free shipping is available for orders above 1,500 EGP to Gharbia and Dakahlia governorates. For other areas, shipping fees are calculated at checkout based on your location."
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
    answer: "Yes! All our products are 100% authentic and sourced from authorized dealers. We provide a certificate of authenticity where applicable."
  },
  {
    category: "Products",
    question: "What is the warranty period?",
    answer: "We offer a one-year warranty on all products against manufacturing defects. The warranty does not cover misuse or breakage."
  },
  {
    category: "Products",
    question: "Can I try the product before purchasing?",
    answer: "You can inspect the product upon delivery before payment (in case of Cash on Delivery). If it doesn't suit you, you can refuse the delivery."
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

export default function FAQClient() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [openItems, setOpenItems] = useState<number[]>([]);

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

  return (
    <main className="faq-page">
      {/* Hero Section */}
      <section className="faq-hero">
        <div className="container">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Frequently Asked Questions
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Answers to the most common questions about our store and products
          </motion.p>
        </div>
      </section>

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

      {/* Contact CTA */}
      <section className="faq-contact container">
        <div className="faq-contact-box">
          <h3>Didn&apos;t find an answer to your question?</h3>
          <p>Contact us and we&apos;ll get back to you as soon as possible</p>
          <a href="mailto:info@legecy.store" className="btn btn-primary">
            Contact Us
          </a>
        </div>
      </section>
    </main>
  );
}
