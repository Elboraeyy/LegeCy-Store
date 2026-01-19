import { NextRequest } from 'next/server';

const ALG = { name: 'HMAC', hash: 'SHA-256' };
const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

// Get secret from env or throw error in production. Use fallback ONLY in dev.
const SECRET_KEY = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

if (!SECRET_KEY) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: AUTH_SECRET or NEXTAUTH_SECRET is not set in environment variables.');
  }
  console.warn('⚠️ WARNING: Using insecure default secret for development. Do NOT use this in production.');
}

const FINAL_SECRET = SECRET_KEY || 'dev-secret-do-not-use-in-prod';

/**
 * Sign a payload string with HMAC-SHA256
 */
async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    ENCODER.encode(secret),
    ALG,
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    ALG,
    key,
    ENCODER.encode(payload)
  );

  // Convert buffer to hex
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify a payload against a signature
 */
async function verify(payload: string, signature: string, secret: string): Promise<boolean> {
  const expected = await sign(payload, secret);
  return expected === signature;
}

/**
 * Create a signed token: "sessionId.signature"
 */
export async function createSignedToken(sessionId: string): Promise<string> {
  const signature = await sign(sessionId, FINAL_SECRET);
  return `${sessionId}.${signature}`;
}

/**
 * Verify a signed token and extract sessionId
 * Returns sessionId if valid, null otherwise
 */
export async function verifySignedToken(token: string): Promise<string | null> {
  if (!token || !token.includes('.')) return null;

  const [sessionId, signature] = token.split('.');
  if (!sessionId || !signature) return null;

  const isValid = await verify(sessionId, signature, FINAL_SECRET);
  return isValid ? sessionId : null;
}
