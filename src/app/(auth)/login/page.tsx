'use client';

import { useActionState } from 'react';
import { login } from '@/lib/actions/auth';
import Link from 'next/link';
import { useUncontrolledFormPersistence } from '@/hooks/useFormPersistence';
import { useLanguage } from '@/context/LanguageContext';

function SubmitButton() {
    const { t } = useLanguage();
    return (
        <button 
            type="submit" 
            style={{ 
                width: '100%', 
                marginTop: '24px',
                padding: '14px 24px',
                background: '#12403C',
                color: '#fff',
                border: 'none',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: '700',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(18, 64, 60, 0.2)'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(18, 64, 60, 0.3)';
                e.currentTarget.style.background = '#0e3330';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(18, 64, 60, 0.2)';
                e.currentTarget.style.background = '#12403C';
            }}
        >

            {t.auth.sign_in}
        </button>
    );
}

export default function LoginPage() {
    const [state, formAction] = useActionState(login, null);
    const { containerRef } = useUncontrolledFormPersistence('login_form');

    const { t } = useLanguage();

    return (
        <div className="auth-container" style={{ 
            minHeight: '100vh', 
            display: 'grid', 
            gridTemplateColumns: '1fr 2fr',
            background: '#FCF8F3'
        }}>
            {/* Global Animations & Responsive Styles */}
             <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fade-in { animation: fadeIn 0.6s ease-out forwards; }
                .delay-1 { animation-delay: 0.1s; }
                .delay-2 { animation-delay: 0.2s; }
                .delay-3 { animation-delay: 0.3s; }
                
                .auth-input:focus {
                    border-color: #12403C !important;
                    box-shadow: 0 0 0 4px rgba(18, 64, 60, 0.1) !important;
                }

                /* Default: Hidden on Desktop */
                .scroll-indicator { display: none; }

                @media (max-width: 900px) {
                    .auth-container { 
                        display: block !important;
                        background: #12403C !important;
                        height: 100vh;
                        overflow-y: scroll; /* Allow vertical scroll */
                        scroll-snap-type: y mandatory; /* Force snap points */
                        scroll-behavior: smooth;
                    }

                    /* 1. Green Header (Top 1/3) */
                    .auth-brand-side { 
                        height: 35vh !important; /* Exactly 1/3 approx */
                        width: 100% !important;
                        padding: 24px 20px !important;
                        scroll-snap-align: start; /* Snap point 1 */
                        
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: center !important;
                        align-items: center !important;
                        
                        position: relative;
                        z-index: 1;
                    }

                    /* Compact Text Scaling for 35vh */
                    .auth-brand-side .brand-title { 
                        display: block !important; 
                        font-size: 32px !important; /* Readable but compact */
                        line-height: 1.1 !important;
                        margin-bottom: 8px !important;
                        text-align: center;
                    }
                    .auth-brand-side .brand-subtitle { 
                        display: block !important; 
                        font-size: 10px !important;
                        margin-bottom: 8px !important;
                        text-align: center;
                        opacity: 0.8 !important;
                    }
                    /* User requested ALL text visible */
                    .auth-brand-side .brand-quote { 
                        display: block !important; 
                        font-size: 11px !important; /* Small enough to fit */
                        line-height: 1.4 !important;
                        margin-bottom: 0 !important;
                        text-align: center;
                        max-width: 90% !important;
                        opacity: 0.7 !important;
                    }
                    .auth-brand-side .brand-footer { 
                        display: none !important; /* Footer might be too much for 35vh, hiding to prioritize key text */
                    }
                    
                    .mobile-brand-header { display: none !important; }

                    /* 2. White Form Sheet */
                    .auth-form-side { 
                        height: 100vh !important; /* Full screen height */
                        width: 100% !important;
                        scroll-snap-align: start; /* Snap point 2 */
                        scroll-snap-stop: always; /* Force stop here */
                        
                        background: #FCF8F3 !important;
                        border-radius: 30px 30px 0 0 !important;
                        margin-top: -20px !important; /* Overlap */
                        padding: 40px 24px !important;
                        
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        
                        position: relative;
                        z-index: 2;
                        box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
                    }
                    
                    .auth-form-side > div {
                        max-width: 100% !important;
                        width: 100% !important;
                        margin: 0 auto;
                    }

                    /* Drag Handle Indicator */
                     .auth-form-side::before {
                        content: '';
                        display: block;
                        width: 40px;
                        height: 4px;
                        background: #d1cfca;
                        border-radius: 2px;
                        position: absolute;
                        top: 12px;
                        left: 50%;
                        transform: translateX(-50%);
                    }
                    
                    .auth-form-side h2 { display: block !important; text-align: center; font-size: 24px !important; }
                }
            `}</style>

            {/* Left: Brand Side (Green) */}
            <div style={{ 
                background: '#12403C', 
                padding: '60px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center',
                color: '#FCF8F3',
                position: 'relative',
                overflow: 'hidden'
            }} className="auth-brand-side">
                
                {/* Decorative background circle */}
                <div style={{
                    position: 'absolute',
                    top: '-10%',
                    left: '-10%',
                    width: '600px',
                    height: '600px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
                    zIndex: 0
                }} />

                {/* Mobile Scroll Indicator */}
                <div className="scroll-indicator">
                    <span style={{ marginBottom: '8px' }}>{t.auth.sign_in}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 5v14M5 12l7 7 7-7"/>
                    </svg>
                </div>

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '440px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ 
                        fontFamily: "'Playfair Display', serif", 
                        fontSize: '14px', 
                        letterSpacing: '2px', 
                        textTransform: 'uppercase',
                        color: '#d4af37',
                        marginBottom: '20px',
                        opacity: 0.9
                    }} className="fade-in brand-subtitle">
                        {t.auth.welcome_back}
                    </div>

                    <div style={{ 
                        fontFamily: "'Playfair Display', serif", 
                        fontSize: '56px', 
                        lineHeight: '1.1',
                        marginBottom: '32px',
                        color: '#f4f3f0'
                    }} className="fade-in delay-1 brand-title" dangerouslySetInnerHTML={{ __html: t.auth.curated_excellence.replace('.', '<br/>.') }}>
                    </div>
                    
                    <p style={{ 
                        fontSize: '18px', 
                        lineHeight: '1.6', 
                        color: '#a3b8b0',
                        marginBottom: '56px',
                        fontWeight: 300
                    }} className="fade-in delay-2 brand-quote">
                        {t.auth.style_quote}
                    </p>
                    
                    <div style={{ 
                        display: 'flex', 
                        gap: '24px', 
                        alignItems: 'center', 
                        fontSize: '11px', 
                        letterSpacing: '2px', 
                        textTransform: 'uppercase',
                        color: '#5c6b66',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        paddingTop: '32px'

                    }} className="fade-in delay-3 brand-footer">
                        <span>{t.auth.new_collections}</span>
                        <div style={{width: 4, height: 4, background: '#d4af37', borderRadius: '50%'}} />
                        <span>{t.auth.member_exclusive}</span>
                    </div>
                </div>
            </div>

            {/* Right: Login Form (Beige/Light) */}
            <div className="auth-form-side" style={{ 
                background: '#FCF8F3', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '40px'
            }}>
                <div style={{ width: '100%', maxWidth: '400px' }} className="fade-in">
                    <div style={{ marginBottom: '48px', textAlign: 'center' }}>
                        <h2 style={{ 
                            fontSize: '32px', 
                            color: '#1a3c34', 
                            marginBottom: '12px', 
                            fontFamily: "'Playfair Display', serif" 
                        }}>
                            {t.auth.sign_in}
                        </h2>
                        <p style={{ color: '#5c6b66', fontSize: '15px' }}>
                            {t.auth.dont_have_account.split('?')[0]}? <Link href="/signup" style={{ color: '#d4af37', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }} className="hover:text-primary">{t.auth.sign_up}</Link>
                        </p>
                    </div>

                    <form ref={containerRef} action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#1a3c34', textTransform: 'uppercase', letterSpacing: '1px' }}>{t.auth.email}</label>
                            <input 
                                name="email" 
                                type="email" 
                                autoComplete="email" 
                                required 
                                placeholder="you@example.com"
                                className="auth-input"
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    background: '#fff',
                                    border: '1px solid #d1cfca',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    color: '#12403C'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: '#1a3c34', textTransform: 'uppercase', letterSpacing: '1px' }}>{t.auth.password}</label>
                                <Link href="/forgot-password" style={{ fontSize: '12px', color: '#d4af37', textDecoration: 'none', fontWeight: 500 }}>{t.auth.forgot_password}</Link>
                            </div>
                            <input 
                                name="password" 
                                type="password" 
                                autoComplete="current-password" 
                                required 
                                placeholder="••••••••"
                                className="auth-input"
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    background: '#fff',
                                    border: '1px solid #d1cfca',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    color: '#12403C'
                                }}
                            />
                        </div>

                        {state?.error && (
                            <div style={{ 
                                color: '#b91c1c', 
                                background: '#fef2f2', 
                                border: '1px solid #fca5a5', 
                                padding: '12px', 
                                borderRadius: '8px', 
                                fontSize: '13px', 
                                textAlign: 'center',
                                fontWeight: 500
                            }}>
                                {state.error}
                            </div>
                        )}

                        <SubmitButton />
                    </form>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '32px 0 24px 0' }}>
                        <div style={{ flex: 1, height: '1px', background: '#d1cfca' }}></div>
                        <span style={{ fontSize: '12px', color: '#5c6b66', textTransform: 'uppercase', letterSpacing: '1px' }}>{t.auth.or_login_with}</span>
                        <div style={{ flex: 1, height: '1px', background: '#d1cfca' }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                        {/* Google */}
                        <a
                            href="/api/auth/google"
                            style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                border: '1px solid #d1cfca',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#fff',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                            }}
                            className="hover:scale-105 hover:shadow-md"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                        </a>

                        {/* Facebook */}
                        <a
                            href="/api/auth/facebook"
                            style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                border: '1px solid #d1cfca',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#fff',
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                            }}
                            className="hover:scale-105 hover:shadow-md"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                        </a>
                    </div>

                    <p style={{ textAlign: 'center', marginTop: '40px', fontSize: '12px', color: '#a3b8b0' }}>
                        &copy; {new Date().getFullYear()} {t.footer.rights_reserved} {t.auth.secure_login}
                    </p>
                </div>
            </div>
        </div>
    );
}
