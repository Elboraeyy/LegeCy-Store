'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { resetPassword, verifyResetToken } from '@/lib/actions/password-reset';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';

function ResetPasswordForm() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (token) {
            verifyResetToken(token).then((result: { valid: boolean }) => {
                setIsValidToken(result.valid);
            });
        } else {
            setIsValidToken(false);
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 8) {
            toast.error(t.auth.min_chars.replace('{count}', '8'));
            return;
        }

        if (password !== confirmPassword) {
            toast.error(t.auth.passwords_mismatch);
            return;
        }

        if (!token) return;

        setIsLoading(true);

        try {
            const result = await resetPassword(token, password);

            if (result.success) {
                setIsSuccess(true);
                toast.success(t.auth.reset_success);
                setTimeout(() => router.push('/login'), 2000);
            } else {
                toast.error(result.error || t.messages.error_occurred);
            }
        } catch {
            toast.error(t.messages.error_occurred);
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state
    if (isValidToken === null) {
        return (
            <div style={{ 
                minHeight: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#f4f3f0'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
                    <p>{t.auth.verifying}</p>
                </div>
            </div>
        );
    }

    // Invalid token
    if (!isValidToken) {
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
                        background: '#fee2e2',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        fontSize: '32px'
                    }}>
                        ❌
                    </div>
                    <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>
                        {t.auth.invalid_link}
                    </h2>
                    <p style={{ color: '#666', marginBottom: '24px' }}>
                        {t.auth.invalid_link_desc}
                    </p>
                    <Link 
                        href="/forgot-password"
                        className="btn btn-primary"
                    >
                        {t.auth.request_new_link}
                    </Link>
                </div>
            </div>
        );
    }

    // Success state
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
                        ✅
                    </div>
                    <h2 style={{ color: '#16a34a', marginBottom: '16px' }}>
                        {t.auth.password_changed}
                    </h2>
                    <p style={{ color: '#666', marginBottom: '24px' }}>
                        {t.auth.redirecting_login}
                    </p>
                </div>
            </div>
        );
    }

    // Reset form
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
                    {t.auth.create_new_password}
                </h2>
                <p style={{ 
                    textAlign: 'center', 
                    color: '#666', 
                    marginBottom: '32px',
                    fontSize: '15px'
                }}>
                    {t.auth.choose_strong_password}
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
                            {t.auth.new_password}
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={8}
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '16px',
                                outline: 'none'
                            }}
                        />
                        <span style={{ fontSize: '12px', color: '#888', marginTop: '4px', display: 'block' }}>
                            {t.auth.min_chars.replace('{count}', '8')}
                        </span>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ 
                            display: 'block', 
                            marginBottom: '8px', 
                            fontWeight: 600,
                            fontSize: '14px',
                            color: '#1a3c34'
                        }}>
                            {t.auth.confirm_password}
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '16px',
                                outline: 'none'
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
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >

                        {isLoading ? t.auth.saving : t.auth.save_password}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div style={{ 
                minHeight: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#f4f3f0'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
                    <p>Loading...</p>
                </div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
