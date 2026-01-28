import { Resend } from 'resend';
import { logger } from '@/lib/logger';

/**
 * LegaCy Store - Email Service
 * 
 * Simple, reliable email sending with proper error handling.
 */

// Initialize Resend with explicit check
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('❌ RESEND_API_KEY is not configured!');
    return null;
  }
  return new Resend(apiKey);
};

// Brand Constants
const BRAND = {
  name: 'LegaCy',
  tagline: 'Luxury Lifestyle',
  primaryColor: '#12403C',
  accentColor: '#D4AF37',
  lightBg: '#F6E5C6',
  darkBg: '#0A2622',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://legecy.store',
  whatsapp: '+201278432630',
};

// Get FROM email with fallback
const getFromEmail = () => {
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (fromEmail) return fromEmail;
  return 'LegaCy Store <onboarding@resend.dev>';
};

const formatPrice = (price: number) => `EGP ${price.toLocaleString('en-EG', { minimumFractionDigits: 0 })}`;

// ============================================
// GENERIC EMAIL SENDER
// ============================================

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const resend = getResendClient();
    if (!resend) return { success: false, error: 'Email service not configured' };

    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text
    });

    if (error) {
      console.error('❌ [EMAIL] Send error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('❌ [EMAIL] Exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================
// ORDER CONFIRMATION EMAIL
// ============================================

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface OrderConfirmationData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: string;
  paymentMethod: string;
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationData): Promise<{ success: boolean; error?: string; emailId?: string }> {
  console.log('📧 [EMAIL] Starting sendOrderConfirmationEmail for order:', data.orderId);
  console.log('📧 [EMAIL] Customer email:', data.customerEmail);
  
  try {
    const resend = getResendClient();
    if (!resend) {
      console.error('❌ [EMAIL] Resend client not available');
      return { success: false, error: 'Email service not configured' };
    }

    const orderNumber = data.orderId.slice(0, 8).toUpperCase();
    const fromEmail = getFromEmail();
    
    console.log('📧 [EMAIL] From:', fromEmail);
    console.log('📧 [EMAIL] Order number:', orderNumber);
    
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
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${BRAND.primaryColor}, ${BRAND.darkBg}); padding: 40px 30px; text-align: center;">
      <h1 style="color: ${BRAND.accentColor}; margin: 0; font-size: 32px; letter-spacing: 3px;">${BRAND.name}</h1>
      <p style="color: #a3b8b0; margin: 10px 0 0; font-size: 14px;">${BRAND.tagline}</p>
    </div>

    <!-- Success Banner -->
    <div style="background: linear-gradient(135deg, #dcfce7, #bbf7d0); padding: 30px; text-align: center;">
      <div style="width: 60px; height: 60px; background: #22c55e; border-radius: 50%; margin: 0 auto 15px; line-height: 60px;">
        <span style="color: white; font-size: 28px;">✓</span>
      </div>
      <h2 style="margin: 0 0 8px; color: ${BRAND.primaryColor}; font-size: 24px;">Order Confirmed!</h2>
      <p style="margin: 0; color: #166534; font-size: 14px;">Thank you for your order, ${data.customerName}!</p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      
      <!-- Order Number -->
      <div style="background: #f8f8f8; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 30px; border: 2px dashed #e0e0e0;">
        <p style="color: #888; margin: 0 0 5px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
        <p style="color: ${BRAND.primaryColor}; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 3px; font-family: monospace;">#${orderNumber}</p>
      </div>

      <!-- Order Items -->
      <h3 style="color: ${BRAND.primaryColor}; margin: 0 0 15px; font-size: 18px; border-bottom: 2px solid ${BRAND.accentColor}; padding-bottom: 10px;">Order Details</h3>
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
      <div style="background: ${BRAND.primaryColor}; color: white; padding: 15px 20px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 16px;">Total</span>
        <span style="font-size: 22px; font-weight: bold; color: ${BRAND.accentColor};">${formatPrice(data.total)}</span>
      </div>

      <!-- Shipping Address -->
      <div style="margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 12px;">
        <h3 style="color: ${BRAND.primaryColor}; margin: 0 0 10px; font-size: 16px;">📍 Shipping Address</h3>
        <p style="color: #666; margin: 0; line-height: 1.6;">${data.shippingAddress}</p>
      </div>

      <!-- Payment Method -->
      <div style="margin-top: 20px; padding: 20px; background: #f9f9f9; border-radius: 12px;">
        <h3 style="color: ${BRAND.primaryColor}; margin: 0 0 10px; font-size: 16px;">💳 Payment Method</h3>
        <p style="color: #666; margin: 0;">${data.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online'}</p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin-top: 30px;">
        <a href="${BRAND.appUrl}/track/${data.orderId}" 
           style="display: inline-block; background: ${BRAND.primaryColor}; color: white; padding: 14px 40px; border-radius: 30px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Track Your Order →
        </a>
      </div>

      <!-- Delivery Info -->
      <div style="margin-top: 35px; padding: 20px; background: linear-gradient(135deg, ${BRAND.lightBg}, #fef3c7); border-radius: 12px; text-align: center;">
        <p style="margin: 0; color: ${BRAND.primaryColor}; font-size: 14px; line-height: 1.8;">
          🚚 Expected delivery: <strong>3-5 business days</strong><br>
          📞 Questions? <a href="https://wa.me/${BRAND.whatsapp.replace('+', '')}" style="color: ${BRAND.primaryColor}; font-weight: 600;">Chat with us on WhatsApp</a>
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background: ${BRAND.primaryColor}; padding: 30px; text-align: center;">
      <p style="color: ${BRAND.accentColor}; margin: 0 0 10px; font-size: 18px; font-weight: 600; letter-spacing: 2px;">${BRAND.name}</p>
      <p style="color: #ffffff; opacity: 0.7; margin: 0; font-size: 12px;">
        © ${new Date().getFullYear()} LegaCy Store. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
    `;

    console.log('📧 [EMAIL] Sending email via Resend...');
    
    const { data: emailData, error } = await resend.emails.send({
      from: fromEmail,
      to: data.customerEmail,
      subject: `✓ Order Confirmed #${orderNumber} - LegaCy Store`,
      html: html,
    });

    if (error) {
      console.error('❌ [EMAIL] Resend error:', JSON.stringify(error));
      logger.error('Failed to send order confirmation', { error, orderId: data.orderId });
      return { success: false, error: error.message };
    }

    console.log('✅ [EMAIL] Email sent successfully! ID:', emailData?.id);
    logger.info('Order confirmation sent', { orderId: data.orderId, emailId: emailData?.id });
    return { success: true, emailId: emailData?.id };

  } catch (error) {
    console.error('❌ [EMAIL] Exception:', error);
    logger.error('Order confirmation email error', { error });
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
}

