import { cookies } from 'next/headers';
import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'csrf_token';

/**
 * Generates a new CSRF token and sets it as a cookie.
 * Returns the token so it can be passed to the frontend (e.g. in a hidden input or meta tag).
 */
export async function generateCsrfToken(): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    
    (await cookies()).set(CSRF_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    });

    return token;
}

/**
 * Verifies the CSRF token.
 * @param requestToken The token submitted in the request (body or header).
 */
export async function verifyCsrfToken(requestToken: string | undefined | null) {
    if (!requestToken) throw new Error('Missing CSRF token');
    
    const cookieToken = (await cookies()).get(CSRF_COOKIE_NAME)?.value;
    if (!cookieToken) throw new Error('Missing CSRF cookie');
    
    // Timing safe comparison
    const tokenBuffer = Buffer.from(requestToken);
    const cookieBuffer = Buffer.from(cookieToken);
    
    if (tokenBuffer.length !== cookieBuffer.length || !crypto.timingSafeEqual(tokenBuffer, cookieBuffer)) {
        throw new Error('Invalid CSRF token');
    }
}
