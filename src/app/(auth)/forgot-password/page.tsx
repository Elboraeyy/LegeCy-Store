'use client';

import { useState } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/lib/actions/password-reset';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';

export default function ForgotPasswordPage() {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email) {
            toast.error(t.auth.enter_email);
            return;
        }

        setIsLoading(true);

        try {
            const result = await requestPasswordReset(email);
            
            if (result.success) {
                setIsSuccess(true);
                toast.success(t.auth.send_link_success);
            } else {
                toast.error(result.error || t.messages.error_occurred);
            }
        } catch {
            toast.error(t.messages.error_occurred);
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
                        {t.auth.check_email}
                    </h2>
                    <p style={{ color: '#5c6b66', lineHeight: 1.6, marginBottom: '24px' }}>
                        {t.auth.email_sent_desc.replace('{email}', email)}
                    </p>
                    <p style={{ color: '#a3b8b0', fontSize: '14px', marginBottom: '24px' }}>
                        {t.auth.didnt_receive_email}
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

                        {t.auth.back_to_login}
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
                    {t.auth.forgot_password_title}
                </h2>
                <p style={{ 
                    textAlign: 'center', 
                    color: '#5c6b66', 
                    marginBottom: '32px',
                    fontSize: '15px'
                }}>
                    {t.auth.forgot_password_desc}
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
                            {t.auth.email}
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
                        {isLoading ? t.auth.sending : t.auth.send_reset_link}
                    </button>
                </form>

                <p style={{ 
                    textAlign: 'center', 
                    marginTop: '24px', 
                    fontSize: '14px',
                    color: '#5c6b66'
                }}>
                    {t.auth.remember_password}{' '}
                    <Link href="/login" style={{ color: '#d4af37', fontWeight: 600, textDecoration: 'none' }}>
                        {t.auth.sign_in}
                    </Link>
                </p>
            </div>
        </div>
    );
}
