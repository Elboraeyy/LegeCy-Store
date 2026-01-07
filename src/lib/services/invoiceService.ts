'use server';

import prisma from '@/lib/prisma';
import { format } from 'date-fns';

/**
 * Invoice Service
 * 
 * Generates HTML invoices for orders.
 */

export interface InvoiceData {
  orderId: string;
  invoiceNumber: string;
  date: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  };
  items: Array<{
    name: string;
    sku?: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  discount?: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  status: string;
}

/**
 * Generate invoice data from order ID
 */
export async function getInvoiceData(orderId: string): Promise<InvoiceData | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      coupon: true,
    },
  });

  if (!order) return null;

  const subtotal = order.items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const discount = order.coupon
    ? subtotal - Number(order.totalPrice)
    : 0;

  return {
    orderId: order.id,
    invoiceNumber: `INV-${order.id.slice(0, 8).toUpperCase()}`,
    date: format(order.createdAt, 'MMMM dd, yyyy'),
    customer: {
      name: order.customerName || 'Guest',
      email: order.customerEmail || '',
      phone: order.customerPhone || '',
      address: order.shippingAddress || '',
      city: order.shippingCity || '',
    },
    items: order.items.map((item) => ({
      name: item.name,
      sku: item.sku || undefined,
      quantity: item.quantity,
      price: Number(item.price),
      total: Number(item.price) * item.quantity,
    })),
    subtotal,
    discount: discount > 0 ? discount : undefined,
    shipping: 0, // Free shipping
    total: Number(order.totalPrice),
    paymentMethod: order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment',
    status: order.status,
  };
}

/**
 * Generate HTML invoice
 */
export async function generateInvoiceHtml(orderId: string): Promise<string | null> {
  const data = await getInvoiceData(orderId);
  if (!data) return null;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${data.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1f2937; background: #f9fafb; }
    .invoice { max-width: 800px; margin: 40px auto; background: white; padding: 48px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; padding-bottom: 24px; border-bottom: 2px solid #12403C; }
    .logo { font-size: 32px; font-weight: 700; color: #12403C; letter-spacing: -1px; }
    .invoice-info { text-align: right; }
    .invoice-info h2 { font-size: 24px; color: #12403C; margin-bottom: 8px; }
    .invoice-info p { color: #6b7280; font-size: 14px; }
    .addresses { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-bottom: 48px; }
    .address h3 { color: #12403C; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
    .address p { color: #4b5563; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    th { text-align: left; padding: 16px; background: #12403C; color: white; font-weight: 600; }
    th:last-child, td:last-child { text-align: right; }
    td { padding: 16px; border-bottom: 1px solid #e5e7eb; }
    .totals { margin-left: auto; width: 300px; }
    .totals tr td { padding: 8px 0; }
    .totals tr:last-child { font-weight: 700; font-size: 18px; border-top: 2px solid #12403C; padding-top: 16px; }
    .totals tr:last-child td { padding-top: 16px; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 14px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .status.paid { background: #dcfce7; color: #166534; }
    .status.pending { background: #fef3c7; color: #92400e; }
    .status.shipped { background: #dbeafe; color: #1e40af; }
    .status.delivered { background: #d1fae5; color: #065f46; }
    @media print {
      body { background: white; }
      .invoice { box-shadow: none; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="logo">LegaCy</div>
      <div class="invoice-info">
        <h2>INVOICE</h2>
        <p><strong>${data.invoiceNumber}</strong></p>
        <p>Date: ${data.date}</p>
        <p style="margin-top: 8px;"><span class="status ${data.status}">${data.status}</span></p>
      </div>
    </div>

    <div class="addresses">
      <div class="address">
        <h3>Bill To</h3>
        <p><strong>${data.customer.name}</strong></p>
        <p>${data.customer.address}</p>
        <p>${data.customer.city}</p>
        <p>${data.customer.phone}</p>
        <p>${data.customer.email}</p>
      </div>
      <div class="address">
        <h3>Payment Method</h3>
        <p>${data.paymentMethod}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>SKU</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.sku || '-'}</td>
            <td>${item.quantity}</td>
            <td>EGP ${item.price.toLocaleString()}</td>
            <td>EGP ${item.total.toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <table class="totals">
      <tr>
        <td>Subtotal</td>
        <td>EGP ${data.subtotal.toLocaleString()}</td>
      </tr>
      ${data.discount ? `
      <tr>
        <td>Discount</td>
        <td style="color: #16a34a;">-EGP ${data.discount.toLocaleString()}</td>
      </tr>
      ` : ''}
      <tr>
        <td>Shipping</td>
        <td>${data.shipping === 0 ? 'Free' : `EGP ${data.shipping.toLocaleString()}`}</td>
      </tr>
      <tr>
        <td>Total</td>
        <td style="color: #12403C;">EGP ${data.total.toLocaleString()}</td>
      </tr>
    </table>

    <div class="footer">
      <p>Thank you for shopping with LegaCy!</p>
      <p style="margin-top: 8px;">Questions? Contact us at info@legecy.store</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
