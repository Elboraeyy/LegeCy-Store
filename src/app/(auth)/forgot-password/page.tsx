'use client';

import { useState } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/lib/actions/password-reset';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }

        setIsLoading(true);

        try {
            const result = await requestPasswordReset(email);
            
            if (result.success) {
                setIsSuccess(true);
                toast.success('Reset link has been sent');
            } else {
                toast.error(result.error || 'An error occurred');
            }
        } catch {
            toast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div style={{ 
                minHeight: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#FCF8F3',
                padding: '20px'
            }}>
                <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '48px',
                    maxWidth: '420px',
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}>
                    <div style={{
                        width: '70px',
                        height: '70px',
                        background: 'rgba(18, 64, 60, 0.1)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        fontSize: '32px'
                    }}>
                        ✉️
                    </div>
                    <h2 style={{ color: '#12403C', marginBottom: '16px', fontSize: '24px', fontFamily: "'Playfair Display', serif" }}>
                        Check Your Email
                    </h2>
                    <p style={{ color: '#5c6b66', lineHeight: 1.6, marginBottom: '24px' }}>
                        If an account exists for <strong>{email}</strong>, 
                        you will receive an email with a password reset link.
                    </p>
                    <p style={{ color: '#a3b8b0', fontSize: '14px', marginBottom: '24px' }}>
                        Didn&apos;t receive the email? Check your spam folder.
                    </p>
                    <Link 
                        href="/login" 
                        style={{
                            display: 'inline-block',
                            color: '#d4af37',
                            fontWeight: 600,
                            textDecoration: 'none'
                        }}
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: '#FCF8F3',
            padding: '20px'
        }}>
            <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '48px',
                maxWidth: '420px',
                width: '100%',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Link href="/" style={{ 
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '28px',
                        color: '#12403C',
                        textDecoration: 'none',
                        fontWeight: 600
                    }}>
                        Legacy
                    </Link>
                </div>

                <h2 style={{ 
                    textAlign: 'center', 
                    color: '#12403C', 
                    marginBottom: '12px',
                    fontSize: '24px',
                    fontFamily: "'Playfair Display', serif"
                }}>
                    Forgot Password?
                </h2>
                <p style={{ 
                    textAlign: 'center', 
                    color: '#5c6b66', 
                    marginBottom: '32px',
                    fontSize: '15px'
                }}>
                    Enter your email and we&apos;ll send you a reset link
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ 
                            display: 'block', 
                            marginBottom: '8px', 
                            fontWeight: 700,
                            fontSize: '12px',
                            color: '#12403C',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            style={{
                                width: '100%',
                                padding: '16px',
                                border: '1px solid #d1cfca',
                                borderRadius: '8px',
                                fontSize: '15px',
                                outline: 'none',
                                transition: 'all 0.2s',
                                background: '#ffffff',
                                color: '#12403C'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '14px 24px',
                            background: '#12403C',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '999px',
                            fontSize: '13px',
                            fontWeight: 700,
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1,
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(18, 64, 60, 0.2)'
                        }}
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <p style={{ 
                    textAlign: 'center', 
                    marginTop: '24px', 
                    fontSize: '14px',
                    color: '#5c6b66'
                }}>
                    Remember your password?{' '}
                    <Link href="/login" style={{ color: '#d4af37', fontWeight: 600, textDecoration: 'none' }}>
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}
