import { Metadata } from 'next';
import styles from '../page.module.css';

export const metadata: Metadata = {
  title: 'Cookie Policy | LegaCy',
  description: 'How LegaCy uses cookies and similar technologies',
};

export default function CookiePolicyPage() {
  return (
    <main className={styles.legal}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ marginBottom: '32px' }}>Cookie Policy</h1>
        
        <p><strong>Last Updated:</strong> January 4, 2026</p>
        
        <section style={{ marginTop: '32px' }}>
          <h2>What Are Cookies?</h2>
          <p>
            Cookies are small text files stored on your device when you visit our website. 
            They help us provide a better user experience.
          </p>
        </section>

        <section style={{ marginTop: '32px' }}>
          <h2>How We Use Cookies</h2>
          
          <h3 style={{ marginTop: '16px' }}>Essential Cookies</h3>
          <p>Required for basic functionality: login sessions, shopping cart, security.</p>
          
          <h3 style={{ marginTop: '16px' }}>Analytics Cookies</h3>
          <p>Help us understand how visitors use our site to improve performance.</p>
          
          <h3 style={{ marginTop: '16px' }}>Preference Cookies</h3>
          <p>Remember your settings like language and display preferences.</p>
        </section>

        <section style={{ marginTop: '32px' }}>
          <h2>Managing Cookies</h2>
          <p>
            You can control cookies through your browser settings. Disabling essential 
            cookies may affect site functionality.
          </p>
        </section>

        <section style={{ marginTop: '32px' }}>
          <h2>Third-Party Cookies</h2>
          <p>
            We use services like Google Analytics and Facebook Pixel that may set their 
            own cookies. Refer to their privacy policies for more information.
          </p>
        </section>

        <section style={{ marginTop: '32px' }}>
          <h2>Contact</h2>
          <p>
            Questions? Email <strong>privacy@legacy.com</strong>.
          </p>
        </section>
      </div>
    </main>
  );
}
