'use client';

import { useState, useEffect } from 'react';
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
      await closePeriod(periodId, 'admin-id-placeholder');
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

  const openCount = periods.filter(p => p.status === 'open').length;
  const closedCount = periods.filter(p => p.status === 'closed' || p.status === 'locked').length;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'open': return { bg: 'bg-green-100', text: 'text-green-800', icon: '🟢' };
      case 'closed': return { bg: 'bg-red-100', text: 'text-red-800', icon: '🔴' };
      case 'locked': return { bg: 'bg-gray-100', text: 'text-gray-800', icon: '🔒' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-800', icon: '⚪' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#12403C]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#12403C]">Financial Periods</h1>
          <p className="text-gray-500">Manage accounting cycles and period locking</p>
        </div>
        <button 
          onClick={loadPeriods}
          className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Total Periods</span>
            <span className="text-lg">📅</span>
          </div>
          <div className="text-xl font-bold text-[#12403C]">{periods.length}</div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Open Periods</span>
            <span className="text-lg">🟢</span>
          </div>
          <div className="text-xl font-bold text-green-600">{openCount}</div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Closed Periods</span>
            <span className="text-lg">🔒</span>
          </div>
          <div className="text-xl font-bold text-red-600">{closedCount}</div>
        </div>
      </div>

      {/* Periods Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Period</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dates</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Closed By</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {periods.map(period => {
              const statusStyle = getStatusStyle(period.status);
              return (
                <tr key={period.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">{period.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600 capitalize">{period.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                      {statusStyle.icon} {period.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {new Date(period.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                      {new Date(period.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {period.closedBy ? (
                      <div>
                        <div className="text-sm text-gray-900">{period.closedBy}</div>
                        {period.closedAt && (
                          <div className="text-xs text-gray-400">
                            {new Date(period.closedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {period.status === 'open' && (
                      <button 
                        onClick={() => handleClose(period.id)}
                        disabled={!!actionLoading}
                        className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === period.id ? 'Closing...' : '🔒 Close'}
                      </button>
                    )}
                    {(period.status === 'closed' || period.status === 'locked') && (
                      <button 
                        onClick={() => handleReopen(period.id)}
                        disabled={!!actionLoading}
                        className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === period.id ? 'Reopening...' : '🔓 Reopen'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {periods.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  <span className="text-4xl block mb-2">📅</span>
                  No periods found. Periods are auto-created when transactions occur.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-semibold text-blue-800 flex items-center gap-2">
          <span>ℹ️</span>
          About Financial Periods
        </h4>
        <p className="text-sm text-blue-700 mt-2">
          Financial periods help you organize your accounting records. Once a period is closed, 
          no new transactions can be added to it, ensuring data integrity for reporting and audits.
        </p>
      </div>
    </div>
  );
}
