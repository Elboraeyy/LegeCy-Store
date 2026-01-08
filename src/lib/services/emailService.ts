import { Resend } from 'resend';
import { logger } from '@/lib/logger';

/**
 * LegaCy Store - Professional Email Service
 * 
 * Premium email templates for:
 * - Order Confirmation
 * - Order Shipped
 * - Order Delivered
 * - Password Reset
 * - Welcome Email
 * - Abandoned Cart
 * - Payment Confirmation
 */

const resend = new Resend(process.env.RESEND_API_KEY);

// Brand Constants
const BRAND = {
  name: 'LegaCy',
  tagline: 'Luxury Lifestyle',
  primaryColor: '#12403C',
  accentColor: '#D4AF37',
  lightBg: '#F6E5C6',
  darkBg: '#0A2622',
  logoUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://legecy.store'}/brand/logos/logo-horizontal-gold.svg`,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://legecy.store',
  supportEmail: 'support@legecy.store',
  whatsapp: '+201278432630',
};

const formatPrice = (price: number) => `EGP ${price.toLocaleString('en-EG', { minimumFractionDigits: 0 })}`;

// ============================================
// BASE EMAIL TEMPLATE
// ============================================

const baseStyles = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Inter:wght@400;500;600&display=swap');
    
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: #f5f5f5; }
  </style>
`;

function getEmailWrapper(content: string, previewText: string = '') {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>LegaCy Store</title>
  ${baseStyles}
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .fallback-font { font-family: Arial, sans-serif; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  
  <!-- Preview Text -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${previewText}
  </div>
  
  <!-- Email Container -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Main Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND.primaryColor} 0%, ${BRAND.darkBg} 100%); padding: 40px 40px 35px; text-align: center;">
              <img src="${BRAND.logoUrl}" alt="LegaCy" width="180" style="max-width: 180px; height: auto;" />
              <p style="color: ${BRAND.accentColor}; margin: 12px 0 0; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">${BRAND.tagline}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: ${BRAND.primaryColor}; padding: 30px 40px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <a href="${BRAND.appUrl}" style="color: ${BRAND.accentColor}; text-decoration: none; font-size: 18px; font-weight: 600; letter-spacing: 2px;">LegaCy</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 15px;">
                    <a href="${BRAND.appUrl}/shop" style="color: #ffffff; text-decoration: none; font-size: 13px; margin: 0 12px; opacity: 0.8;">Shop</a>
                    <span style="color: #ffffff; opacity: 0.3;">|</span>
                    <a href="${BRAND.appUrl}/account" style="color: #ffffff; text-decoration: none; font-size: 13px; margin: 0 12px; opacity: 0.8;">Account</a>
                    <span style="color: #ffffff; opacity: 0.3;">|</span>
                    <a href="https://wa.me/${BRAND.whatsapp.replace('+', '')}" style="color: #ffffff; text-decoration: none; font-size: 13px; margin: 0 12px; opacity: 0.8;">WhatsApp</a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="color: #ffffff; opacity: 0.5; font-size: 11px; margin: 0;">
                      © ${new Date().getFullYear()} LegaCy Store. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
  `;
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

