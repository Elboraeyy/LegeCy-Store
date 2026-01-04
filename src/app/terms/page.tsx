import { Metadata } from 'next';
import styles from '../page.module.css';

export const metadata: Metadata = {
  title: 'Terms of Service | LegaCy',
  description: 'Terms and conditions for using LegaCy e-commerce platform',
};

export default function TermsOfServicePage() {
  return (
    <main className={styles.legal}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ marginBottom: '32px' }}>Terms of Service</h1>
        
        <p><strong>Last Updated:</strong> January 4, 2026</p>
        
        <section style={{ marginTop: '32px' }}>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using LegaCy (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), you agree to be bound by these 
            Terms of Service. If you do not agree to all terms, please do not use our services.
          </p>
        </section>

        <section style={{ marginTop: '32px' }}>
          <h2>2. Account Registration</h2>
          <p>
            You may browse without registering, but purchasing requires an account. You are 
            responsible for maintaining account security and all activities under your account.
          </p>
        </section>

        <section style={{ marginTop: '32px' }}>
          <h2>3. Products and Pricing</h2>
          <p>
            All prices are in Egyptian Pounds (EGP) and include applicable taxes unless stated. 
            We reserve the right to modify prices. Orders are subject to availability.
          </p>
        </section>

        <section style={{ marginTop: '32px' }}>
          <h2>4. Payment</h2>
          <p>
            We accept cash on delivery (COD) and online payments via Paymob. Payment must be 
            completed before order processing for online payments.
          </p>
        </section>

        <section style={{ marginTop: '32px' }}>
          <h2>5. Shipping</h2>
          <p>
            Delivery times are estimates. We are not liable for delays beyond our control. 
            Risk passes to you upon delivery.
          </p>
        </section>

        <section style={{ marginTop: '32px' }}>
          <h2>6. Returns and Refunds</h2>
          <p>
            See our <a href="/refund-policy">Refund Policy</a> for details. Returns must be 
            initiated within 14 days of delivery.
          </p>
        </section>

        <section style={{ marginTop: '32px' }}>
          <h2>7. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, LegaCy shall not be liable for indirect, 
            incidental, or consequential damages arising from use of our services.
          </p>
        </section>

        <section style={{ marginTop: '32px' }}>
          <h2>8. Governing Law</h2>
          <p>
            These terms are governed by the laws of the Arab Republic of Egypt. Disputes shall 
            be resolved in the courts of Cairo.
          </p>
        </section>

        <section style={{ marginTop: '32px' }}>
          <h2>9. Contact</h2>
          <p>
            For questions about these terms, contact us at <strong>legal@legacy.com</strong>.
          </p>
        </section>
      </div>
    </main>
  );
}
