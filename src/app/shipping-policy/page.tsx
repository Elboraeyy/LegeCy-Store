import { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'Shipping Policy | LegaCy',
  description: 'Shipping options, delivery times, and costs for LegaCy orders',
};

export default function ShippingPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <h1 className="text-3xl font-bold mb-8">Shipping Policy</h1>
        
        <p><strong>Last Updated:</strong> January 4, 2026</p>
        
        <section style={{ marginTop: '32px' }}>
          <h2>Delivery Areas</h2>
          <p>
            We deliver to all governorates in Egypt. Delivery to remote areas may take 
            additional time.
          </p>
        </section>

        <section style={{ marginTop: '32px' }}>
          <h2>Delivery Times</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '12px' }}>Location</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Estimated Time</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>Cairo & Giza</td>
                <td style={{ padding: '12px' }}>1-3 business days</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>Alexandria & Delta</td>
                <td style={{ padding: '12px' }}>2-4 business days</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>Upper Egypt</td>
                <td style={{ padding: '12px' }}>3-5 business days</td>
              </tr>
              <tr>
                <td style={{ padding: '12px' }}>Remote Areas</td>
                <td style={{ padding: '12px' }}>5-7 business days</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section style={{ marginTop: '32px' }}>
          <h2>Shipping Costs</h2>
          <p>
            Shipping is calculated at checkout based on your location and order total. 
            Free shipping may apply for orders over a certain amount.
          </p>
        </section>

        <section style={{ marginTop: '32px' }}>
          <h2>Order Tracking</h2>
          <p>
            Once shipped, you&apos;ll receive an email with tracking information. You can also 
            track your order from your account dashboard.
          </p>
        </section>

        <section style={{ marginTop: '32px' }}>
          <h2>Failed Delivery Attempts</h2>
          <p>
            After 3 failed delivery attempts, your order will be returned to us. Contact 
            customer service to arrange redelivery.
          </p>
        </section>

        <section style={{ marginTop: '32px' }}>
          <h2>Contact</h2>
          <p>
            Shipping inquiries: <strong>shipping@legacy.com</strong>
          </p>
        </section>
      </div>
    </main>
  );
}