// ============================================
// ORDER SHIPPED EMAIL
// ============================================

interface OrderShippedData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  trackingNumber?: string;
  courierName?: string;
  estimatedDelivery?: string;
}

export async function sendOrderShippedEmail(data: OrderShippedData): Promise<{ success: boolean; error?: string }> {
  console.log('📧 [EMAIL] Sending shipped email for order:', data.orderId);
  
  try {
    const resend = getResendClient();
    if (!resend) return { success: false, error: 'Email not configured' };

    const orderNumber = data.orderId.slice(0, 8).toUpperCase();
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
    
    <div style="background: linear-gradient(135deg, ${BRAND.primaryColor}, ${BRAND.darkBg}); padding: 40px; text-align: center;">
      <h1 style="color: ${BRAND.accentColor}; margin: 0; font-size: 28px;">${BRAND.name}</h1>
    </div>

    <div style="background: linear-gradient(135deg, #dbeafe, #bfdbfe); padding: 30px; text-align: center;">
      <div style="font-size: 50px; margin-bottom: 15px;">🚚</div>
      <h2 style="margin: 0 0 8px; color: ${BRAND.primaryColor}; font-size: 24px;">Your Order is On Its Way!</h2>
      <p style="margin: 0; color: #1e40af; font-size: 14px;">Order #${orderNumber}</p>
    </div>
    
    <div style="padding: 40px;">
      <p style="font-size: 16px; color: #333; line-height: 1.6;">
        Dear <strong>${data.customerName}</strong>,<br>
        Great news! Your order has been shipped and is making its way to you.
      </p>
      
      ${data.trackingNumber ? `
      <div style="background: #f8f8f8; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
        <p style="color: #666; margin: 0 0 5px; font-size: 12px;">Tracking Number</p>
        <p style="color: ${BRAND.primaryColor}; margin: 0; font-size: 24px; font-weight: bold; font-family: monospace;">${data.trackingNumber}</p>
        ${data.courierName ? `<p style="color: #666; margin: 10px 0 0; font-size: 13px;">via ${data.courierName}</p>` : ''}
      </div>
      ` : ''}
      
      ${data.estimatedDelivery ? `
      <div style="background: ${BRAND.lightBg}; border-radius: 12px; padding: 20px; text-align: center;">
        <p style="margin: 0; color: ${BRAND.primaryColor};">📅 Estimated Delivery: <strong>${data.estimatedDelivery}</strong></p>
      </div>
      ` : ''}
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${BRAND.appUrl}/track/${data.orderId}" style="display: inline-block; background: ${BRAND.primaryColor}; color: white; padding: 14px 40px; border-radius: 30px; text-decoration: none; font-weight: 600;">
          Track Package →
        </a>
      </div>
    </div>

    <div style="background: ${BRAND.primaryColor}; padding: 20px; text-align: center;">
      <p style="color: #ffffff; opacity: 0.7; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} LegaCy Store</p>
    </div>
  </div>
</body>
</html>
    `;

    const { error } = await resend.emails.send({
      from: getFromEmail(),
      to: data.customerEmail,
      subject: `🚚 Your Order is Shipped! #${orderNumber}`,
      html: html,
    });

    if (error) {
      console.error('❌ [EMAIL] Shipped email error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ [EMAIL] Shipped email sent!');
    return { success: true };
  } catch (error) {
    console.error('❌ [EMAIL] Exception:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// ============================================
// PASSWORD RESET EMAIL
// ============================================

interface PasswordResetData {
  email: string;
  resetToken: string;
  userName?: string;
}

export async function sendPasswordResetEmail(data: PasswordResetData): Promise<{ success: boolean; error?: string }> {
  console.log('📧 [EMAIL] Sending password reset email to:', data.email);
  
  try {
    const resend = getResendClient();
    if (!resend) return { success: false, error: 'Email not configured' };

    const resetUrl = `${BRAND.appUrl}/reset-password?token=${data.resetToken}`;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 500px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    
    <div style="background: linear-gradient(135deg, ${BRAND.primaryColor}, ${BRAND.darkBg}); padding: 30px; text-align: center;">
      <h1 style="color: ${BRAND.accentColor}; margin: 0; font-size: 24px;">${BRAND.name}</h1>
    </div>

    <div style="padding: 40px; text-align: center;">
      <div style="width: 60px; height: 60px; background: #fef3c7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        <span style="font-size: 28px;">🔐</span>
      </div>

      <h2 style="color: ${BRAND.primaryColor}; margin: 0 0 15px;">Reset Your Password</h2>
      
      <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
        ${data.userName ? `Hello ${data.userName},` : 'Hello,'}<br>
        We received a request to reset your password. Click the button below to create a new one.
      </p>

      <a href="${resetUrl}" style="display: inline-block; background: ${BRAND.primaryColor}; color: white; padding: 14px 40px; border-radius: 30px; text-decoration: none; font-weight: 600;">
        Reset Password
      </a>

      <div style="margin-top: 30px; padding: 15px; background: #fef3c7; border-radius: 10px;">
        <p style="margin: 0; color: #92400e; font-size: 13px;">
          ⏰ This link expires in <strong>1 hour</strong><br>
          🔒 If you didn't request this, please ignore this email
        </p>
      </div>
    </div>

    <div style="background: #f9f9f9; padding: 20px; text-align: center;">
      <p style="color: #888; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} LegaCy Store</p>
    </div>
  </div>
</body>
</html>
    `;

    const { error } = await resend.emails.send({
      from: getFromEmail(),
      to: data.email,
      subject: '🔐 Reset Your Password - LegaCy Store',
      html: html,
    });

    if (error) {
      console.error('❌ [EMAIL] Password reset email error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ [EMAIL] Password reset email sent!');
    return { success: true };
  } catch (error) {
    console.error('❌ [EMAIL] Exception:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// ============================================
// WELCOME EMAIL
// ============================================

interface WelcomeEmailData {
  customerName: string;
  customerEmail: string;
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean }> {
  console.log('📧 [EMAIL] Sending welcome email to:', data.customerEmail);
  
  try {
    const resend = getResendClient();
    if (!resend) return { success: false };
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
    
    <div style="background: linear-gradient(135deg, ${BRAND.primaryColor}, ${BRAND.darkBg}); padding: 40px; text-align: center;">
      <h1 style="color: ${BRAND.accentColor}; margin: 0; font-size: 28px;">${BRAND.name}</h1>
    </div>

    <div style="padding: 50px 40px; text-align: center;">
      <div style="font-size: 50px; margin-bottom: 20px;">👋</div>
      <h2 style="color: ${BRAND.primaryColor}; margin: 0 0 15px; font-size: 28px;">
        Welcome, ${data.customerName}!
      </h2>
      <p style="color: #666; font-size: 16px; line-height: 1.6; max-width: 400px; margin: 0 auto 30px;">
        You've joined an exclusive community of those who appreciate the finer things in life.
      </p>
      
      <a href="${BRAND.appUrl}/shop" style="display: inline-block; background: ${BRAND.primaryColor}; color: white; padding: 14px 40px; border-radius: 30px; text-decoration: none; font-weight: 600;">
        Start Shopping →
      </a>
    </div>

    <div style="background: ${BRAND.primaryColor}; padding: 20px; text-align: center;">
      <p style="color: #ffffff; opacity: 0.7; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} LegaCy Store</p>
    </div>
  </div>
</body>
</html>
    `;

    const { error } = await resend.emails.send({
      from: getFromEmail(),
      to: data.customerEmail,
      subject: `Welcome to LegaCy, ${data.customerName}! ✨`,
      html: html,
    });

    if (error) {
      console.error('❌ [EMAIL] Welcome email error:', error);
      return { success: false };
    }
    
    console.log('✅ [EMAIL] Welcome email sent!');
    return { success: true };
  } catch {
    return { success: false };
  }
}

// ============================================
// ORDER DELIVERED EMAIL
// ============================================

interface OrderDeliveredData {
  orderId: string;
  customerName: string;
  customerEmail: string;
}

export async function sendOrderDeliveredEmail(data: OrderDeliveredData): Promise<{ success: boolean }> {
  console.log('📧 [EMAIL] Sending delivered email for order:', data.orderId);
  
  try {
    const resend = getResendClient();
    if (!resend) return { success: false };

    const orderNumber = data.orderId.slice(0, 8).toUpperCase();
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
    
    <div style="background: linear-gradient(135deg, ${BRAND.primaryColor}, ${BRAND.darkBg}); padding: 40px; text-align: center;">
      <h1 style="color: ${BRAND.accentColor}; margin: 0; font-size: 28px;">${BRAND.name}</h1>
    </div>

    <div style="background: linear-gradient(135deg, #dcfce7, #bbf7d0); padding: 30px; text-align: center;">
      <div style="font-size: 50px; margin-bottom: 15px;">🎉</div>
      <h2 style="margin: 0 0 8px; color: ${BRAND.primaryColor}; font-size: 24px;">Delivered Successfully!</h2>
      <p style="margin: 0; color: #166534; font-size: 14px;">Order #${orderNumber}</p>
    </div>
    
    <div style="padding: 40px; text-align: center;">
      <p style="font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 30px;">
        Dear <strong>${data.customerName}</strong>,<br>
        Your order has been delivered. We hope you love your new items!
      </p>
      
      <div style="background: ${BRAND.lightBg}; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
        <p style="margin: 0 0 15px; color: ${BRAND.primaryColor}; font-size: 16px; font-weight: 600;">
          How was your experience?
        </p>
        <p style="margin: 0; color: #666; font-size: 14px;">
          Your feedback helps us serve you better!
        </p>
      </div>
      
      <a href="${BRAND.appUrl}/account/orders/${data.orderId}/review" style="display: inline-block; background: ${BRAND.primaryColor}; color: white; padding: 14px 40px; border-radius: 30px; text-decoration: none; font-weight: 600;">
        Leave a Review ⭐
      </a>
    </div>

    <div style="background: ${BRAND.primaryColor}; padding: 20px; text-align: center;">
      <p style="color: #ffffff; opacity: 0.7; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} LegaCy Store</p>
    </div>
  </div>
</body>
</html>
    `;

    const { error } = await resend.emails.send({
      from: getFromEmail(),
      to: data.customerEmail,
      subject: `🎉 Delivered! Order #${orderNumber}`,
      html: html,
    });

    if (error) {
      console.error('❌ [EMAIL] Delivered email error:', error);
      return { success: false };
    }
    
    console.log('✅ [EMAIL] Delivered email sent!');
    return { success: true };
  } catch {
    return { success: false };
  }
}

