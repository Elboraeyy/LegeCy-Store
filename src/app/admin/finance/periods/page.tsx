'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getFinancialPeriods, closePeriod, reopenPeriod } from '@/lib/services/accountingPeriodService';
import { FinancialPeriod } from '@prisma/client';

export default function FinancialPeriodsPage() {
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPeriods();
  }, []);

  async function loadPeriods() {
    try {
      const data = await getFinancialPeriods();
      setPeriods(data);
    } catch (error) {
      console.error('Failed to load periods:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleClose(periodId: string) {
    if (!confirm('Are you sure you want to CLOSE this period? No more transactions will be allowed.')) return;
    
    setActionLoading(periodId);
    try {
      await closePeriod(periodId, 'admin-id-placeholder'); // TODO: Get actual admin ID
      await loadPeriods();
    } catch (e) {
      alert('Failed to close period: ' + e);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReopen(periodId: string) {
    const reason = prompt('Reason for reopening this CLOSED period? (Audit Trail)');
    if (!reason) return;
    
    setActionLoading(periodId);
    try {
      await reopenPeriod(periodId, 'admin-id-placeholder', reason);
      await loadPeriods();
    } catch (e) {
      alert('Failed to reopen period: ' + e);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <Link href="/admin/finance" className="back-link">← Back to Finance</Link>
          <h1>Financial Periods</h1>
          <p className="page-subtitle">Manage accounting cycles and strict period locking.</p>
        </div>
        <div>
          <button className="admin-btn admin-btn-secondary" onClick={loadPeriods}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="admin-card">
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Period Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Dates</th>
                <th>Closed By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {periods.map(period => (
                <tr key={period.id}>
                  <td style={{ fontWeight: 600 }}>{period.name}</td>
                  <td style={{ textTransform: 'capitalize' }}>{period.type}</td>
                  <td>
                    <span className={`status-badge status-${period.status}`}>
                      {period.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                  </td>
                  <td style={{ fontSize: '12px' }}>
                    {period.closedBy ? (
                      <div>
                        <div>{period.closedBy}</div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          {period.closedAt && new Date(period.closedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ) : '-'}
                  </td>
                  <td>
                    {period.status === 'open' && (
                      <button 
                        className="admin-btn admin-btn-danger admin-btn-sm"
                        onClick={() => handleClose(period.id)}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === period.id ? 'Closing...' : '🔒 Close Period'}
                      </button>
                    )}
                    {(period.status === 'closed' || period.status === 'locked') && (
                      <button 
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        onClick={() => handleReopen(period.id)}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === period.id ? 'Reopening...' : '🔓 Reopen'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {periods.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
                    No periods found. Periods are auto-created when transactions occur.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
