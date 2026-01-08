import { sendOrderConfirmationEmail, sendWelcomeEmail } from '@/lib/services/emailService';
import { NextResponse } from 'next/server';

/**
 * EMAIL TEST ENDPOINT
 * 
 * Usage: GET /api/test-email?email=your@email.com&type=order
 * 
 * This endpoint allows testing the email system.
 * Check server logs for detailed output.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const type = searchParams.get('type') || 'order';

  console.log('='.repeat(50));
  console.log('📧 TEST EMAIL ENDPOINT');
  console.log('='.repeat(50));
  console.log('Email:', email);
  console.log('Type:', type);
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'SET (' + process.env.RESEND_API_KEY.slice(0, 10) + '...)' : 'NOT SET!');
  console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || 'NOT SET');
  console.log('='.repeat(50));

  if (!email) {
    return NextResponse.json({ 
      error: 'Email required',
      usage: '/api/test-email?email=your@email.com&type=order',
      types: ['order', 'welcome'],
      config: {
        RESEND_API_KEY: process.env.RESEND_API_KEY ? 'SET' : 'NOT SET',
        RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'NOT SET'
      }
    }, { status: 400 });
  }

  try {
    let result;

    switch (type) {
      case 'order':
        console.log('📧 Sending ORDER CONFIRMATION test email...');
        result = await sendOrderConfirmationEmail({
          orderId: 'TEST-' + Date.now().toString(36).toUpperCase(),
          customerName: 'Test Customer',
          customerEmail: email,
          items: [
            { name: 'Classic Leather Watch', quantity: 1, price: 2500 },
            { name: 'Premium Belt - Brown', quantity: 2, price: 850 },
          ],
          subtotal: 4200,
          shipping: 0,
          total: 4200,
          shippingAddress: '123 Test Street, Cairo, Egypt',
          paymentMethod: 'cod',
        });
        break;

      case 'welcome':
        console.log('📧 Sending WELCOME test email...');
        result = await sendWelcomeEmail({
          customerName: 'Test Customer',
          customerEmail: email,
        });
        break;

      default:
        return NextResponse.json({ 
          error: `Unknown type: ${type}`,
          availableTypes: ['order', 'welcome']
        }, { status: 400 });
    }

    console.log('📧 RESULT:', JSON.stringify(result, null, 2));

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: `${type} email sent to ${email}`,
        emailId: 'emailId' in result ? result.emailId : undefined,
        config: {
          RESEND_API_KEY: 'SET',
          RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL
        }
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'error' in result ? result.error : 'Unknown error',
        config: {
          RESEND_API_KEY: process.env.RESEND_API_KEY ? 'SET' : 'NOT SET',
          RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'NOT SET'
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ TEST EMAIL ERROR:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
