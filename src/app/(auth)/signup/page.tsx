'use client';

import { useActionState } from 'react';
import { signup } from '@/lib/actions/auth';
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
                boxShadow: '0 4px 12px rgba(18, 64, 60, 0.2)'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(18, 64, 60, 0.3)';
                e.currentTarget.style.background = '#142f29';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(18, 64, 60, 0.2)';
                e.currentTarget.style.background = '#1a3c34';
            }}
        >
            CREATE ACCOUNT
        </button>
    );
}

export default function SignupPage() {
    const [state, formAction] = useActionState(signup, null);

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
                    box-shadow: 0 0 0 4px rgba(18, 64, 60, 0.1) !important;
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
                color: '#F5F0E3',
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
                        Join the Legacy
                    </div>

                    <div style={{ 
                        fontFamily: "'Playfair Display', serif", 
                        fontSize: '56px', 
                        lineHeight: '1.1',
                        marginBottom: '32px',
                        color: '#f4f3f0'
                    }} className="fade-in delay-1">
                        Begin Your<br/>Journey.
                    </div>
                    
                    <p style={{ 
                        fontSize: '18px', 
                        lineHeight: '1.6', 
                        color: '#a3b8b0',
                        marginBottom: '56px',
                        fontWeight: 300
                    }} className="fade-in delay-2">
                       Create an account to track orders, manage your wishlist, and receive exclusive offers.
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
                        <span>Fast Checkout</span>
                        <div style={{width: 4, height: 4, background: '#d4af37', borderRadius: '50%'}} />
                        <span>Order Tracking</span>
                    </div>
                </div>
            </div>

            {/* Right: Signup Form (Beige/Light) */}
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
                            Create Account
                        </h2>
                        <p style={{ color: '#5c6b66', fontSize: '15px' }}>
                            Already a member? <Link href="/login" style={{ color: '#d4af37', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }} className="hover:text-primary">Sign in</Link>
                        </p>
                    </div>

                    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#1a3c34', textTransform: 'uppercase', letterSpacing: '1px' }}>Full Name</label>
                            <input 
                                name="name" 
                                type="text" 
                                autoComplete="name" 
                                required 
                                placeholder="John Doe"
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
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#1a3c34', textTransform: 'uppercase', letterSpacing: '1px' }}>Password</label>
                            <input 
                                name="password" 
                                type="password" 
                                autoComplete="new-password" 
                                required 
                                placeholder="Min. 8 characters"
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

                    <p style={{ textAlign: 'center', marginTop: '40px', fontSize: '12px', color: '#a3b8b0' }}>
                        By joining, you agree to our Terms of Service.
                    </p>
                </div>
            </div>
        </div>
    );
}
