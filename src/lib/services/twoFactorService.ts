import { hash, compare } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/services/emailService';

// 2FA Configuration
const OTP_EXPIRY_MINUTES = 10;
const OTP_LENGTH = 6;

/**
 * Generate, hash, and send a 2FA token to the user
 */
export async function generateAndSendTwoFactorToken(userId: string, email: string): Promise<boolean> {
    try {
        // 1. Generate numeric OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 2. Hash it
        const hashedToken = await hash(otp, 10);

        // 3. Set expiry
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        // 4. Save to DB
        await prisma.adminUser.update({
            where: { id: userId },
            data: {
                twoFactorSecret: hashedToken, // Reusing this field for storing hashed OTP (ephemeral)
                twoFactorExpiresAt: expiresAt
            }
        });

        // 5. Send Email
        await sendEmail({
            to: email,
            subject: '🔐 Admin Login Verification Code',
            html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Admin Login Verification</h2>
          <p>Your verification code is:</p>
          <div style="background: #f4f4f5; padding: 15px; font-size: 24px; letter-spacing: 5px; font-weight: bold; display: inline-block; border-radius: 8px;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            This code will expire in ${OTP_EXPIRY_MINUTES} minutes.
          </p>
          <p style="color: #888; font-size: 12px;">
            If you did not request this, please contact support immediately.
          </p>
        </div>
      `
        });

        return true;
    } catch (error) {
        console.error('Failed to generate/send 2FA:', error);
        return false;
    }
}

/**
 * Verify a submitted 2FA token
 */
export async function verifyTwoFactorToken(userId: string, token: string): Promise<boolean> {
    try {
        const user = await prisma.adminUser.findUnique({
            where: { id: userId }
        });

        if (!user || !user.twoFactorSecret || !user.twoFactorExpiresAt) {
            return false;
        }

        // Check expiry
        if (user.twoFactorExpiresAt < new Date()) {
            return false;
        }

        // Verify hash
        const isValid = await compare(token, user.twoFactorSecret);

        if (isValid) {
            // Clear the token after successful use to prevent replay
            await prisma.adminUser.update({
                where: { id: userId },
                data: {
                    twoFactorSecret: null,
                    twoFactorExpiresAt: null
                }
            });
        }

        return isValid;
    } catch (error) {
        console.error('2FA verification error:', error);
        return false;
    }
}

// For future TOTP implementation
export async function generateTwoFactorSecret(userId: string) {
    // Placeholder
    return "NOT_IMPLEMENTED";
}

export async function enableTwoFactor(userId: string, token: string) {
    // Placeholder
    return false;
}