export async function sendOrderConfirmationEmail(data: OrderConfirmationData) {
  try {
    if (!process.env.RESEND_API_KEY) {
      logger.warn('RESEND_API_KEY not configured');
      return { success: false, error: 'Email not configured' };
    }

    const orderNumber = data.orderId.slice(0, 8).toUpperCase();
    
    const itemsHtml = data.items.map(item => `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #f0f0f0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="60" valign="top">
                ${item.image 
                  ? `<img src="${item.image}" width="56" height="56" style="border-radius: 8px; object-fit: cover;" alt="${item.name}" />`
                  : `<div style="width: 56px; height: 56px; background: #f5f5f5; border-radius: 8px;"></div>`
                }
              </td>
              <td style="padding-left: 16px;" valign="top">
                <p style="margin: 0 0 4px; font-weight: 600; color: #1a1a1a; font-size: 15px;">${item.name}</p>
                <p style="margin: 0; color: #666; font-size: 13px;">Qty: ${item.quantity}</p>
              </td>
              <td align="right" valign="top" style="font-weight: 600; color: ${BRAND.primaryColor}; font-size: 15px;">
                ${formatPrice(item.price * item.quantity)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `).join('');

    const content = `
      <!-- Success Banner -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 30px 40px; text-align: center;">
            <div style="width: 60px; height: 60px; background: #22c55e; border-radius: 50%; margin: 0 auto 15px; line-height: 60px;">
              <span style="color: white; font-size: 28px;">✓</span>
            </div>
            <h1 style="margin: 0 0 8px; color: ${BRAND.primaryColor}; font-size: 26px; font-family: 'Playfair Display', Georgia, serif;">Order Confirmed!</h1>
            <p style="margin: 0; color: #166534; font-size: 14px;">Thank you for choosing LegaCy</p>
          </td>
        </tr>
      </table>
      
      <!-- Order Details -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 40px;">
            
            <!-- Greeting -->
            <p style="margin: 0 0 25px; font-size: 16px; color: #333; line-height: 1.6;">
              Dear <strong>${data.customerName}</strong>,<br>
              Your order has been successfully placed and is now being prepared with care.
            </p>
            
            <!-- Order Number Box -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
              <tr>
                <td style="background: #f8f8f8; border-radius: 12px; padding: 20px; text-align: center; border: 2px dashed #e0e0e0;">
                  <p style="margin: 0 0 5px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
                  <p style="margin: 0; color: ${BRAND.primaryColor}; font-size: 28px; font-weight: 700; letter-spacing: 3px; font-family: monospace;">#${orderNumber}</p>
                </td>
              </tr>
            </table>
            
            <!-- Items Section -->
            <h2 style="margin: 0 0 20px; color: ${BRAND.primaryColor}; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid ${BRAND.accentColor}; padding-bottom: 10px;">
              Order Items
            </h2>
            
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
              ${itemsHtml}
            </table>
            
            <!-- Totals -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
              <tr>
                <td style="padding: 10px 0; color: #666; font-size: 14px;">Subtotal</td>
                <td align="right" style="padding: 10px 0; color: #333; font-size: 14px;">${formatPrice(data.subtotal)}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #666; font-size: 14px;">Shipping</td>
                <td align="right" style="padding: 10px 0; color: #333; font-size: 14px;">${data.shipping === 0 ? '<span style="color: #22c55e;">FREE</span>' : formatPrice(data.shipping)}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 15px 0 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background: ${BRAND.primaryColor}; padding: 16px 20px; border-radius: 10px; color: white; font-size: 16px; font-weight: 600;">Total</td>
                      <td align="right" style="background: ${BRAND.primaryColor}; padding: 16px 20px; border-radius: 10px; color: ${BRAND.accentColor}; font-size: 22px; font-weight: 700;">${formatPrice(data.total)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <!-- Shipping & Payment Info -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
              <tr>
                <td width="50%" valign="top" style="padding-right: 15px;">
                  <div style="background: #f8f8f8; border-radius: 12px; padding: 20px; height: 100%;">
                    <p style="margin: 0 0 10px; color: ${BRAND.primaryColor}; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      📍 Shipping To
                    </p>
                    <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">${data.shippingAddress}</p>
                  </div>
                </td>
                <td width="50%" valign="top" style="padding-left: 15px;">
                  <div style="background: #f8f8f8; border-radius: 12px; padding: 20px; height: 100%;">
                    <p style="margin: 0 0 10px; color: ${BRAND.primaryColor}; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      💳 Payment Method
                    </p>
                    <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">${data.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online'}</p>
                  </div>
                </td>
              </tr>
            </table>
            
            <!-- Track Order Button -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${BRAND.appUrl}/track/${data.orderId}" style="display: inline-block; background: ${BRAND.primaryColor}; color: white; padding: 16px 50px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px; letter-spacing: 0.5px;">
                    Track Your Order →
                  </a>
                </td>
              </tr>
            </table>
            
            <!-- Delivery Info -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 35px;">
              <tr>
                <td style="background: linear-gradient(135deg, ${BRAND.lightBg} 0%, #fef3c7 100%); border-radius: 12px; padding: 20px; text-align: center;">
                  <p style="margin: 0; color: ${BRAND.primaryColor}; font-size: 14px; line-height: 1.8;">
                    🚚 Expected delivery: <strong>3-5 business days</strong><br>
                    📞 Questions? <a href="https://wa.me/${BRAND.whatsapp.replace('+', '')}" style="color: ${BRAND.primaryColor}; font-weight: 600;">Chat with us on WhatsApp</a>
                  </p>
                </td>
              </tr>
            </table>
            
          </td>
        </tr>
      </table>
    `;

    const html = getEmailWrapper(content, `Order #${orderNumber} confirmed! Thank you for your purchase.`);

    const { data: emailData, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'LegaCy Store <noreply@legecy.store>',
      to: data.customerEmail,
      subject: `✓ Order Confirmed #${orderNumber} - LegaCy Store`,
      html: html,
    });

    if (error) {
      logger.error('Failed to send order confirmation', { error, orderId: data.orderId });
      return { success: false, error: error.message };
    }

    logger.info('Order confirmation sent', { orderId: data.orderId, emailId: emailData?.id });
    return { success: true, emailId: emailData?.id };

  } catch (error) {
    logger.error('Order confirmation email error', { error });
    return { success: false, error: 'Failed to send email' };
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

export async function sendOrderShippedEmail(data: OrderShippedData) {
  try {
    if (!process.env.RESEND_API_KEY) return { success: false };

    const orderNumber = data.orderId.slice(0, 8).toUpperCase();
    
    const content = `
      <!-- Shipped Banner -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 35px 40px; text-align: center;">
            <div style="font-size: 50px; margin-bottom: 15px;">🚚</div>
            <h1 style="margin: 0 0 8px; color: ${BRAND.primaryColor}; font-size: 26px; font-family: 'Playfair Display', Georgia, serif;">Your Order is On Its Way!</h1>
            <p style="margin: 0; color: #1e40af; font-size: 14px;">Order #${orderNumber}</p>
          </td>
        </tr>
      </table>
      
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 40px;">
            <p style="margin: 0 0 25px; font-size: 16px; color: #333; line-height: 1.6;">
              Dear <strong>${data.customerName}</strong>,<br>
              Great news! Your order has been shipped and is making its way to you.
            </p>
            
            ${data.trackingNumber ? `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
              <tr>
                <td style="background: #f8f8f8; border-radius: 12px; padding: 25px; text-align: center;">
                  <p style="margin: 0 0 5px; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Tracking Number</p>
                  <p style="margin: 0 0 15px; color: ${BRAND.primaryColor}; font-size: 24px; font-weight: 700; letter-spacing: 2px; font-family: monospace;">${data.trackingNumber}</p>
                  ${data.courierName ? `<p style="margin: 0; color: #666; font-size: 13px;">via ${data.courierName}</p>` : ''}
                </td>
              </tr>
            </table>
            ` : ''}
            
            ${data.estimatedDelivery ? `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
              <tr>
                <td style="background: linear-gradient(135deg, ${BRAND.lightBg} 0%, #fef3c7 100%); border-radius: 12px; padding: 20px; text-align: center;">
                  <p style="margin: 0; color: ${BRAND.primaryColor}; font-size: 14px;">
                    📅 Estimated Delivery: <strong>${data.estimatedDelivery}</strong>
                  </p>
                </td>
              </tr>
            </table>
            ` : ''}
            
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${BRAND.appUrl}/track/${data.orderId}" style="display: inline-block; background: ${BRAND.primaryColor}; color: white; padding: 16px 50px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px;">
                    Track Package →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;

    const html = getEmailWrapper(content, `Your order #${orderNumber} has been shipped!`);

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'LegaCy Store <noreply@legecy.store>',
      to: data.customerEmail,
      subject: `🚚 Your Order is Shipped! #${orderNumber}`,
      html: html,
    });

    return { success: !error };
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

export async function sendOrderDeliveredEmail(data: OrderDeliveredData) {
  try {
    if (!process.env.RESEND_API_KEY) return { success: false };

    const orderNumber = data.orderId.slice(0, 8).toUpperCase();
    
    const content = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 35px 40px; text-align: center;">
            <div style="font-size: 50px; margin-bottom: 15px;">🎉</div>
            <h1 style="margin: 0 0 8px; color: ${BRAND.primaryColor}; font-size: 26px; font-family: 'Playfair Display', Georgia, serif;">Delivered Successfully!</h1>
            <p style="margin: 0; color: #166534; font-size: 14px;">Order #${orderNumber}</p>
          </td>
        </tr>
      </table>
      
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 40px; text-align: center;">
            <p style="margin: 0 0 30px; font-size: 16px; color: #333; line-height: 1.6;">
              Dear <strong>${data.customerName}</strong>,<br>
              Your order has been delivered. We hope you love your new items!
            </p>
            
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
              <tr>
                <td style="background: ${BRAND.lightBg}; border-radius: 12px; padding: 25px;">
                  <p style="margin: 0 0 15px; color: ${BRAND.primaryColor}; font-size: 16px; font-weight: 600;">
                    How was your experience?
                  </p>
                  <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">
                    Your feedback helps us serve you better. We'd love to hear from you!
                  </p>
                </td>
              </tr>
            </table>
            
            <a href="${BRAND.appUrl}/account/orders/${data.orderId}/review" style="display: inline-block; background: ${BRAND.primaryColor}; color: white; padding: 16px 50px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px;">
              Leave a Review ⭐
            </a>
          </td>
        </tr>
      </table>
    `;

    const html = getEmailWrapper(content, `Your order #${orderNumber} has been delivered!`);

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'LegaCy Store <noreply@legecy.store>',
      to: data.customerEmail,
      subject: `🎉 Delivered! Order #${orderNumber}`,
      html: html,
    });

    return { success: !error };
  } catch {
    return { success: false };
  }
}