// ============================================
// ABANDONED CART EMAIL
// ============================================

interface AbandonedCartItem {
  name: string;
  price: number;
  image?: string;
}

interface AbandonedCartData {
  customerName: string;
  customerEmail: string;
  items: AbandonedCartItem[];
  cartUrl: string;
  totalValue: number;
}

export async function sendAbandonedCartEmail(data: AbandonedCartData): Promise<{ success: boolean }> {
  console.log('📧 [EMAIL] Sending abandoned cart email to:', data.customerEmail);
  
  try {
    const resend = getResendClient();
    if (!resend) return { success: false };
    
    const itemsHtml = data.items.slice(0, 3).map(item => `
      <div style="padding: 12px 0; border-bottom: 1px solid #eee;">
        <p style="margin: 0; font-weight: 600;">${item.name}</p>
        <p style="margin: 5px 0 0; color: ${BRAND.accentColor}; font-weight: 600;">${formatPrice(item.price)}</p>
      </div>
    `).join('');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
    
    <div style="background: linear-gradient(135deg, ${BRAND.primaryColor}, ${BRAND.darkBg}); padding: 40px; text-align: center;">
      <h1 style="color: ${BRAND.accentColor}; margin: 0; font-size: 28px;">${BRAND.name}</h1>
    </div>

    <div style="padding: 50px 40px; text-align: center;">
      <div style="font-size: 50px; margin-bottom: 20px;">🛒</div>
      
      <h2 style="color: ${BRAND.primaryColor}; margin: 0 0 15px; font-size: 24px;">
        Did You Forget Something?
      </h2>
      
      <p style="color: #666; font-size: 15px; margin-bottom: 30px;">
        Hi ${data.customerName}, you left some amazing items in your cart!
      </p>
      
      <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: left;">
        ${itemsHtml}
      </div>
      
      <div style="background: ${BRAND.primaryColor}; padding: 15px 20px; border-radius: 10px; margin-bottom: 30px;">
        <span style="color: white; font-size: 14px;">Cart Total: </span>
        <span style="color: ${BRAND.accentColor}; font-size: 20px; font-weight: bold;">${formatPrice(data.totalValue)}</span>
      </div>
      
      <a href="${data.cartUrl}" style="display: inline-block; background: ${BRAND.primaryColor}; color: white; padding: 14px 40px; border-radius: 30px; text-decoration: none; font-weight: 600;">
        Complete Your Order →
      </a>
      
      <p style="margin: 25px 0 0; color: #999; font-size: 13px;">
        Items are selling fast. Don't miss out!
      </p>
    </div>

    <div style="background: ${BRAND.primaryColor}; padding: 20px; text-align: center;">
      <p style="color: #ffffff; opacity: 0.7; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} LegaCy Store</p>
    </div>
  </div>
</body>
</html>
    `;

    const { error } = await resend.emails.send({
      from: getFromEmail(),
      to: data.customerEmail,
      subject: `🛒 Your cart is waiting, ${data.customerName}!`,
      html: html,
    });

    if (error) {
      console.error('❌ [EMAIL] Abandoned cart email error:', error);
      return { success: false };
    }
    
    console.log('✅ [EMAIL] Abandoned cart email sent!');
    return { success: true };
  } catch {
    return { success: false };
  }
}

// ============================================
// PAYMENT CONFIRMATION EMAIL
// ============================================

interface PaymentConfirmationData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
}

export async function sendPaymentConfirmationEmail(data: PaymentConfirmationData): Promise<{ success: boolean }> {
  console.log('📧 [EMAIL] Sending payment confirmation for order:', data.orderId);
  
  try {
    const resend = getResendClient();
    if (!resend) return { success: false };

    const orderNumber = data.orderId.slice(0, 8).toUpperCase();
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
    
    <div style="background: linear-gradient(135deg, ${BRAND.primaryColor}, ${BRAND.darkBg}); padding: 40px; text-align: center;">
      <h1 style="color: ${BRAND.accentColor}; margin: 0; font-size: 28px;">${BRAND.name}</h1>
    </div>

    <div style="background: linear-gradient(135deg, #dcfce7, #bbf7d0); padding: 30px; text-align: center;">
      <div style="width: 60px; height: 60px; background: #22c55e; border-radius: 50%; margin: 0 auto 15px; line-height: 60px;">
        <span style="color: white; font-size: 28px;">✓</span>
      </div>
      <h2 style="margin: 0 0 8px; color: ${BRAND.primaryColor}; font-size: 24px;">Payment Received!</h2>
      <p style="margin: 0; color: #166534; font-size: 14px;">Thank you for your payment</p>
    </div>
    
    <div style="padding: 40px;">
      <p style="font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 25px;">
        Dear <strong>${data.customerName}</strong>,<br>
        We've successfully received your payment. Your order is now being processed!
      </p>
      
      <div style="background: #f8f8f8; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #666;">Order Number</span>
          <span style="color: ${BRAND.primaryColor}; font-weight: bold;">#${orderNumber}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #666;">Amount Paid</span>
          <span style="color: ${BRAND.accentColor}; font-weight: bold; font-size: 18px;">${formatPrice(data.amount)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #666;">Payment Method</span>
          <span style="color: #333;">${data.paymentMethod}</span>
        </div>
        ${data.transactionId ? `
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #666;">Transaction ID</span>
          <span style="color: #333; font-family: monospace; font-size: 13px;">${data.transactionId}</span>
        </div>
        ` : ''}
      </div>
      
      <div style="text-align: center;">
        <a href="${BRAND.appUrl}/account/orders/${data.orderId}" style="display: inline-block; background: ${BRAND.primaryColor}; color: white; padding: 14px 40px; border-radius: 30px; text-decoration: none; font-weight: 600;">
          View Order Details →
        </a>
      </div>
    </div>

    <div style="background: ${BRAND.primaryColor}; padding: 20px; text-align: center;">
      <p style="color: #ffffff; opacity: 0.7; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} LegaCy Store</p>
    </div>
  </div>
</body>
</html>
    `;

    const { error } = await resend.emails.send({
      from: getFromEmail(),
      to: data.customerEmail,
      subject: `✓ Payment Confirmed #${orderNumber} - LegaCy`,
      html: html,
    });

    if (error) {
      console.error('❌ [EMAIL] Payment confirmation email error:', error);
      return { success: false };
    }
    
    console.log('✅ [EMAIL] Payment confirmation email sent!');
    return { success: true };
  } catch {
    return { success: false };
  }
}
// ============================================
// BACK IN STOCK EMAIL
// ============================================

