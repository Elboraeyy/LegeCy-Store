import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import crypto from 'crypto';

export type VerificationPurpose = 'email_verification' | 'password_reset';

/**
 * Stub for generating a verification token.
 * In production, this should:
 * 1. Check for existing token and reuse or delete.
 * 2. Generate a crypto-safe random token.
 * 3. Store in DB.
 * 4. Send Email via a provider (Resend, SendGrid, etc).
 */
export async function generateVerificationToken(email: string, purpose: VerificationPurpose) {
    const token = crypto.randomUUID(); // Simple UUID for now
    const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

    const existingToken = await prisma.verificationToken.findFirst({
        where: { email }
    });

    if (existingToken) {
        await prisma.verificationToken.delete({
            where: { id: existingToken.id }
        });
    }

    const verificationToken = await prisma.verificationToken.create({
        data: {
            email,
            token,
            expiresAt: expires,
            purpose
        }
    });

    // TODO: Send Email Here
    console.log(`[STUB] Sending ${purpose} email to ${email} with token: ${token}`);

    return verificationToken;
}

/**
 * Stub for verifying a token.
 */
export async function verifyToken(token: string, purpose: VerificationPurpose) {
    const existingToken = await prisma.verificationToken.findUnique({
        where: { token }
    });

    if (!existingToken) {
        return { error: "Token not found" };
    }

    const hasExpired = new Date(Date.now()) > existingToken.expiresAt;

    if (hasExpired) {
        return { error: "Token expired" };
    }

    if (existingToken.purpose !== purpose) {
        return { error: "Invalid token purpose" };
    }

    // Is Valid
    return { success: true, token: existingToken };
}
