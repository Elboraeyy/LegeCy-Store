'use server';

import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { hashPassword } from '@/lib/auth/password';
import { sendPasswordResetEmail } from '@/lib/services/emailService';
import { logger } from '@/lib/logger';

interface ResetResult {
  success: boolean;
  error?: string;
}

// Request password reset - sends email with token
export async function requestPasswordReset(email: string): Promise<ResetResult> {
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      logger.info('Password reset requested for non-existent email', { email });
      return { success: true };
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { 
        email: user.email,
        purpose: 'password_reset'
      }
    });

    // Create new token
    await prisma.verificationToken.create({
      data: {
        email: user.email,
        token,
        purpose: 'password_reset',
        expiresAt
      }
    });

    // Send email
    await sendPasswordResetEmail({
      email: user.email,
      resetToken: token,
      userName: user.name || undefined
    });

    logger.info('Password reset email sent', { email: user.email });
    return { success: true };

  } catch (error) {
    logger.error('Password reset request error', { error });
    return { success: false, error: 'An error occurred. Please try again.' };
  }
}

// Verify reset token
export async function verifyResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
  try {
    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { token }
    });

    if (!tokenRecord) {
      return { valid: false };
    }

    if (tokenRecord.purpose !== 'password_reset') {
      return { valid: false };
    }

    if (tokenRecord.expiresAt < new Date()) {
      // Token expired, delete it
      await prisma.verificationToken.delete({
        where: { id: tokenRecord.id }
      });
      return { valid: false };
    }

    return { valid: true, email: tokenRecord.email };

  } catch (error) {
    logger.error('Token verification error', { error });
    return { valid: false };
  }
}

// Reset password with token
export async function resetPassword(token: string, newPassword: string): Promise<ResetResult> {
  try {
    // Verify token
    const verification = await verifyResetToken(token);
    
    if (!verification.valid || !verification.email) {
      return { success: false, error: 'Invalid or expired link' };
    }

    // Validate password
    if (newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password
    await prisma.user.update({
      where: { email: verification.email },
      data: { 
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });

    // Delete used token
    await prisma.verificationToken.deleteMany({
      where: { 
        email: verification.email,
        purpose: 'password_reset'
      }
    });

    logger.info('Password reset successful', { email: verification.email });
    return { success: true };

  } catch (error) {
    logger.error('Password reset error', { error });
    return { success: false, error: 'An error occurred. Please try again.' };
  }
}
