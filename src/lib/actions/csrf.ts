'use server';

import { cookies } from 'next/headers';
import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a CSRF token and set it as a cookie
 * Call this on admin page load to ensure token is available
 */
export async function ensureCsrfToken(): Promise<string> {
    const cookieStore = await cookies();
    const existingToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
    
    // Return existing token if valid
    if (existingToken && existingToken.length === CSRF_TOKEN_LENGTH * 2) {
        return existingToken;
    }
    
    // Generate new token
    const token = crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
    
    cookieStore.set(CSRF_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 24 hours
    });

    return token;
}

/**
 * Get the current CSRF token without generating a new one
 */
export async function getCsrfToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(CSRF_COOKIE_NAME)?.value || null;
}
