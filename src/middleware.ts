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

    // 1. Admin Route Protection (Pages & APIs)
    if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
        
        // Allow public admin routes (login)
        if (path === '/admin/login' || path === '/api/admin/login') {
            response.headers.set('x-request-id', requestId);
            return response;
        }

        const adminSession = request.cookies.get('admin_auth_session')?.value;

        // Strict Check: No cookie = No entry
        if (!adminSession) {
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
            const redirectResponse = NextResponse.redirect(loginUrl);
            redirectResponse.headers.set('x-request-id', requestId);
            return redirectResponse;
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
