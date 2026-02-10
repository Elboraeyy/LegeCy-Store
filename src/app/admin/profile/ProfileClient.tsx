'use client';

import Link from 'next/link';
import '@/app/admin/admin.css';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

interface ProfileClientProps {
    adminUser: {
        id: string;
        name: string | null;
        email: string;
        role: { name: string } | null;
        createdAt: Date;
        lastLoginAt: Date | null;
    };
    session: {
        id: string;
        expiresAt: Date;
    };
    stats: {
        totalOrders: number;
        todayOrders: number;
        revenueValue: string;
        activeSessions: number;
    };
}

export default function ProfileClient({ adminUser, session, stats }: ProfileClientProps) {
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
    const { profile: tp } = t;

    const memberSince = new Date(adminUser.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
    });

    const lastLogin = adminUser.lastLoginAt 
        ? new Date(adminUser.lastLoginAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        })
        : (tp?.not_set || 'N/A');

    const roleName = adminUser.role?.name || 'Admin';

    return (
        <div>
            {/* Header */}
            <div className="admin-header" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 className="admin-title">{tp?.title || 'My Profile'}</h1>
                    <p className="admin-subtitle">{tp?.subtitle || 'Manage your account settings'}</p>
                </div>
            </div>

            {/* Profile Card */}
            <div className="admin-card" style={{ 
                background: 'linear-gradient(135deg, #12403C, #2d5a4e)',
                color: '#fff',
                padding: '40px',
                marginBottom: '24px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background Pattern */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '300px',
                    height: '100%',
                    background: 'radial-gradient(circle at 80% 50%, rgba(212, 175, 55, 0.1), transparent 50%)',
                    pointerEvents: 'none',
                    transform: language === 'ar' ? 'scaleX(-1)' : 'none',
                    left: language === 'ar' ? 0 : 'auto'
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', position: 'relative' }}>
                    {/* Avatar */}
                    <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #d4af37, #f0d060)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '40px',
                        fontWeight: 700,
                        color: '#12403C',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                    }}>
                        {(adminUser.name || adminUser.email).charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>
                            {adminUser.name || tp?.full_name || 'Admin User'}
                        </h2>
                        <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: '15px' }}>
                            {adminUser.email}
                        </p>
                        <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
                            <span style={{
                                background: 'rgba(212, 175, 55, 0.2)',
                                padding: '6px 16px',
                                borderRadius: '99px',
                                fontSize: '12px',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                {roleName}
                            </span>
                            <span style={{
                                background: 'rgba(255,255,255,0.1)',
                                padding: '6px 16px',
                                borderRadius: '99px',
                                fontSize: '12px'
                            }}>
                                {tp?.member_since || 'Member since'} {memberSince}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <StatCard icon="🛍️" label={tp?.total_orders || 'Total Orders'} value={stats.totalOrders.toLocaleString()} />
                <StatCard icon="📦" label={tp?.today_orders || "Today's Orders"} value={stats.todayOrders.toLocaleString()} />
                <StatCard icon="💰" label={tp?.total_revenue || 'Total Revenue'} value={`${stats.revenueValue}K EGP`} />
                <StatCard icon="🔐" label={tp?.active_sessions || 'Active Sessions'} value={stats.activeSessions.toString()} />
            </div>

            {/* Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                
                {/* Left Column */}
                <div>
                    {/* Account Information */}
                    <div className="admin-card" style={{ marginBottom: '24px' }}>
                        <h3 className="stat-label" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '18px' }}>👤</span> {tp?.account_info || 'Account Information'}
                        </h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <InfoItem label={tp?.full_name || "Full Name"} value={adminUser.name || (tp?.not_set || 'Not set')} />
                            <InfoItem label={tp?.email_address || "Email Address"} value={adminUser.email} />
                            <InfoItem label={tp?.role || "Role"} value={roleName} />
                            <InfoItem label={tp?.last_login || "Last Login"} value={lastLogin} />
                            <InfoItem label={tp?.account_created || "Account Created"} value={memberSince} />
                            <InfoItem label={tp?.admin_id || "Admin ID"} value={adminUser.id.slice(0, 8) + '...'} />
                        </div>
                    </div>

                    {/* Security Settings */}
                    <div className="admin-card" style={{ marginBottom: '24px' }}>
                        <h3 className="stat-label" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '18px' }}>🔒</span> {tp?.security_settings || 'Security Settings'}
                        </h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <SecurityItem 
                                icon="🔑" 
                                title={tp?.password || "Password"} 
                                description={tp?.change_password || "Change your account password"}
                                action={tp?.change || "Change"}
                                href="#"
                            />
                            <SecurityItem 
                                icon="📱" 
                                title={tp?.two_factor || "Two-Factor Authentication"} 
                                description={tp?.two_factor_desc || "Add an extra layer of security"}
                                action={tp?.enable || "Enable"}
                                href="#"
                                status="disabled"
                                statusLabel={tp?.disabled || "Disabled"}
                            />
                            <SecurityItem 
                                icon="🖥️" 
                                title={tp?.active_sessions || "Active Sessions"} 
                                description={(tp?.active_sessions_count || "{count} active session(s)").replace('{count}', stats.activeSessions.toString())}
                                action={tp?.view || "View"}
                                href="#"
                            />
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="admin-card">
                        <h3 className="stat-label" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '18px' }}>⚙️</span> {tp?.preferences || 'Preferences'}
                        </h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <PreferenceItem 
                                icon="🌙" 
                                title={tp?.dark_mode || "Dark Mode"} 
                                description={tp?.dark_mode_desc || "Use dark theme for the admin panel"}
                                enabled={false}
                            />
                            <PreferenceItem 
                                icon="🔔" 
                                title={tp?.email_notifications || "Email Notifications"} 
                                description={tp?.email_notifications_desc || "Receive email for new orders"}
                                enabled={true}
                            />
                            <PreferenceItem 
                                icon="📊" 
                                title={tp?.dashboard_analytics || "Dashboard Analytics"} 
                                description={tp?.dashboard_analytics_desc || "Show analytics on dashboard"}
                                enabled={true}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div>
                    {/* Quick Links */}
                    <div className="admin-card" style={{ marginBottom: '24px' }}>
                        <h3 className="stat-label" style={{ marginBottom: '16px' }}>{tp?.quick_links || 'Quick Links'}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <QuickLink href="/admin/orders" icon="🛍️" label={tp?.manage_orders || "Manage Orders"} />
                            <QuickLink href="/admin/products" icon="📦" label={tp?.manage_products || "Manage Products"} />
                            <QuickLink href="/admin/customers" icon="👥" label={tp?.view_customers || "View Customers"} />
                            <QuickLink href="/admin/analytics" icon="📈" label={tp?.view_analytics || "View Analytics"} />
                            <QuickLink href="/admin/config" icon="⚙️" label={tp?.store_settings || "Store Settings"} />
                        </div>
                    </div>

                    {/* Session Info */}
                    <div className="admin-card" style={{ marginBottom: '24px' }}>
                        <h3 className="stat-label" style={{ marginBottom: '16px' }}>{tp?.current_session || 'Current Session'}</h3>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>{tp?.session_id || 'Session ID'}:</span>
                                <span style={{ fontFamily: 'monospace' }}>{session.id.slice(0, 8)}...</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>{tp?.expires || 'Expires'}:</span>
                                <span>{new Date(session.expiresAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{tp?.status || 'Status'}:</span>
                                <span style={{ color: '#166534' }}>● {tp?.active || 'Active'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="admin-card" style={{ border: '1px solid #fee2e2', background: '#fef2f2' }}>
                        <h3 className="stat-label" style={{ marginBottom: '16px', color: '#b91c1c' }}>{tp?.danger_zone || 'Danger Zone'}</h3>
                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
                            {tp?.danger_desc || 'Irreversible actions. Please be careful.'}
                        </p>
                        <form action="/api/admin/logout" method="POST">
                            <button 
                                type="submit"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: '#b91c1c',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                🚪 {tp?.logout || 'Logout'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper Components
function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div className="admin-card" style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#12403C', marginBottom: '4px' }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{label}</div>
        </div>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                {label}
            </div>
            <div style={{ fontSize: '15px', fontWeight: 500, color: '#333' }}>{value}</div>
        </div>
    );
}

function SecurityItem({ icon, title, description, action, href, status, statusLabel }: { 
    icon: string; 
    title: string; 
    description: string; 
    action: string;
    href: string;
    status?: 'enabled' | 'disabled';
    statusLabel?: string;
}) {
    return (
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '10px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>{icon}</span>
                <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {title}
                        {status && (
                            <span style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                borderRadius: '99px',
                                background: status === 'enabled' ? '#dcfce7' : '#fee2e2',
                                color: status === 'enabled' ? '#166534' : '#b91c1c'
                            }}>
                                {statusLabel || (status === 'enabled' ? 'Enabled' : 'Disabled')}
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{description}</div>
                </div>
            </div>
            <Link 
                href={href}
                style={{
                    padding: '8px 16px',
                    background: '#1a3c34',
                    color: '#fff',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    textDecoration: 'none'
                }}
            >
                {action}
            </Link>
        </div>
    );
}

function PreferenceItem({ icon, title, description, enabled }: { 
    icon: string; 
    title: string; 
    description: string; 
    enabled: boolean;
}) {
    return (
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '10px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>{icon}</span>
                <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>{title}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{description}</div>
                </div>
            </div>
            <div style={{
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                background: enabled ? '#1a3c34' : '#d1d5db',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.2s'
            }}>
                <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: '3px',
                    left: enabled ? '23px' : '3px',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }} />
            </div>
        </div>
    );
}

function QuickLink({ href, icon, label }: { href: string; icon: string; label: string }) {
    return (
        <Link 
            href={href}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: '#f9fafb',
                borderRadius: '8px',
                textDecoration: 'none',
                color: '#333',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'background 0.15s'
            }}
        >
            <span style={{ fontSize: '18px' }}>{icon}</span>
            {label}
        </Link>
    );
}
