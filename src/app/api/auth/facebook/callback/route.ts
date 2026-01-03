import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/login?error=facebook_auth_failed', request.url));
  }

  try {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/facebook/callback`;

    // 1. Exchange code for access token
    const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${redirectUri}&client_secret=${clientSecret}&code=${code}`);

    const tokens = await tokenRes.json();
    
    if (tokens.error) {
        throw new Error(tokens.error.message || 'Failed to get Facebook tokens');
    }

    // 2. Get User Info
    const userRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${tokens.access_token}`);
    
    const profile = await userRes.json();
    
    if (profile.error) {
        throw new Error(profile.error.message || 'Failed to get Facebook user info');
    }

    // Capture email safely (sometimes FB doesn't return email if phone registered)
    // If no email, we might need to handle it, but for now we assume email exists or fallback
    const email = profile.email || `${profile.id}@facebook.placeholder.com`; 

    // 3. Find or Create User
    // First, check by facebookId
    let user = await prisma.user.findFirst({ 
        where: { 
            OR: [
                { facebookId: profile.id },
                { email: email } // Fallback to email matching
            ]
        } 
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                email: email,
                name: profile.name,
                facebookId: profile.id,
                image: profile.picture?.data?.url || '',
                emailVerified: new Date(),
                passwordHash: '' // No password for social users
            }
        });
    } else {
        // Update user: Link Facebook ID if not linked, update image if needed
        const updateData: Prisma.UserUpdateInput = {};
        if (!user.facebookId) updateData.facebookId = profile.id;
        if (!user.image && profile.picture?.data?.url) updateData.image = profile.picture.data.url;
        
        if (Object.keys(updateData).length > 0) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: updateData
            });
        }
    }

    // 4. Create Session
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
    console.error('Facebook Auth Error:', err);
    return NextResponse.redirect(new URL('/login?error=facebook_auth_error', request.url));
  }
}