// ============================================
// WELCOME EMAIL
// ============================================

interface WelcomeEmailData {
  customerName: string;
  customerEmail: string;
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  try {
    if (!process.env.RESEND_API_KEY) return { success: false };
    
    const content = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 50px 40px; text-align: center;">
            <div style="font-size: 50px; margin-bottom: 20px;">👋</div>
            <h1 style="margin: 0 0 15px; color: ${BRAND.primaryColor}; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">
              Welcome to LegaCy, ${data.customerName}!
            </h1>
            <p style="margin: 0 0 30px; font-size: 16px; color: #666; line-height: 1.6; max-width: 400px; margin-left: auto; margin-right: auto;">
              You've joined an exclusive community of those who appreciate the finer things in life.
            </p>
            
            <!-- Benefits -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 35px;">
              <tr>
                <td>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f8f8f8; border-radius: 16px; overflow: hidden;">
                    <tr>
                      <td width="33%" style="padding: 25px 15px; text-align: center; border-right: 1px solid #e5e5e5;">
                        <div style="font-size: 28px; margin-bottom: 10px;">🎁</div>
                        <p style="margin: 0; color: ${BRAND.primaryColor}; font-size: 13px; font-weight: 600;">Exclusive Offers</p>
                      </td>
                      <td width="33%" style="padding: 25px 15px; text-align: center; border-right: 1px solid #e5e5e5;">
                        <div style="font-size: 28px; margin-bottom: 10px;">⭐</div>
                        <p style="margin: 0; color: ${BRAND.primaryColor}; font-size: 13px; font-weight: 600;">Loyalty Points</p>
                      </td>
                      <td width="33%" style="padding: 25px 15px; text-align: center;">
                        <div style="font-size: 28px; margin-bottom: 10px;">🚀</div>
                        <p style="margin: 0; color: ${BRAND.primaryColor}; font-size: 13px; font-weight: 600;">Priority Shipping</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <a href="${BRAND.appUrl}/shop" style="display: inline-block; background: ${BRAND.primaryColor}; color: white; padding: 16px 50px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px; letter-spacing: 0.5px;">
              Start Shopping →
            </a>
          </td>
        </tr>
      </table>
    `;

    const html = getEmailWrapper(content, `Welcome to LegaCy, ${data.customerName}! Start your luxury journey.`);

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'LegaCy Store <noreply@legecy.store>',
      to: data.customerEmail,
      subject: `Welcome to LegaCy, ${data.customerName}! ✨`,
      html: html,
    });

    return { success: !error };
  } catch {
    return { success: false };
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

export async function sendPasswordResetEmail(data: PasswordResetData) {
  try {
    if (!process.env.RESEND_API_KEY) return { success: false };

    const resetUrl = `${BRAND.appUrl}/reset-password?token=${data.resetToken}`;
    
    const content = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 50px 40px; text-align: center;">
            <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 50%; margin: 0 auto 25px; line-height: 70px;">
              <span style="font-size: 32px;">🔐</span>
            </div>
            
            <h1 style="margin: 0 0 15px; color: ${BRAND.primaryColor}; font-size: 26px; font-family: 'Playfair Display', Georgia, serif;">
              Reset Your Password
            </h1>
            
            <p style="margin: 0 0 30px; font-size: 15px; color: #666; line-height: 1.6; max-width: 380px; margin-left: auto; margin-right: auto;">
              ${data.userName ? `Hi ${data.userName},` : 'Hello,'}<br>
              We received a request to reset your password. Click the button below to create a new one.
            </p>
            
            <a href="${resetUrl}" style="display: inline-block; background: ${BRAND.primaryColor}; color: white; padding: 16px 50px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px; margin-bottom: 30px;">
              Reset Password
            </a>
            
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
              <tr>
                <td style="background: #fef3c7; border-radius: 12px; padding: 20px;">
                  <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.6;">
                    ⏰ This link expires in <strong>1 hour</strong><br>
                    🔒 If you didn't request this, please ignore this email
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;

    const html = getEmailWrapper(content, 'Reset your LegaCy Store password');

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'LegaCy Store <noreply@legecy.store>',
      to: data.email,
      subject: '🔐 Reset Your Password - LegaCy Store',
      html: html,
    });

    return { success: !error };
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

export async function sendAbandonedCartEmail(data: AbandonedCartData) {
  try {
    if (!process.env.RESEND_API_KEY) return { success: false };
    
    const itemsHtml = data.items.slice(0, 3).map(item => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="60">
                ${item.image 
                  ? `<img src="${item.image}" width="50" height="50" style="border-radius: 8px; object-fit: cover;" />`
                  : `<div style="width: 50px; height: 50px; background: #f5f5f5; border-radius: 8px;"></div>`
                }
              </td>
              <td style="padding-left: 15px;">
                <p style="margin: 0; font-weight: 600; color: #333; font-size: 14px;">${item.name}</p>
                <p style="margin: 5px 0 0; color: ${BRAND.accentColor}; font-weight: 600;">${formatPrice(item.price)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `).join('');

