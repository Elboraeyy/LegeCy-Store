'use client';

import { useActionState } from 'react';
import { adminLogin } from '@/lib/actions/admin-auth';
import '../admin.css';

function SubmitButton() {
    return (
        <button 
            type="submit" 
            className="admin-btn admin-btn-primary"
            style={{ 
                width: '100%', 
                marginTop: '16px',
            }}
        >
            AUTHENTICATE
        </button>
    );
}

export default function AdminLoginPage() {
    const [state, formAction] = useActionState(adminLogin, null);

    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'grid', 
            gridTemplateColumns: 'minmax(300px, 1fr) minmax(400px, 1.5fr)',
            background: '#f4f3f0'
        }}>
            {/* Left: Brand Side (Green) */}
            <div style={{ 
                background: '#1a3c34', 
                padding: '60px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center',
                color: '#e8e6e1',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    background: 'radial-gradient(circle at 10% 20%, rgba(212, 175, 55, 0.05) 0%, transparent 20%)',
                    zIndex: 0
                }} />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '400px' }}>
                     <div style={{ 
                        fontFamily: "'Playfair Display', serif", 
                        fontSize: '48px', 
                        lineHeight: '1.1',
                        marginBottom: '24px',
                        color: '#d4af37'
                    }}>
                        Legacy<br/>Admin
                    </div>
                    <p style={{ 
                        fontSize: '16px', 
                        lineHeight: '1.6', 
                        color: '#a3b8b0',
                        marginBottom: '48px'
                    }}>
                        Orchestrate excellence. Manage your inventory, orders, and customer relationships from one central command center.
                    </p>
                    
                    <div style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        alignItems: 'center', 
                        fontSize: '12px', 
                        letterSpacing: '1px', 
                        textTransform: 'uppercase',
                        color: '#5c6b66'
                    }}>
                        <span>Secure</span> • <span>Fast</span> • <span>Reliable</span>
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
                <div style={{ width: '100%', maxWidth: '420px' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <h2 style={{ 
                            fontSize: '28px', 
                            color: '#1a3c34', 
                            marginBottom: '8px', 
                            fontFamily: "'Playfair Display', serif" 
                        }}>
                            Welcome Back
                        </h2>
                        <p style={{ color: '#5c6b66' }}>Please enter your credentials to access the dashboard.</p>
                    </div>

                    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="admin-form-group" style={{ marginBottom: 0 }}>
                            <label className="admin-label">Email Address</label>
                            <input 
                                name="email" 
                                type="email" 
                                autoComplete="email" 
                                required 
                                className="admin-input"
                                placeholder="admin@legacystore.com"
                                style={{ background: '#fff' }}
                            />
                        </div>

                        <div className="admin-form-group" style={{ marginBottom: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label className="admin-label" style={{ marginBottom: 0 }}>Password</label>
                                <a href="#" style={{ fontSize: '12px', color: '#1a3c34', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</a>
                            </div>
                            <input 
                                name="password" 
                                type="password" 
                                autoComplete="current-password" 
                                required 
                                className="admin-input"
                                placeholder="••••••••••••"
                                style={{ background: '#fff' }}
                            />
                        </div>

                        {state?.error && (
                            <div style={{ 
                                color: '#991b1b', 
                                background: '#fef2f2', 
                                border: '1px solid #fecaca', 
                                padding: '12px', 
                                borderRadius: '6px', 
                                fontSize: '13px', 
                                textAlign: 'center' 
                            }}>
                                {state.error}
                            </div>
                        )}

                        <SubmitButton />
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '12px', color: '#a3b8b0' }}>
                        Protected by Legacy Security Systems v2.1
                    </p>
                </div>
            </div>
        </div>
    );
}
