
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

export async function initiatePaymobPayment(order: PaymobOrderInput, amount: number) {
    if (!PAYMOB_API_KEY || !PAYMOB_INTEGRATION_ID) {
        console.warn("Paymob credentials not found in env. Simulating payment.");
        // Simulate a payment URL for testing
        return {
            success: true,
            paymentUrl: `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID || '123456'}?payment_token=SIMULATED_TOKEN`
        };
    }

    try {
        // 1. Authentication Request
        const authResponse = await fetch('https://accept.paymob.com/api/auth/tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: PAYMOB_API_KEY })
        });
        const authData = await authResponse.json();
        const token = authData.token;

        // 2. Order Registration API
        const orderResponse = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                auth_token: token,
                delivery_needed: "false",
                amount_cents: amount * 100,
                currency: "EGP",
                merchant_order_id: order.id,
                items: [] // Optional
            })
        });
        const orderData = await orderResponse.json();
        const paymobOrderId = orderData.id;

        // 3. Payment Key Request
        const keyResponse = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                auth_token: token,
                amount_cents: amount * 100,
                expiration: 3600,
                order_id: paymobOrderId,
                billing_data: {
                    email: order.customerEmail,
                    first_name: order.customerName.split(' ')[0] || "Customer",
                    last_name: order.customerName.split(' ').slice(1).join(' ') || "Name",
                    phone_number: order.customerPhone,
                    shipping_data: {
                        email: order.customerEmail,
                        first_name: order.customerName.split(' ')[0],
                        last_name: order.customerName.split(' ').slice(1).join(' '),
                        phone_number: order.customerPhone,
                        street: order.shippingAddress,
                        building: "NA",
                        floor: "NA",
                        apartment: "NA",
                        city: order.shippingCity,
                        country: "EG"
                    },
                    currency: "EGP",
                    integration_id: PAYMOB_INTEGRATION_ID
                },
                currency: "EGP", 
                integration_id: PAYMOB_INTEGRATION_ID
            })
        });
        const keyData = await keyResponse.json();
        const paymentToken = keyData.token;

        return {
            success: true,
            paymentUrl: `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`
        };

    } catch (error) {
        console.error("Paymob Error:", error);
        return { success: false, error: "Payment initiation failed" };
    }
}
