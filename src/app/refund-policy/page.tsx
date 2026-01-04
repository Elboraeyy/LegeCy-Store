import { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'Refund Policy | LegaCy',
  description: 'Return and refund policy for LegaCy purchases',
};

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <h1 className="text-3xl font-bold mb-8">Refund Policy</h1>
        
        <p><strong>Last Updated:</strong> January 4, 2026</p>
        
        <section style={{ marginTop: '32px' }}>
          <h2>Return Window</h2>
          <p>
            You may request a return within <strong>14 days</strong> of receiving your order. 
            Items must be unused, in original packaging, with all tags attached.
          </p>
        </section>

        <section style={{ marginTop: '32px' }}>
          <h2>Non-Returnable Items</h2>
          <ul style={{ marginLeft: '20px', marginTop: '16px' }}>
            <li>Personalized or custom items</li>
            <li>Intimate apparel and swimwear</li>
            <li>Items marked as final sale</li>
            <li>Products with damaged packaging due to customer handling</li>
          </ul>
        </section>

        <section style={{ marginTop: '32px' }}>
          <h2>How to Return</h2>
          <ol style={{ marginLeft: '20px', marginTop: '16px' }}>
            <li>Log into your account and go to Order History</li>
            <li>Select the order and click &quot;Request Return&quot;</li>
            <li>Provide reason and photos if applicable</li>
            <li>Wait for approval email with instructions</li>
            <li>Ship item back using provided label (if applicable)</li>
          </ol>
        </section>

        <section style={{ marginTop: '32px' }}>
          <h2>Refund Processing</h2>
          <p>
            <strong>Online Payments:</strong> Refunded to original payment method within 5-10 business days.
          </p>
          <p style={{ marginTop: '8px' }}>
            <strong>Cash on Delivery:</strong> Refund via bank transfer after providing account details.
          </p>
        </section>

        <section style={{ marginTop: '32px' }}>
          <h2>Exchanges</h2>
          <p>
            We don&apos;t process direct exchanges. Please return your item and place a new order.
          </p>
        </section>

        <section style={{ marginTop: '32px' }}>
          <h2>Damaged or Wrong Items</h2>
          <p>
            Contact us within 48 hours of delivery with photos. We&apos;ll arrange replacement 
            or refund at no cost to you.
          </p>
        </section>

        <section style={{ marginTop: '32px' }}>
          <h2>Contact</h2>
          <p>
            Return inquiries: <strong>returns@legacy.com</strong>
          </p>
        </section>
      </div>
    </main>
  );
}
