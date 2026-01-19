import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Note: Web Crypto API is available globally in Edge runtime as `crypto`

/**
 * MIDDLEWARE
 * 
 * Responsibilities:
 * 1. Generate request ID for tracing
 * 2. Admin route protection
 * 3. Customer route protection
 */

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    
    // Generate unique request ID for tracing
    const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
    
    // Create response with request ID header
    const response = NextResponse.next();
    response.headers.set('x-request-id', requestId);
    
    // Security Headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // 0. Cron Job Protection (Secret Header Check)
    if (path.startsWith('/api/cron')) {
        const cronSecret = request.headers.get('Authorization') || request.headers.get('x-cron-secret');
        const validSecret = process.env.CRON_SECRET;

        // Strict check: Must match secret
        if (!validSecret || (cronSecret !== `Bearer ${validSecret}` && cronSecret !== validSecret)) {
            return NextResponse.json(
                { error: 'Unauthorized: Invalid Cron Secret' },
                { status: 401 }
            );
        }
        return response;
    }

    // 0.5 Rate Limiting (Sensitive Routes)
    const ip = (request as any).ip || '127.0.0.1';
    if (path.startsWith('/api/auth') || path.startsWith('/api/checkout')) {
        try {
            // Dynamic import to avoid edge startup issues if unused
            const { rateLimiter } = await import('./lib/ratelimit');
            const { success, remaining, reset } = await rateLimiter.limit(ip);

            response.headers.set('X-RateLimit-Limit', '10');
            response.headers.set('X-RateLimit-Remaining', remaining.toString());

            if (!success) {
                return NextResponse.json(
                    { error: 'Too Many Requests' },
                    { status: 429, headers: response.headers }
                );
            }
        } catch (e) {
            console.error('Rate Limit Error', e);
        }
    }

    // 1. Admin & Secured Routes Protection
    // Explicitly listing all administrative/internal API paths
    const securedRoutes = [
        '/admin',
        '/api/admin',
        '/api/pos',        // Point of Sale requires authentication
        '/api/upload',     // File uploads
        '/api/test-email', // Testing tools
        '/api/notify'      // Internal notifications
    ];

    if (securedRoutes.some(route => path.startsWith(route))) {
        
        // Allow public admin routes (login)
        if (path === '/admin/login' || path === '/api/admin/login') {
            response.headers.set('x-request-id', requestId);
            return response;
        }

        const adminSessionCookie = request.cookies.get('admin_auth_session')?.value;

        // Strict Check: No cookie = No entry
        if (!adminSessionCookie) {
            // API Request -> JSON 401
            if (path.startsWith('/api/')) {
                return NextResponse.json(
                    { 
                        error: { 
                            code: 'UNAUTHORIZED', 
                            message: 'Admin session required',
                            requestId 
                        } 
                    },
                    { 
                        status: 401,
                        headers: { 'x-request-id': requestId }
                    }
                );
            }

            // Page Request -> Redirect to Login
            const loginUrl = new URL('/admin/login', request.url);
            loginUrl.searchParams.set('from', path);
            const redirectResponse = NextResponse.redirect(loginUrl);
            redirectResponse.headers.set('x-request-id', requestId);
            return redirectResponse;
        }

        // -----------------------------------------------------------------
        // CRITICAL SECURITY FIX: Validate Session Signature (Stateless)
        // -----------------------------------------------------------------
        // Use our Edge-compatible auth token verification
        // Logic: verification requires async crypto call, valid for generic Edge/Node
        // We import it dynamically or assume standard import works (it's using Web Crypto)
        // Note: We cannot easily await inside the sync flow if middleware was sync, but it's async so fine.

        let isValidSession = false;
        try {
            // Import dynamically to avoid issues if moved
            const { verifySignedToken } = await import('./lib/auth/authToken');
            const sessionId = await verifySignedToken(adminSessionCookie);
            if (sessionId) {
                isValidSession = true;
                // Optional: Pass the verified sessionId to downstream via header
                response.headers.set('x-admin-session-id', sessionId);
            }
        } catch (error) {
            console.error('Middleware Auth Error:', error);
        }

        if (!isValidSession) {
            // Invalid Signature -> Clear cookie and redirect
            if (path.startsWith('/api/')) {
                return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
            }
            const loginUrl = new URL('/admin/login', request.url);
            loginUrl.searchParams.set('from', path);
            loginUrl.searchParams.set('error', 'session_invalid');
            const resp = NextResponse.redirect(loginUrl);
            resp.cookies.delete('admin_auth_session');
            return resp;
        }
        
        // CSRF Protection for mutations
        const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
        if (mutationMethods.includes(request.method)) {
            // Skip CSRF for logout (form submit without JS)
            if (path === '/api/admin/logout') {
                return response;
            }
            
            // Skip CSRF for Next.js Server Actions (they have their own security)
            const isServerAction = request.headers.get('next-action');
            if (isServerAction) {
                return response;
            }
            
            const csrfToken = request.headers.get('x-csrf-token');
            const csrfCookie = request.cookies.get('csrf_token')?.value;
            
            if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
                return NextResponse.json(
                    { 
                        error: { 
                            code: 'CSRF_VALIDATION_FAILED', 
                            message: 'Invalid or missing CSRF token',
                            requestId 
                        } 
                    },
                    { 
                        status: 403,
                        headers: { 'x-request-id': requestId }
                    }
                );
            }
        }
        
        return response;
    }

    // 2. Customer Route Protection (Profile, Checkout)
    const protectedRoutes = ['/profile', '/checkout'];
    if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
        const session = request.cookies.get('auth_session')?.value;

        if (!session) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('from', request.nextUrl.pathname);
            const redirectResponse = NextResponse.redirect(loginUrl);
            redirectResponse.headers.set('x-request-id', requestId);
            return redirectResponse;
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public images/assets
         */
        '/((?!_next/static|_next/image|favicon.ico|images|public).*)',
    ],
};
