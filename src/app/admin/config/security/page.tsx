import { Metadata } from 'next';
import Link from 'next/link';
import { getKillSwitches } from '@/lib/killSwitches';
import KillSwitchPanel from './KillSwitchPanel';

export const metadata: Metadata = {
  title: 'Security & Kill Switches | Admin',
};

export const dynamic = 'force-dynamic';

export default async function SecurityPage() {
  const switches = await getKillSwitches();
  
  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <Link href="/admin/config" className="back-link">← Back to Settings</Link>
          <h1>Security & System Controls</h1>
          <p className="page-subtitle">Emergency controls and system security settings</p>
        </div>
      </div>

      <div className="admin-grid" style={{ gap: '24px' }}>
        {/* Kill Switches Section */}
        <div className="admin-card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <h2>🔴 Kill Switches</h2>
            <span className="badge badge-warning">Owner Only</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Emergency controls to disable critical system features. Use with caution.
          </p>
          
          <KillSwitchPanel initialSwitches={switches} />
        </div>

        {/* System Health */}
        <div className="admin-card">
          <div className="card-header">
            <h2>💚 System Health</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <HealthItem label="Database" status="healthy" />
            <HealthItem label="Rate Limiting" status="healthy" />
            <HealthItem label="Payment Gateway" status="healthy" />
            <HealthItem label="Email Service" status="healthy" />
          </div>
          <Link href="/api/admin/health" target="_blank" className="admin-btn admin-btn-secondary" style={{ marginTop: '16px', display: 'inline-block' }}>
            View Full Health Report →
          </Link>
        </div>

        {/* Security Log */}
        <div className="admin-card">
          <div className="card-header">
            <h2>📋 Recent Security Events</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            Recent kill switch changes and security events will appear here.
          </p>
          <Link href="/admin/activity" className="admin-btn admin-btn-secondary" style={{ marginTop: '16px', display: 'inline-block' }}>
            View Activity Log →
          </Link>
        </div>
      </div>
    </div>
  );
}

function HealthItem({ label, status }: { label: string; status: 'healthy' | 'degraded' | 'critical' }) {
  const statusColors = {
    healthy: '#22c55e',
    degraded: '#f59e0b',
    critical: '#ef4444'
  };
  
  const statusLabels = {
    healthy: 'Healthy',
    degraded: 'Degraded',
    critical: 'Critical'
  };
  
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
      <span>{label}</span>
      <span style={{ color: statusColors[status], fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusColors[status] }}></span>
        {statusLabels[status]}
      </span>
    </div>
  );
}
