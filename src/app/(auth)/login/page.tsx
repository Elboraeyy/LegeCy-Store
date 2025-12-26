'use client';

import { useActionState } from 'react';
import { login } from '@/lib/actions/auth';
import Link from 'next/link';

function SubmitButton() {
    return (
        <button 
            type="submit" 
            style={{ 
                width: '100%', 
                marginTop: '24px',
                padding: '14px 24px',
                background: '#1a3c34',
                color: '#fff',
                border: 'none',
                borderRadius: '999px',
                fontSize: '13px',
                fontWeight: '700',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(26, 60, 52, 0.2)'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(26, 60, 52, 0.3)';
                e.currentTarget.style.background = '#142f29';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(26, 60, 52, 0.2)';
                e.currentTarget.style.background = '#1a3c34';
            }}
        >
            SIGN IN
        </button>
    );
}

export default function LoginPage() {
    const [state, formAction] = useActionState(login, null);

    return (
        <div className="auth-container" style={{ 
            minHeight: '100vh', 
            display: 'grid', 
            gridTemplateColumns: 'minmax(300px, 1.2fr) minmax(400px, 1.5fr)',
            background: '#f4f3f0'
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
                    border-color: #1a3c34 !important;
                    box-shadow: 0 0 0 4px rgba(26, 60, 52, 0.1) !important;
                }

                @media (max-width: 900px) {
                    .auth-brand-side { display: none !important; }
                    .auth-container { grid-template-columns: 1fr !important; }
                }
            `}</style>

            {/* Left: Brand Side (Green) */}
            <div style={{ 
                background: '#1a3c34', 
                padding: '80px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center',
                color: '#e8e6e1',
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

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '440px' }}>
                    <div style={{ 
                        fontFamily: "'Playfair Display', serif", 
                        fontSize: '14px', 
                        letterSpacing: '2px', 
                        textTransform: 'uppercase',
                        color: '#d4af37',
                        marginBottom: '20px',
                        opacity: 0.9
                    }} className="fade-in">
                        Welcome Back
                    </div>

                    <div style={{ 
                        fontFamily: "'Playfair Display', serif", 
                        fontSize: '56px', 
                        lineHeight: '1.1',
                        marginBottom: '32px',
                        color: '#f4f3f0'
                    }} className="fade-in delay-1">
                        Curated<br/>Excellence.
                    </div>
                    
                    <p style={{ 
                        fontSize: '18px', 
                        lineHeight: '1.6', 
                        color: '#a3b8b0',
                        marginBottom: '56px',
                        fontWeight: 300
                    }} className="fade-in delay-2">
                       &quot;Style is a way to say who you are, without having to speak.&quot;
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
                    }} className="fade-in delay-3">
                        <span>New Collections</span>
                        <div style={{width: 4, height: 4, background: '#d4af37', borderRadius: '50%'}} />
                        <span>Member Exclusive</span>
                    </div>
                </div>
            </div>

            {/* Right: Login Form (Beige/Light) */}
            <div style={{ 
                background: '#f4f3f0', 
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
                            Sign In
                        </h2>
                        <p style={{ color: '#5c6b66', fontSize: '15px' }}>
                            New to Legacy? <Link href="/signup" style={{ color: '#d4af37', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }} className="hover:text-primary">Create an account</Link>
                        </p>
                    </div>

                    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#1a3c34', textTransform: 'uppercase', letterSpacing: '1px' }}>Email</label>
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
                                    color: '#1a3c34'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: '#1a3c34', textTransform: 'uppercase', letterSpacing: '1px' }}>Password</label>
                                <Link href="/forgot-password" style={{ fontSize: '12px', color: '#d4af37', textDecoration: 'none', fontWeight: 500 }}>Forgot Password?</Link>
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
                                    color: '#1a3c34'
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '32px 0' }}>
                        <div style={{ flex: 1, height: '1px', background: '#d1cfca' }}></div>
                        <span style={{ fontSize: '12px', color: '#5c6b66', textTransform: 'uppercase', letterSpacing: '1px' }}>Or continue with</span>
                        <div style={{ flex: 1, height: '1px', background: '#d1cfca' }}></div>
                    </div>

                    <a
                        href="/api/auth/google"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            width: '100%',
                            padding: '12px',
                            background: '#fff',
                            border: '1px solid #d1cfca',
                            borderRadius: '999px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1a3c34',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#f8f8f8'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Sign in with Google
                    </a>

                    <p style={{ textAlign: 'center', marginTop: '40px', fontSize: '12px', color: '#a3b8b0' }}>
                        &copy; {new Date().getFullYear()} Legacy Store. Secure Login.
                    </p>
                </div>
            </div>
        </div>
    );
}
