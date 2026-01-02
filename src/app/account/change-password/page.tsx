'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { changePassword } from '@/lib/actions/auth';

export default function ChangePasswordPage() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword.length < 8) {
            toast.error('New password must be at least 8 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            const result = await changePassword(currentPassword, newPassword);
            
            if (result.success) {
                toast.success('Password changed successfully');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                toast.error(result.error || 'Failed to change password');
            }
        } catch {
            toast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main>
            <section className="shop-hero">
                <div className="container">
                    <h1 className="fade-in">Change Password</h1>
                    <p className="fade-in">Update your account password</p>
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
                        ← Back to My Account
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
                                    Current Password
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
                                    New Password
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
                                    Minimum 8 characters
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
                                    Confirm New Password
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
                                {isLoading ? 'Updating...' : 'Change Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        </main>
    );
}
