import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import '@/app/admin/admin.css';

export const dynamic = 'force-dynamic';

export default async function AdminProfilePage() {
    const { user: adminUser, session } = await validateAdminSession();
    if (!adminUser || !session) redirect('/admin/login');

    // Get admin stats
    const [
        totalOrders,
        todayOrders,
        totalRevenue,
        activeSessions
    ] = await prisma.$transaction([
        prisma.order.count(),
        prisma.order.count({
            where: {
                createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
            }
        }),
        prisma.order.aggregate({
            where: { status: { not: 'cancelled' } },
            _sum: { totalPrice: true }
        }),
        prisma.adminSession.count({
            where: {
                expiresAt: { gt: new Date() }
            }
        })
    ]);

    const memberSince = adminUser.createdAt.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
    });

    const lastLogin = adminUser.lastLoginAt 
        ? adminUser.lastLoginAt.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        })
        : 'N/A';

    const roleName = adminUser.role?.name || 'Admin';
    const revenueValue = totalRevenue._sum.totalPrice 
        ? (Number(totalRevenue._sum.totalPrice) / 1000).toFixed(1) 
        : '0';

    return (
        <div>
            {/* Header */}
            <div className="admin-header" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 className="admin-title">My Profile</h1>
                    <p className="admin-subtitle">Manage your account settings</p>
                </div>
            </div>

            {/* Profile Card */}
            <div className="admin-card" style={{ 
                background: 'linear-gradient(135deg, #1a3c34, #2d5a4e)',
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
                    pointerEvents: 'none'
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
                        color: '#1a3c34',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                    }}>
                        {(adminUser.name || adminUser.email).charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>
                            {adminUser.name || 'Admin User'}
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
                                Member since {memberSince}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <StatCard icon="🛍️" label="Total Orders" value={totalOrders.toLocaleString()} />
                <StatCard icon="📦" label="Today's Orders" value={todayOrders.toLocaleString()} />
                <StatCard icon="💰" label="Total Revenue" value={`${revenueValue}K EGP`} />
                <StatCard icon="🔐" label="Active Sessions" value={activeSessions.toString()} />
            </div>

            {/* Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                
                {/* Left Column */}
                <div>
                    {/* Account Information */}
                    <div className="admin-card" style={{ marginBottom: '24px' }}>
                        <h3 className="stat-label" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '18px' }}>👤</span> Account Information
                        </h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <InfoItem label="Full Name" value={adminUser.name || 'Not set'} />
                            <InfoItem label="Email Address" value={adminUser.email} />
                            <InfoItem label="Role" value={roleName} />
                            <InfoItem label="Last Login" value={lastLogin} />
                            <InfoItem label="Account Created" value={memberSince} />
                            <InfoItem label="Admin ID" value={adminUser.id.slice(0, 8) + '...'} />
                        </div>
                    </div>

                    {/* Security Settings */}
                    <div className="admin-card" style={{ marginBottom: '24px' }}>
                        <h3 className="stat-label" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '18px' }}>🔒</span> Security Settings
                        </h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <SecurityItem 
                                icon="🔑" 
                                title="Password" 
                                description="Change your account password"
                                action="Change"
                                href="#"
                            />
                            <SecurityItem 
                                icon="📱" 
                                title="Two-Factor Authentication" 
                                description="Add an extra layer of security"
                                action="Enable"
                                href="#"
                                status="disabled"
                            />
                            <SecurityItem 
                                icon="🖥️" 
                                title="Active Sessions" 
                                description={`${activeSessions} active session(s)`}
                                action="View"
                                href="#"
                            />
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="admin-card">
                        <h3 className="stat-label" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '18px' }}>⚙️</span> Preferences
                        </h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <PreferenceItem 
                                icon="🌙" 
                                title="Dark Mode" 
                                description="Use dark theme for the admin panel"
                                enabled={false}
                            />
                            <PreferenceItem 
                                icon="🔔" 
                                title="Email Notifications" 
                                description="Receive email for new orders"
                                enabled={true}
                            />
                            <PreferenceItem 
                                icon="📊" 
                                title="Dashboard Analytics" 
                                description="Show analytics on dashboard"
                                enabled={true}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div>
                    {/* Quick Links */}
                    <div className="admin-card" style={{ marginBottom: '24px' }}>
                        <h3 className="stat-label" style={{ marginBottom: '16px' }}>Quick Links</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <QuickLink href="/admin/orders" icon="🛍️" label="Manage Orders" />
                            <QuickLink href="/admin/products" icon="📦" label="Manage Products" />
                            <QuickLink href="/admin/customers" icon="👥" label="View Customers" />
                            <QuickLink href="/admin/analytics" icon="📈" label="View Analytics" />
                            <QuickLink href="/admin/config" icon="⚙️" label="Store Settings" />
                        </div>
                    </div>

                    {/* Session Info */}
                    <div className="admin-card" style={{ marginBottom: '24px' }}>
                        <h3 className="stat-label" style={{ marginBottom: '16px' }}>Current Session</h3>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>Session ID:</span>
                                <span style={{ fontFamily: 'monospace' }}>{session.id.slice(0, 8)}...</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>Expires:</span>
                                <span>{session.expiresAt.toLocaleDateString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Status:</span>
                                <span style={{ color: '#166534' }}>● Active</span>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="admin-card" style={{ border: '1px solid #fee2e2', background: '#fef2f2' }}>
                        <h3 className="stat-label" style={{ marginBottom: '16px', color: '#b91c1c' }}>Danger Zone</h3>
                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
                            Irreversible actions. Please be careful.
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
                                🚪 Logout
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
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a3c34', marginBottom: '4px' }}>{value}</div>
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

function SecurityItem({ icon, title, description, action, href, status }: { 
    icon: string; 
    title: string; 
    description: string; 
    action: string;
    href: string;
    status?: 'enabled' | 'disabled';
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
                                {status === 'enabled' ? 'Enabled' : 'Disabled'}
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
