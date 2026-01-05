
// Paymob Payment Integration
// https://docs.paymob.com/docs/accept-payments

import prisma from '@/lib/prisma';
import { PaymentSettings } from '@/lib/actions/config';

// Environment variable fallbacks (used if DB settings are empty)
const ENV_PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const ENV_PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const ENV_PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;
const ENV_PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET;
const ENV_PAYMOB_WALLET_INTEGRATION_ID = process.env.PAYMOB_WALLET_INTEGRATION_ID;

/**
 * Paymob Configuration Object
 */
export interface PaymobConfig {
    apiKey: string;
    integrationId: string;
    iframeId: string;
    hmacSecret: string;
    walletIntegrationId?: string;
}

/**
 * Fetches Paymob configuration from Database (Admin Panel settings)
 * Falls back to environment variables if DB values are empty
 */
export async function getPaymobConfig(): Promise<PaymobConfig> {
    let dbSettings: Partial<PaymentSettings> = {};
    
    try {
        const config = await prisma.storeConfig.findUnique({
            where: { key: 'payment_settings' }
        });
        if (config?.value) {
            dbSettings = config.value as Partial<PaymentSettings>;
        }
    } catch (error) {
        console.error('Failed to load Paymob settings from DB:', error);
    }

    // Prioritize DB values, fallback to ENV
    return {
        apiKey: dbSettings.paymobApiKey || ENV_PAYMOB_API_KEY || '',
        integrationId: dbSettings.paymobIntegrationId || ENV_PAYMOB_INTEGRATION_ID || '',
        iframeId: dbSettings.paymobIframeId || ENV_PAYMOB_IFRAME_ID || '',
        hmacSecret: dbSettings.paymobHmacSecret || ENV_PAYMOB_HMAC_SECRET || '',
        walletIntegrationId: ENV_PAYMOB_WALLET_INTEGRATION_ID || ''
    };
}

interface PaymobOrderInput {
    id: string;
    customerEmail: string;
    customerName: string;
    customerPhone: string;
    shippingAddress: string;
    shippingCity: string;
}

/**
 * Initiates a Paymob Payment
 * @param order - Order details
 * @param amount - Amount in EGP (not cents)
 * @param paymentMethod - 'card' or 'wallet'
 * @param walletNumber - Required for wallet payments
 */
export async function initiatePaymobPayment(
    order: PaymobOrderInput, 
    amount: number, 
    paymentMethod: 'card' | 'wallet' = 'card',
    walletNumber?: string
): Promise<{ success: boolean; paymentUrl?: string; error?: string }> {
    
    // Fetch configuration
    const config = await getPaymobConfig();
    
    if (!config.apiKey || !config.integrationId) {
        console.error('❌ Paymob credentials missing');
        return { success: false, error: 'Paymob is not configured. Please add API Key and Integration ID in Admin Settings.' };
    }

    try {
        console.log(`🚀 Initiating Paymob ${paymentMethod} Payment for Order:`, order.id);

        const integrationId = paymentMethod === 'wallet' 
            ? Number(config.walletIntegrationId) 
            : Number(config.integrationId);

        if (paymentMethod === 'wallet' && !integrationId) {
            return { success: false, error: 'Wallet Integration ID is not configured.' };
        }

        // 1. Authentication Request
        const authResponse = await fetch('https://accept.paymob.com/api/auth/tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: config.apiKey })
        });
        const authData = await authResponse.json();
        const token = authData.token;

        if (!token) {
            console.error('❌ Paymob Auth Failed:', authData);
            return { success: false, error: 'Paymob Authentication Failed. Check your API Key.' };
        }

        // 2. Order Registration
        const orderResponse = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                auth_token: token,
                delivery_needed: "false",
                amount_cents: Math.round(amount * 100),
                currency: "EGP",
                merchant_order_id: order.id,
                items: []
            })
        });
        const orderData = await orderResponse.json();
        const paymobOrderId = orderData.id;

        if (!paymobOrderId) {
            console.error('❌ Paymob Order Registration Failed:', orderData);
            return { success: false, error: 'Failed to register order with Paymob.' };
        }
        console.log('✅ Paymob Order ID:', paymobOrderId);

        // 3. Payment Key Request
        const billingData = {
            email: order.customerEmail,
            first_name: order.customerName.split(' ')[0] || 'Customer',
            last_name: order.customerName.split(' ').slice(1).join(' ') || 'Name',
            phone_number: order.customerPhone,
            apartment: 'NA',
            floor: 'NA',
            street: order.shippingAddress || 'NA',
            building: 'NA',
            shipping_method: 'NA',
            postal_code: 'NA',
            city: order.shippingCity || 'Cairo',
            country: 'EG',
            state: 'NA'
        };
        
        console.log('📦 Requesting Payment Key...');

        const keyResponse = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                auth_token: token,
                amount_cents: Math.round(amount * 100),
                expiration: 3600,
                order_id: paymobOrderId,
                billing_data: billingData,
                currency: 'EGP', 
                integration_id: integrationId
            })
        });
        const keyData = await keyResponse.json();
        const paymentToken = keyData.token;

        if (!paymentToken) {
            console.error('❌ Paymob Payment Key Failed:', keyData);
            return { success: false, error: 'Failed to generate payment token.' };
        }

        console.log('✅ Payment Key Generated Successfully');

        // 4. Handle Wallet Payment (Extra Step)
        if (paymentMethod === 'wallet') {
            if (!walletNumber) {
                return { success: false, error: 'Wallet number is required for wallet payments.' };
            }

            console.log('📱 Initiating Wallet Pay Request...');
            const payResponse = await fetch('https://accept.paymob.com/api/acceptance/payments/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: {
                        identifier: walletNumber,
                        subtype: 'WALLET'
                    },
                    payment_token: paymentToken
                })
            });
            
            const payData = await payResponse.json();
            
            if (payData.redirect_url) {
                return { success: true, paymentUrl: payData.redirect_url };
            } else if (payData.iframe_url) {
                return { success: true, paymentUrl: payData.iframe_url };
            } else {
                console.error('❌ Wallet Pay Request Failed:', payData);
                return { success: false, error: 'Wallet payment request failed.' };
            }
        }

        // 5. Card Payment (Iframe URL)
        if (!config.iframeId) {
            return { success: false, error: 'Iframe ID is not configured in Admin Settings.' };
        }
        
        return {
            success: true,
            paymentUrl: `https://accept.paymob.com/api/acceptance/iframes/${config.iframeId}?payment_token=${paymentToken}`
        };

    } catch (error: unknown) {
        console.error('Paymob Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: `Paymob Error: ${errorMessage}` };
    }
}
