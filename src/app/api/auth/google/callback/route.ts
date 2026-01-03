import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/login?error=google_auth_failed', request.url));
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;

    // 1. Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokens.error_description || 'Failed to get tokens');

    // 2. Get User Info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const profile = await userRes.json();

    // 3. Find or Create User
    let user = await prisma.user.findUnique({ where: { email: profile.email } });

    if (!user) {
        user = await prisma.user.create({
            data: {
                email: profile.email,
                name: profile.name,
                googleId: profile.id,
                image: profile.picture,
                emailVerified: new Date(),
                passwordHash: '' // No password for social users
            }
        });
    } else {
        // Link Google ID if not linked
        if (!user.googleId) {
            await prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.id, image: profile.picture, emailVerified: new Date() }
            });
        }
    }

    // 4. Create Session (using existing logic pattern)
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.session.create({
        data: {
            id: sessionId,
            userId: user.id,
            expiresAt
        }
    });

    // 5. Set Cookie
    (await cookies()).set('auth_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiresAt,
        path: '/'
    });

    return NextResponse.redirect(new URL('/', request.url));

  } catch (err: unknown) {
    console.error('Google Auth Error:', err);
    return NextResponse.redirect(new URL('/login?error=google_auth_error', request.url));
  }
}
