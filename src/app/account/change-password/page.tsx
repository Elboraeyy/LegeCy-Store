'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { changePassword } from '@/lib/actions/auth';
import { useLanguage } from '@/context/LanguageContext';

export default function ChangePasswordPage() {
    const { t, language } = useLanguage();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword.length < 8) {
            toast.error(t.account.password_page.min_chars.replace('{count}', '8'));
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error(t.account.password_page.mismatch);
            return;
        }

        setIsLoading(true);

        try {
            const result = await changePassword(currentPassword, newPassword);
            
            if (result.success) {
                toast.success(t.account.password_page.success);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                toast.error(result.error || (language === 'ar' ? 'فشل تغيير كلمة المرور' : 'Failed to change password'));
            }
        } catch {
            toast.error(t.common.error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <section className="shop-hero">
                <div className="container">
                    <h1 className="fade-in">{t.account.password_page.title}</h1>
                    <p className="fade-in">{t.account.password_page.subtitle}</p>
                </div>
            </section>

            <section className="container" style={{ marginBottom: "80px" }}>
                <div style={{ maxWidth: "480px", margin: "0 auto" }}>
                    <Link 
                        href="/account" 
                        style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '32px',
                            color: 'var(--text-muted)',
                            textDecoration: 'none',
                            fontSize: '14px'
                        }}
                    >
                        {language === 'ar' ? '← ' : ''}
                        {t.account.orders_page.back_to_account}
                        {language !== 'ar' ? ' ←' : ''}
                    </Link>

                    <div style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '40px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
                    }}>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ 
                                    display: 'block', 
                                    marginBottom: '8px', 
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    color: '#12403C'
                                }}>
                                    {t.account.password_page.current_password}
                                </label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
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

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ 
                                    display: 'block', 
                                    marginBottom: '8px', 
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    color: '#12403C'
                                }}>
                                    {t.account.password_page.new_password}
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
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
                                    {t.account.password_page.min_chars.replace('{count}', '8')}
                                </span>
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ 
                                    display: 'block', 
                                    marginBottom: '8px', 
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    color: '#12403C'
                                }}>
                                    {t.account.password_page.confirm_password}
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
                                    background: '#12403C',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '30px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    opacity: isLoading ? 0.7 : 1
                                }}
                            >
                                {isLoading ? t.account.password_page.updating : t.account.password_page.update_btn}
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        </main>
    );
}