    const content = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 50px 40px; text-align: center;">
            <div style="font-size: 50px; margin-bottom: 20px;">🛒</div>
            
            <h1 style="margin: 0 0 15px; color: ${BRAND.primaryColor}; font-size: 26px; font-family: 'Playfair Display', Georgia, serif;">
              Did You Forget Something?
            </h1>
            
            <p style="margin: 0 0 30px; font-size: 15px; color: #666; line-height: 1.6;">
              Hi ${data.customerName}, you left some amazing items in your cart!
            </p>
            
            <!-- Items -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
              ${itemsHtml}
            </table>
            
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
              <tr>
                <td style="background: ${BRAND.primaryColor}; padding: 15px 20px; border-radius: 10px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color: white; font-size: 14px;">Cart Total</td>
                      <td align="right" style="color: ${BRAND.accentColor}; font-size: 20px; font-weight: 700;">${formatPrice(data.totalValue)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <a href="${data.cartUrl}" style="display: inline-block; background: ${BRAND.primaryColor}; color: white; padding: 16px 50px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px;">
              Complete Your Order →
            </a>
            
            <p style="margin: 25px 0 0; color: #999; font-size: 13px;">
              Items in your cart are selling fast. Don't miss out!
            </p>
          </td>
        </tr>
      </table>
    `;

    const html = getEmailWrapper(content, `You left ${data.items.length} item(s) in your cart!`);

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'LegaCy Store <noreply@legecy.store>',
      to: data.customerEmail,
      subject: `🛒 Your cart is waiting, ${data.customerName}!`,
      html: html,
    });

    return { success: !error };
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

export async function sendPaymentConfirmationEmail(data: PaymentConfirmationData) {
  try {
    if (!process.env.RESEND_API_KEY) return { success: false };

    const orderNumber = data.orderId.slice(0, 8).toUpperCase();
    
    const content = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 35px 40px; text-align: center;">
            <div style="width: 60px; height: 60px; background: #22c55e; border-radius: 50%; margin: 0 auto 15px; line-height: 60px;">
              <span style="color: white; font-size: 28px;">✓</span>
            </div>
            <h1 style="margin: 0 0 8px; color: ${BRAND.primaryColor}; font-size: 26px; font-family: 'Playfair Display', Georgia, serif;">Payment Received!</h1>
            <p style="margin: 0; color: #166534; font-size: 14px;">Thank you for your payment</p>
          </td>
        </tr>
      </table>
      
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 40px;">
            <p style="margin: 0 0 25px; font-size: 16px; color: #333; line-height: 1.6;">
              Dear <strong>${data.customerName}</strong>,<br>
              We've successfully received your payment. Your order is now being processed!
            </p>
            
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f8f8f8; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
              <tr>
                <td>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-size: 14px;">Order Number</td>
                      <td align="right" style="padding: 8px 0; color: ${BRAND.primaryColor}; font-weight: 700; font-size: 16px;">#${orderNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-size: 14px;">Amount Paid</td>
                      <td align="right" style="padding: 8px 0; color: ${BRAND.accentColor}; font-weight: 700; font-size: 18px;">${formatPrice(data.amount)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-size: 14px;">Payment Method</td>
                      <td align="right" style="padding: 8px 0; color: #333; font-size: 14px;">${data.paymentMethod}</td>
                    </tr>
                    ${data.transactionId ? `
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-size: 14px;">Transaction ID</td>
                      <td align="right" style="padding: 8px 0; color: #333; font-size: 13px; font-family: monospace;">${data.transactionId}</td>
                    </tr>
                    ` : ''}
                  </table>
                </td>
              </tr>
            </table>
            
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${BRAND.appUrl}/account/orders/${data.orderId}" style="display: inline-block; background: ${BRAND.primaryColor}; color: white; padding: 16px 50px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px;">
                    View Order Details →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;

    const html = getEmailWrapper(content, `Payment received for order #${orderNumber}`);

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'LegaCy Store <noreply@legecy.store>',
      to: data.customerEmail,
      subject: `✓ Payment Confirmed #${orderNumber} - LegaCy`,
      html: html,
    });

    return { success: !error };
  } catch {
    return { success: false };
  }
}
