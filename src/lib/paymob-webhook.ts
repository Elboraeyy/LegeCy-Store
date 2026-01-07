/**
 * Paymob Webhook HMAC Verification
 * 
 * Verifies the authenticity of incoming Paymob webhook callbacks
 * using HMAC-SHA512 signature verification.
 */

import crypto from 'crypto';
import { getPaymobConfig } from './paymob';

// The exact order of fields used in Paymob HMAC calculation
const HMAC_FIELDS = [
  'amount_cents',
  'created_at',
  'currency',
  'error_occured',
  'has_parent_transaction',
  'id',
  'integration_id',
  'is_3d_secure',
  'is_auth',
  'is_capture',
  'is_refunded',
  'is_standalone_payment',
  'is_voided',
  'order',
  'owner',
  'pending',
  'source_data.pan',
  'source_data.sub_type',
  'source_data.type',
  'success'
] as const;

/**
 * Verifies the HMAC signature from Paymob webhook
 * 
 * @param requestBody - The full webhook request body
 * @param hmacHeader - The HMAC header value from the request
 * @returns true if signature is valid, false otherwise
 */
export async function verifyPaymobWebhook(
  requestBody: Record<string, unknown>,
  hmacHeader: string
): Promise<boolean> {
  try {
    const config = await getPaymobConfig();
    
    if (!config.hmacSecret) {
      console.error('❌ Paymob HMAC Secret not configured');
      return false;
    }

    if (!hmacHeader) {
      console.error('❌ No HMAC header received');
      return false;
    }

    // Extract the transaction object
    const obj = requestBody.obj as Record<string, unknown> | undefined;
    if (!obj) {
      console.error('❌ No obj field in webhook body');
      return false;
    }

    const sourceData = (obj.source_data || {}) as Record<string, unknown>;

    // Build the concatenated string in the exact order Paymob expects
    const concatenated = HMAC_FIELDS.map(field => {
      if (field.startsWith('source_data.')) {
        const subField = field.replace('source_data.', '');
        return String(sourceData[subField] ?? '');
      }
      // Special handling for 'order' field which is actually 'order.id'
      if (field === 'order') {
        const order = obj.order as Record<string, unknown> | undefined;
        return String(order?.id ?? obj.order ?? '');
      }
      return String(obj[field] ?? '');
    }).join('');

    // Calculate HMAC-SHA512
    const calculatedHmac = crypto
      .createHmac('sha512', config.hmacSecret)
      .update(concatenated)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(calculatedHmac, 'hex'),
      Buffer.from(hmacHeader, 'hex')
    );

    if (!isValid) {
      console.error('❌ HMAC verification failed');
      console.error('Expected:', calculatedHmac);
      console.error('Received:', hmacHeader);
    }

    return isValid;
  } catch (error) {
    console.error('❌ HMAC verification error:', error);
    return false;
  }
}

/**
 * Extracts transaction details from Paymob webhook
 */
export function extractPaymobTransaction(requestBody: Record<string, unknown>) {
  const obj = requestBody.obj as Record<string, unknown> | undefined;
  
  if (!obj) {
    return null;
  }

  const order = obj.order as Record<string, unknown> | undefined;
  
  return {
    transactionId: String(obj.id || ''),
    orderId: String(order?.merchant_order_id || order?.id || ''),
    success: Boolean(obj.success),
    pending: Boolean(obj.pending),
    amountCents: Number(obj.amount_cents || 0),
    currency: String(obj.currency || 'EGP'),
    errorOccured: Boolean(obj.error_occured),
    isRefunded: Boolean(obj.is_refunded),
    isVoided: Boolean(obj.is_voided),
    integrationId: String(obj.integration_id || ''),
    createdAt: String(obj.created_at || ''),
  };
}
