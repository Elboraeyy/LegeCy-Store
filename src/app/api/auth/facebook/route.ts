import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/facebook/callback`;
  
  if (!clientId) {
    return NextResponse.json({ error: 'Facebook Client ID missing' }, { status: 500 });
  }

  const scope = 'email,public_profile';
  const url = `https://www.facebook.com/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=facebook_auth`;

  return NextResponse.redirect(url);
}
