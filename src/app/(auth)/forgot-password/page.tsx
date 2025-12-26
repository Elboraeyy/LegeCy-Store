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
                background: '#f4f3f0',
                padding: '20px'
            }}>
                <div style={{
                    background: '#fff',
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
                        background: '#dcfce7',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        fontSize: '32px'
                    }}>
                        ✉️
                    </div>
                    <h2 style={{ color: '#1a3c34', marginBottom: '16px', fontSize: '24px' }}>
                        Check Your Email
                    </h2>
                    <p style={{ color: '#666', lineHeight: 1.6, marginBottom: '24px' }}>
                        If an account exists for <strong>{email}</strong>, 
                        you will receive an email with a password reset link.
                    </p>
                    <p style={{ color: '#999', fontSize: '14px', marginBottom: '24px' }}>
                        Didn&apos;t receive the email? Check your spam folder.
                    </p>
                    <Link 
                        href="/login" 
                        style={{
                            display: 'inline-block',
                            color: '#1a3c34',
                            fontWeight: 600,
                            textDecoration: 'underline'
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
            background: '#f4f3f0',
            padding: '20px'
        }}>
            <div style={{
                background: '#fff',
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
                        color: '#1a3c34',
                        textDecoration: 'none'
                    }}>
                        Legacy
                    </Link>
                </div>

                <h2 style={{ 
                    textAlign: 'center', 
                    color: '#1a3c34', 
                    marginBottom: '12px',
                    fontSize: '24px'
                }}>
                    Forgot Password?
                </h2>
                <p style={{ 
                    textAlign: 'center', 
                    color: '#666', 
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
                            fontWeight: 600,
                            fontSize: '14px',
                            color: '#1a3c34'
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
                                padding: '14px 16px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '16px',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: '#1a3c34',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '30px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <p style={{ 
                    textAlign: 'center', 
                    marginTop: '24px', 
                    fontSize: '14px',
                    color: '#666'
                }}>
                    Remember your password?{' '}
                    <Link href="/login" style={{ color: '#d4af37', fontWeight: 600 }}>
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}
