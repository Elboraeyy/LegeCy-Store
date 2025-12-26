import { Resend } from 'resend';
import { logger } from '@/lib/logger';

// Initialize Resend - will use RESEND_API_KEY from env
const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  shippingAddress: string;
}

const formatPrice = (price: number) => `EGP ${price.toLocaleString()}`;

export async function sendOrderConfirmationEmail(data: OrderConfirmationEmailData) {
  try {
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      logger.warn('RESEND_API_KEY not configured, skipping email');
      return { success: false, error: 'Email service not configured' };
    }

    const orderNumber = data.orderId.slice(0, 8).toUpperCase();
    
    const itemsHtml = data.items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.price * item.quantity)}</td>
      </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f3f0;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1a3c34, #2d5a4e); padding: 40px 30px; text-align: center;">
      <h1 style="color: #d4af37; margin: 0; font-size: 28px; letter-spacing: 2px;">LegeCy</h1>
      <p style="color: #a3b8b0; margin: 10px 0 0; font-size: 14px;">Luxury Timepieces</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      
      <!-- Success Icon -->
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 70px; height: 70px; background: #dcfce7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
          <span style="font-size: 32px;">✓</span>
        </div>
      </div>

      <h2 style="text-align: center; color: #1a3c34; margin: 0 0 10px; font-size: 24px;">
        Thank you for your order, ${data.customerName}!
      </h2>
      <p style="text-align: center; color: #666; margin: 0 0 30px;">
        Your order has been received and is being prepared for shipping
      </p>

      <!-- Order Number -->
      <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 30px;">
        <p style="color: #888; margin: 0 0 5px; font-size: 13px;">Order Number</p>
        <p style="color: #1a3c34; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 2px;">#${orderNumber}</p>
      </div>

      <!-- Order Items -->
      <h3 style="color: #1a3c34; margin: 0 0 15px; font-size: 18px;">Order Details</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 12px; text-align: left; font-weight: 600;">Product</th>
            <th style="padding: 12px; text-align: center; font-weight: 600;">Qty</th>
            <th style="padding: 12px; text-align: right; font-weight: 600;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Total -->
      <div style="background: #1a3c34; color: white; padding: 15px 20px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 16px;">Total</span>
        <span style="font-size: 22px; font-weight: bold; color: #d4af37;">${formatPrice(data.total)}</span>
      </div>

      <!-- Shipping Address -->
      <div style="margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 12px;">
        <h3 style="color: #1a3c34; margin: 0 0 10px; font-size: 16px;">📍 Shipping Address</h3>
        <p style="color: #666; margin: 0; line-height: 1.6;">${data.shippingAddress}</p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/track/${data.orderId}" 
           style="display: inline-block; background: #1a3c34; color: white; padding: 14px 40px; border-radius: 30px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Track Order
        </a>
      </div>

      <!-- Info -->
      <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 13px; line-height: 1.8; text-align: center;">
          🚚 Your order will be delivered within 3-5 business days<br>
          📞 For inquiries: Contact us on WhatsApp
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background: #f4f3f0; padding: 30px; text-align: center;">
      <p style="color: #888; margin: 0; font-size: 12px;">
        © ${new Date().getFullYear()} LegeCy Store. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
    `;

    const { data: emailData, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'LegeCy Store <onboarding@resend.dev>',
      to: data.customerEmail,
      subject: `Order Confirmation #${orderNumber} - LegeCy Store`,
      html: html,
    });

    if (error) {
      logger.error('Failed to send email', { error, orderId: data.orderId });
      return { success: false, error: error.message };
    }

    logger.info('Order confirmation email sent', { 
      orderId: data.orderId, 
      emailId: emailData?.id,
      to: data.customerEmail 
    });

    return { success: true, emailId: emailData?.id };

  } catch (error) {
    logger.error('Email service error', { error });
    return { success: false, error: 'Failed to send email' };
  }
}

// Password reset email
interface PasswordResetEmailData {
  email: string;
  resetToken: string;
  userName?: string;
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData) {
  try {
    if (!process.env.RESEND_API_KEY) {
      logger.warn('RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${data.resetToken}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f3f0;">
  <div style="max-width: 500px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    
    <div style="background: linear-gradient(135deg, #1a3c34, #2d5a4e); padding: 30px; text-align: center;">
      <h1 style="color: #d4af37; margin: 0; font-size: 24px;">LegeCy</h1>
    </div>

    <div style="padding: 40px 30px; text-align: center;">
      <div style="width: 60px; height: 60px; background: #fef3c7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        <span style="font-size: 28px;">🔐</span>
      </div>

      <h2 style="color: #1a3c34; margin: 0 0 15px;">Reset Your Password</h2>
      
      <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
        ${data.userName ? `Hello ${data.userName},` : 'Hello,'}<br>
        We received a request to reset your password. Click the button below to create a new password.
      </p>

      <a href="${resetUrl}" 
         style="display: inline-block; background: #1a3c34; color: white; padding: 14px 40px; border-radius: 30px; text-decoration: none; font-weight: 600;">
        Reset Password
      </a>

      <p style="color: #999; font-size: 13px; margin-top: 30px;">
        This link is valid for 1 hour only.<br>
        If you didn't request a password reset, please ignore this email.
      </p>
    </div>

    <div style="background: #f9f9f9; padding: 20px; text-align: center;">
      <p style="color: #888; margin: 0; font-size: 12px;">
        © ${new Date().getFullYear()} LegeCy Store
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'LegeCy Store <onboarding@resend.dev>',
      to: data.email,
      subject: 'Reset Your Password - LegeCy Store',
      html: html,
    });

    if (error) {
      logger.error('Failed to send password reset email', { error });
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error) {
    logger.error('Password reset email error', { error });
    return { success: false, error: 'Failed to send email' };
  }
}
