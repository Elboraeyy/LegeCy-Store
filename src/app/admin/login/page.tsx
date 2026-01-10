'use client';

import { useActionState } from 'react';
import { adminLogin } from '@/lib/actions/admin-auth';
import '../admin.css';
import { useUncontrolledFormPersistence } from '@/hooks/useFormPersistence';

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
                boxShadow: '0 4px 12px rgba(26, 60, 52, 0.2)'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(26, 60, 52, 0.3)';
                e.currentTarget.style.background = '#12302a';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(26, 60, 52, 0.2)';
                e.currentTarget.style.background = '#12403C';
            }}
        >
            AUTHENTICATE
        </button>
    );
}

export default function AdminLoginPage() {
    const [state, formAction] = useActionState(adminLogin, null);
    const { containerRef } = useUncontrolledFormPersistence('admin_login_form');

    return (
        <div className="admin-auth-container" style={{ 
            minHeight: '100vh', 
            display: 'grid', 
            gridTemplateColumns: '1fr 2fr',
            background: '#F5F0E3'
        }}>
            {/* Mobile Responsive Styles */}
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fade-in { animation: fadeIn 0.6s ease-out forwards; }
                .delay-1 { animation-delay: 0.1s; }
                .delay-2 { animation-delay: 0.2s; }
                
                .admin-auth-input:focus {
                    border-color: #12403C !important;
                    box-shadow: 0 0 0 4px rgba(26, 60, 52, 0.1) !important;
                }

                @media (max-width: 900px) {
                    .admin-auth-container { 
                        display: block !important;
                        background: #12403C !important;
                        height: 100vh;
                        overflow-y: scroll;
                        scroll-snap-type: y mandatory;
                        scroll-behavior: smooth;
                    }

                    /* Brand Side (Top 35vh) */
                    .admin-auth-brand { 
                        height: 35vh !important;
                        width: 100% !important;
                        padding: 24px 20px !important;
                        scroll-snap-align: start;
                        
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: center !important;
                        align-items: center !important;
                        text-align: center !important;
                        
                        position: relative;
                        z-index: 1;
                    }
                    
                    .admin-auth-brand .brand-title { 
                        font-size: 32px !important;
                        line-height: 1.1 !important;
                        margin-bottom: 8px !important;
                    }
                    
                    .admin-auth-brand .brand-subtitle { 
                        font-size: 12px !important;
                        margin-bottom: 8px !important;
                    }
                    
                    .admin-auth-brand .brand-desc { 
                        font-size: 11px !important;
                        max-width: 90% !important;
                    }
                    
                    .admin-auth-brand .brand-footer { 
                        display: none !important;
                    }

                    /* Form Side (Full Height) */
                    .admin-auth-form { 
                        height: 100vh !important;
                        width: 100% !important;
                        scroll-snap-align: start;
                        scroll-snap-stop: always;
                        
                        background: #f4f3f0 !important;
                        border-radius: 30px 30px 0 0 !important;
                        margin-top: -20px !important;
                        padding: 48px 24px !important;
                        
                        display: flex !important;
                        align-items: flex-start !important;
                        justify-content: center !important;
                        padding-top: 48px !important;
                        
                        position: relative;
                        z-index: 2;
                        box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
                    }
                    
                    .admin-auth-form > div {
                        max-width: 100% !important;
                        width: 100% !important;
                    }

                    /* Drag Handle */
                    .admin-auth-form::before {
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
                    
                    .admin-auth-form h2 { 
                        text-align: center !important;
                        font-size: 24px !important; 
                    }
                    
                    .admin-auth-form .form-subtitle { 
                        text-align: center !important;
                    }
                }
            `}</style>

            {/* Left: Brand Side (Green) */}
            <div className="admin-auth-brand" style={{ 
                background: '#12403C', 
                padding: '60px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center',
                color: '#F5F0E3',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative background */}
                <div style={{
                    position: 'absolute',
                    top: '-10%',
                    left: '-10%',
                    width: '600px',
                    height: '600px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, transparent 70%)',
                    zIndex: 0
                }} />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '400px' }}>
                    <div className="brand-title fade-in" style={{ 
                        fontFamily: "'Playfair Display', serif", 
                        fontSize: '48px', 
                        lineHeight: '1.1',
                        marginBottom: '24px',
                        color: '#d4af37'
                    }}>
                        Legacy<br/>Admin
                    </div>
                    <p className="brand-desc fade-in delay-1" style={{ 
                        fontSize: '16px', 
                        lineHeight: '1.6', 
                        color: '#a3b8b0',
                        marginBottom: '48px'
                    }}>
                        Orchestrate excellence. Manage your inventory, orders, and customer relationships from one central command center.
                    </p>
                    
                    <div className="brand-footer fade-in delay-2" style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        alignItems: 'center', 
                        fontSize: '12px', 
                        letterSpacing: '1px', 
                        textTransform: 'uppercase',
                        color: '#5c6b66',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        paddingTop: '24px'
                    }}>
                        <span>🔐 Secure</span>
                        <div style={{width: 4, height: 4, background: '#d4af37', borderRadius: '50%'}} />
                        <span>⚡ Fast</span>
                        <div style={{width: 4, height: 4, background: '#d4af37', borderRadius: '50%'}} />
                        <span>✓ Reliable</span>
                    </div>
                </div>
            </div>

            {/* Right: Login Form (Beige/Light) */}
            <div className="admin-auth-form" style={{ 
                background: '#F5F0E3', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '40px'
            }}>
                <div style={{ width: '100%', maxWidth: '400px' }} className="fade-in">
                    <div style={{ marginBottom: '40px' }}>
                        <h2 style={{ 
                            fontSize: '28px', 
                            color: '#12403C', 
                            marginBottom: '8px', 
                            fontFamily: "'Playfair Display', serif" 
                        }}>
                            Welcome Back
                        </h2>
                        <p className="form-subtitle" style={{ color: '#5c6b66', fontSize: '15px' }}>
                            Enter your credentials to access the dashboard.
                        </p>
                    </div>

                    <form ref={containerRef} action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#12403C', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Email Address
                            </label>
                            <input 
                                name="email" 
                                type="email" 
                                autoComplete="email" 
                                required 
                                placeholder="admin@legecystore.com"
                                className="admin-auth-input"
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
                                <label style={{ fontSize: '12px', fontWeight: 700, color: '#12403C', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Password
                                </label>
                            </div>
                            <input 
                                name="password" 
                                type="password" 
                                autoComplete="current-password" 
                                required 
                                placeholder="••••••••"
                                className="admin-auth-input"
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

                    <p style={{ textAlign: 'center', marginTop: '40px', fontSize: '12px', color: '#a3b8b0' }}>
                        🔒 Protected by Legacy Security Systems
                    </p>
                </div>
            </div>
        </div>
    );
}
