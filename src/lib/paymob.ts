
// Placeholder for Paymob Integration
// https://docs.paymob.com/docs/accept-payments

export const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
export const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
export const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;

interface PaymobOrderInput {
    id: string;
    customerEmail: string;
    customerName: string;
    customerPhone: string;
    shippingAddress: string;
    shippingCity: string;
}

export const PAYMOB_WALLET_INTEGRATION_ID = process.env.PAYMOB_WALLET_INTEGRATION_ID;

export async function initiatePaymobPayment(
    order: PaymobOrderInput, 
    amount: number, 
    paymentMethod: 'card' | 'wallet' = 'card',
    walletNumber?: string
) {
    if (!PAYMOB_API_KEY || !PAYMOB_INTEGRATION_ID) {
        console.warn("Paymob credentials not found in env. Simulating payment.");
        // Simulate a payment URL for testing
        return {
            success: true,
            paymentUrl: `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID || '123456'}?payment_token=SIMULATED_TOKEN`
        };
    }

    try {
        console.log(`🚀 Initiating Paymob ${paymentMethod} Payment for Order:`, order.id);

        const integrationId = paymentMethod === 'wallet' 
            ? Number(PAYMOB_WALLET_INTEGRATION_ID) 
            : Number(PAYMOB_INTEGRATION_ID);

        if (paymentMethod === 'wallet' && !integrationId) {
             throw new Error("Wallet Integration ID is missing");
        }

        // 1. Authentication Request
        const authResponse = await fetch('https://accept.paymob.com/api/auth/tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: PAYMOB_API_KEY })
        });
        const authData = await authResponse.json();
        const token = authData.token;

        if (!token) {
            console.error("❌ Paymob Auth Failed:", authData);
            throw new Error("Paymob Authentication Failed");
        }

        // 2. Order Registration API
        const orderResponse = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                auth_token: token,
                delivery_needed: "false",
                amount_cents: Math.round(amount * 100), // Ensure integer
                currency: "EGP",
                merchant_order_id: order.id,
                items: [] // Optional
            })
        });
        const orderData = await orderResponse.json();
        const paymobOrderId = orderData.id;

        if (!paymobOrderId) {
             console.error("❌ Paymob Order Registration Failed:", orderData);
             throw new Error("Paymob Order Registration Failed");
        }
        console.log("✅ Paymob Order ID:", paymobOrderId);

        // 3. Payment Key Request
        const billingData = {
            email: order.customerEmail,
            first_name: order.customerName.split(' ')[0] || "Customer",
            last_name: order.customerName.split(' ').slice(1).join(' ') || "Name",
            phone_number: order.customerPhone,
            apartment: "NA",
            floor: "NA",
            street: order.shippingAddress || "NA",
            building: "NA",
            shipping_method: "NA",
            postal_code: "NA",
            city: order.shippingCity || "Cairo",
            country: "EG",
            state: "NA"
        };
        
        console.log("📦 Requesting Payment Key with Data:", JSON.stringify(billingData, null, 2));

        const keyResponse = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                auth_token: token,
                amount_cents: Math.round(amount * 100),
                expiration: 3600,
                order_id: paymobOrderId,
                billing_data: billingData,
                currency: "EGP", 
                integration_id: integrationId
            })
        });
        const keyData = await keyResponse.json();
        const paymentToken = keyData.token;

        if (!paymentToken) {
            console.error("❌ Paymob Payment Key Failed:", keyData);
            throw new Error("Paymob Payment Key Generation Failed");
        }

        console.log("✅ Payment Key Generated Successfully");

        // 4. Handle Wallet Payment (Extra Step)
        if (paymentMethod === 'wallet') {
            if (!walletNumber) {
                throw new Error("Wallet number is required for wallet payments");
            }

            console.log("📱 Initiating Wallet Pay Request...");
            const payResponse = await fetch('https://accept.paymob.com/api/acceptance/payments/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: {
                        identifier: walletNumber,
                        subtype: "WALLET"
                    },
                    payment_token: paymentToken
                })
            });
            
            const payData = await payResponse.json();
            
            // For wallets, we get a redirect_url or iframe_url (usually redirect_url)
            if (payData.redirect_url) {
                return {
                    success: true,
                    paymentUrl: payData.redirect_url
                };
            }
             else if (payData.iframe_url) {
                 return {
                    success: true,
                    paymentUrl: payData.iframe_url
                 }
            } else {
                 console.error("❌ Wallet Pay Request Failed:", payData);
                 throw new Error("Wallet Payment Request Failed");
            }
        }

        // Card Payment (Iframe)
        return {
            success: true,
            paymentUrl: `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`
        };

    } catch (error) {
        console.error("Paymob Error:", error);
        return { success: false, error: "Payment initiation failed" };
    }
}
