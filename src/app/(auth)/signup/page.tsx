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
            gridTemplateColumns: '1fr 2fr',
            background: '#F5F0E3'
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
                        overflow-y: auto !important; /* Page-level scroll */
                        overflow-x: hidden;
                    }

                    /* 1. Green Header (Top portion) */
                    .auth-brand-side { 
                        height: 45vh !important; /* Occupy top 45% */
                        width: 100% !important;
                        padding: 40px 20px !important;
                        
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: center !important;
                        align-items: center !important;
                        
                        position: relative;
                        z-index: 1;
                    }

                    /* Content Scaling */
                    .auth-brand-side .brand-title { 
                        display: block !important; 
                        font-size: 32px !important; 
                        line-height: 1.1 !important;
                        margin-bottom: 16px !important;
                        text-align: center;
                    }
                    .auth-brand-side .brand-subtitle { 
                        display: block !important; 
                        font-size: 10px !important;
                        margin-bottom: 12px !important;
                        text-align: center;
                    }
                    /* Simplified content for mobile header space */
                    .auth-brand-side .brand-quote { 
                        display: none !important; 
                    }
                    .auth-brand-side .brand-footer { 
                        display: none !important; 
                    }
                    
                    /* Hide duplicate mobile header */
                    .mobile-brand-header { display: none !important; }

                    /* 2. White Form Sheet */
                    .auth-form-side { 
                        min-height: 100vh !important;
                        width: 100% !important;
                        
                        background: #F5F0E3 !important;
                        border-radius: 30px 30px 0 0 !important;
                        margin-top: -30px !important; /* Overlap header */
                        padding: 40px 24px !important;
                        
                        display: block !important;
                        position: relative;
                        z-index: 2;
                        box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
                    }
                    
                    .auth-form-side > div {
                        max-width: 100% !important;
                        width: 100% !important;
                        margin: 0 auto;
                    }

                     /* Optional: Drag indicator handle */
                    .auth-form-side::before {
                        content: '';
                        display: block;
                        width: 40px;
                        height: 4px;
                        background: #d1cfca;
                        border-radius: 2px;
                        margin: -10px auto 30px auto; /* Centered top handle */
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

                 {/* Mobile Scroll Indicator */}
                <div className="scroll-indicator">
                    <span style={{marginBottom: '8px'}}>Scroll to Sign Up</span>
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
                        Join the Legacy
                    </div>

                    <div style={{ 
                        fontFamily: "'Playfair Display', serif", 
                        fontSize: '56px', 
                        lineHeight: '1.1',
                        marginBottom: '32px',
                        color: '#f4f3f0'
                    }} className="fade-in delay-1 brand-title">
                        Begin Your<br/>Journey.
                    </div>
                    
                    <p style={{ 
                        fontSize: '18px', 
                        lineHeight: '1.6', 
                        color: '#a3b8b0',
                        marginBottom: '56px',
                        fontWeight: 300
                    }} className="fade-in delay-2 brand-quote">
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
                    }} className="fade-in delay-3 brand-footer">
                        <span>Fast Checkout</span>
                        <div style={{width: 4, height: 4, background: '#d4af37', borderRadius: '50%'}} />
                        <span>Order Tracking</span>
                    </div>
                </div>
            </div>

            {/* Right: Signup Form (Beige/Light) */}
            <div className="auth-form-side" style={{ 
                background: '#F5F0E3', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '40px'
            }}>
                <div style={{ width: '100%', maxWidth: '400px' }} className="fade-in">
                    <div style={{ marginBottom: '48px', textAlign: 'center' }}>
                        <h2 style={{ 
                            fontSize: '32px', 
                            color: '#12403C', 
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
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#12403C', textTransform: 'uppercase', letterSpacing: '1px' }}>Full Name</label>
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
                                    background: '#ffffff',
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
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#12403C', textTransform: 'uppercase', letterSpacing: '1px' }}>Email</label>
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
                                    background: '#ffffff',
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
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#12403C', textTransform: 'uppercase', letterSpacing: '1px' }}>Password</label>
                            <input 
                                name="password" 
                                type="password" 
                                autoComplete="new-password" 
                                required 
                                placeholder="Min. 7 characters"
                                className="auth-input"
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    background: '#ffffff',
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

                    <p style={{ textAlign: 'center', marginTop: '40px', fontSize: '12px', color: '#a3b8b0' }}>
                        By joining, you agree to our Terms of Service.
                    </p>
                </div>
            </div>
        </div>
    );
}
