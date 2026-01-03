import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F6E5C6] py-12 px-4 sm:px-6 lg:px-8 font-sans text-[#12403C]">
      <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-sm p-8 rounded-lg shadow-sm border border-[#12403C]/10">
        <h1 className="text-3xl font-bold mb-8 border-b border-[#12403C]/20 pb-4">Privacy Policy</h1>
        
        <div className="space-y-6 text-lg leading-relaxed opacity-90">
          <p>Effective Date: January 1, 2026</p>

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p>Welcome to <strong>LegaCy</strong>. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Data We Collect</h2>
            <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data:</strong> includes email address and telephone number.</li>
              <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Data</h2>
            <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>To register you as a new customer.</li>
              <li>To process and deliver your order.</li>
              <li>To manage our relationship with you.</li>
              <li>To improve our website, products/services, marketing or customer relationships.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Facebook Data</h2>
            <p>If you choose to login via Facebook, we collect your name, email address, and profile picture to create your account and provide a personalized experience. We do not post to your Facebook timeline without your explicit permission.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Contact Us</h2>
            <p>If you have any questions about this privacy policy or our privacy practices, please contact us at: <a href="mailto:info@legecy.store" className="underline hover:text-[#D4AF37]">info@legecy.store</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