interface BackInStockData {
  customerEmail: string;
  productName: string;
  productUrl: string;
}

export async function sendBackInStockEmail(data: BackInStockData): Promise<{ success: boolean; error?: string }> {
  console.log('📧 [EMAIL] Sending back in stock email to:', data.customerEmail);

  try {
    const resend = getResendClient();
    if (!resend) return { success: false, error: 'Email not configured' };

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
    
    <div style="background: linear-gradient(135deg, ${BRAND.primaryColor}, ${BRAND.darkBg}); padding: 40px; text-align: center;">
      <h1 style="color: ${BRAND.accentColor}; margin: 0; font-size: 28px;">${BRAND.name}</h1>
    </div>

    <div style="padding: 50px 40px; text-align: center;">
      <div style="font-size: 50px; margin-bottom: 20px;">🎉</div>
      <h2 style="color: ${BRAND.primaryColor}; margin: 0 0 15px; font-size: 28px;">
        It's Back!
      </h2>
      <p style="color: #666; font-size: 16px; line-height: 1.6; max-width: 400px; margin: 0 auto 30px;">
        Good news! <strong>${data.productName}</strong> is back in stock.
      </p>
      
      <a href="${data.productUrl}" style="display: inline-block; background: ${BRAND.primaryColor}; color: white; padding: 14px 40px; border-radius: 30px; text-decoration: none; font-weight: 600;">
        Discover Our Legacy →
      </a>
    </div>

    <div style="background: ${BRAND.primaryColor}; padding: 20px; text-align: center;">
      <p style="color: #ffffff; opacity: 0.7; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} LegaCy Store</p>
    </div>
  </div>
</body>
</html>
    `;

    const { error } = await resend.emails.send({
      from: getFromEmail(),
      to: data.customerEmail,
      subject: `🎉 Back in Stock: ${data.productName}`,
      html: html,
    });

    if (error) {
      console.error('❌ [EMAIL] Back in stock email error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [EMAIL] Back in stock email sent!');
    return { success: true };

  } catch (error) {
    console.error('❌ [EMAIL] Exception:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// ============================================
// EMAIL VERIFICATION EMAIL
// ============================================

interface VerificationEmailData {
  email: string;
  token: string;
  userName?: string;
}

export async function sendVerificationEmail(data: VerificationEmailData): Promise<{ success: boolean; error?: string }> {
  console.log('📧 [EMAIL] Sending verification email to:', data.email);

  try {
    const resend = getResendClient();
    if (!resend) return { success: false, error: 'Email service not configured' };

    const verifyUrl = `${BRAND.appUrl}/verify-email?token=${data.token}`;

    // Using the same consistent design as other emails
    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 500px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    
    <div style="background: linear-gradient(135deg, ${BRAND.primaryColor}, ${BRAND.darkBg}); padding: 30px; text-align: center;">
      <h1 style="color: ${BRAND.accentColor}; margin: 0; font-size: 24px;">${BRAND.name}</h1>
    </div>

    <div style="padding: 40px; text-align: center;">
      <div style="width: 60px; height: 60px; line-height: 60px; background: #dbfefe; border-radius: 50%; display: inline-block; text-align: center; margin-bottom: 20px;">
        <span style="font-size: 30px; vertical-align: middle; line-height: 1;">✉️</span>
      </div>

      <h2 style="color: ${BRAND.primaryColor}; margin: 0 0 15px;">Verify Your Email</h2>
      
      <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
        ${data.userName ? `Hello ${data.userName},` : 'Hello,'}<br>
        Please verify your email address to complete your registration and secure your account.
      </p>

      <a href="${verifyUrl}" style="display: inline-block; background: ${BRAND.primaryColor}; color: white; padding: 14px 40px; border-radius: 30px; text-decoration: none; font-weight: 600;">
        Verify Email Address
      </a>

      <div style="margin-top: 30px; padding: 15px; background: #e0f2fe; border-radius: 10px;">
        <p style="margin: 0; color: #075985; font-size: 13px;">
          ⏰ This link expires in <strong>24 hours</strong><br>
          🔒 Keep your account secure
        </p>
      </div>
    </div>

    <div style="background: #f9f9f9; padding: 20px; text-align: center;">
      <p style="color: #888; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} LegaCy Store</p>
    </div>
  </div>
</body>
</html>
    `;

    const { error } = await resend.emails.send({
      from: getFromEmail(),
      to: data.email,
      subject: '✨ Verify your email - LegaCy Store',
      html: html,
    });

    if (error) {
      console.error('❌ [EMAIL] Verification email error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ [EMAIL] Verification email sent!');
    return { success: true };
  } catch (error) {
    console.error('❌ [EMAIL] Exception:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
