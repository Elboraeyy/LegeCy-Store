import { NextRequest, NextResponse } from 'next/server';
import { validateCustomerSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
    try {
        // Validate user session
        const { user } = await validateCustomerSession();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

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

        // Prepare Cloudinary upload
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            console.error('Cloudinary config missing');
            return NextResponse.json({ error: 'Upload configuration error' }, { status: 500 });
        }

        // Create form data for Cloudinary
        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append('file', file);
        cloudinaryFormData.append('upload_preset', uploadPreset);
        cloudinaryFormData.append('folder', 'avatars');

        // Upload to Cloudinary
        const uploadResponse = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
                method: 'POST',
                body: cloudinaryFormData,
            }
        );

        if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            console.error('Cloudinary upload failed:', errorData);
            return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
        }

        const result = await uploadResponse.json();

        return NextResponse.json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
