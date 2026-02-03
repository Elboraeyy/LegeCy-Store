import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const SESSION_COOKIE_NAME = 'auth_session';

export async function POST(request: NextRequest) {
    try {
        // Read session cookie directly (bypass cache for API routes)
        const cookieStore = await cookies();
        const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

        console.log('Avatar upload - Session cookie:', sessionId ? 'Found' : 'Not found');

        if (!sessionId) {
            return NextResponse.json({ error: 'No session' }, { status: 401 });
        }

        // Validate session directly
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: { user: true }
        });

        console.log('Avatar upload - Session db lookup:', session ? `Found user: ${session.user?.id}` : 'Not found');

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        // Check expiration
        if (Date.now() > session.expiresAt.getTime()) {
            return NextResponse.json({ error: 'Session expired' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        console.log('Avatar upload - File received:', file.name, file.type, file.size);

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }, { status: 400 });
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
        }

        // Convert file to base64 for Cloudinary upload
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64File = `data:${file.type};base64,${buffer.toString('base64')}`;

        console.log('Avatar upload - Uploading to Cloudinary...');

        // Upload to Cloudinary using signed upload
        const result = await cloudinary.uploader.upload(base64File, {
            folder: 'avatars',
            resource_type: 'image',
            transformation: [
                { width: 200, height: 200, crop: 'fill', gravity: 'face' },
                { quality: 'auto', fetch_format: 'auto' }
            ]
        });

        console.log('Avatar upload - Success:', result.secure_url);

        return NextResponse.json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
        });

    } catch (error) {
        console.error('Avatar upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
